-- =====================================================================
-- EGMTASKS Platform Overhaul — run this in the Supabase SQL editor.
-- Safe to re-run (uses IF NOT EXISTS / ON CONFLICT throughout).
-- Covers: tier prices, admin moderation flags, ads-as-tasks, tier
-- campaigns, evidence-based submissions, 3-generation referrals.
-- PayPal pieces (edge functions, paypal_orders table) will be added in
-- the next migration once credentials are configured.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Tier pricing: Bronze $5, Silver $100, Gold $1000
-- ---------------------------------------------------------------------
-- referral_plans uses `price` (dollars) in the existing schema; mirror with cents column.
alter table public.referral_plans
  add column if not exists price_cents int;

update public.referral_plans set price = 5,    price_cents = 500    where tier = 'bronze';
update public.referral_plans set price = 100,  price_cents = 10000  where tier = 'silver';
update public.referral_plans set price = 1000, price_cents = 100000 where tier = 'gold';

-- ---------------------------------------------------------------------
-- 2. Admin moderation flags + tier-locked tasks
-- ---------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'tier_level') then
    create type public.tier_level as enum ('bronze','silver','gold');
  end if;
end$$;

alter table public.tasks
  add column if not exists required_tier public.tier_level,
  add column if not exists hidden boolean not null default false,
  add column if not exists admin_notes text;

alter table public.advertisements
  add column if not exists hidden boolean not null default false,
  add column if not exists required_tier public.tier_level;

alter table public.market_submissions
  add column if not exists hidden boolean not null default false,
  add column if not exists admin_notes text;

-- ---------------------------------------------------------------------
-- 3. Evidence-based task submissions (social/install/like/etc.)
-- ---------------------------------------------------------------------
alter table public.task_submissions
  add column if not exists evidence_urls text[] default '{}'::text[],
  add column if not exists evidence_type text,
  add column if not exists handle_or_username text,
  add column if not exists action_date date,
  add column if not exists notes text;

-- ---------------------------------------------------------------------
-- 4. Tier-upgrade-via-ads campaigns
-- ---------------------------------------------------------------------
create table if not exists public.tier_campaigns (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  target_tier public.tier_level not null,
  target_cents int not null,
  progress_cents int not null default 0,
  status text not null default 'active' check (status in ('active','completed','cancelled')),
  started_at timestamptz not null default now(),
  completed_at timestamptz
);
create unique index if not exists tier_campaigns_one_active
  on public.tier_campaigns(user_id) where status = 'active';

grant select, insert, update on public.tier_campaigns to authenticated;
grant all on public.tier_campaigns to service_role;
alter table public.tier_campaigns enable row level security;

drop policy if exists "own tier_campaigns read" on public.tier_campaigns;
create policy "own tier_campaigns read" on public.tier_campaigns
  for select to authenticated using (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));
drop policy if exists "own tier_campaigns write" on public.tier_campaigns;
create policy "own tier_campaigns write" on public.tier_campaigns
  for insert to authenticated with check (user_id = auth.uid());
drop policy if exists "own tier_campaigns update" on public.tier_campaigns;
create policy "own tier_campaigns update" on public.tier_campaigns
  for update to authenticated using (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));

-- ---------------------------------------------------------------------
-- 5. Referral chain (3 generations) + ledger
-- ---------------------------------------------------------------------
alter table public.profiles
  add column if not exists referred_by uuid references public.profiles(id),
  add column if not exists active_tier public.tier_level;

create table if not exists public.referrals (
  id uuid primary key default gen_random_uuid(),
  referrer_id uuid not null references auth.users(id) on delete cascade,
  referred_id uuid not null references auth.users(id) on delete cascade,
  generation smallint not null check (generation between 1 and 3),
  created_at timestamptz not null default now(),
  unique(referrer_id, referred_id)
);
grant select on public.referrals to authenticated;
grant all on public.referrals to service_role;
alter table public.referrals enable row level security;
drop policy if exists "see own referrals" on public.referrals;
create policy "see own referrals" on public.referrals for select to authenticated
  using (referrer_id = auth.uid() or referred_id = auth.uid() or public.has_role(auth.uid(),'admin'));

create table if not exists public.referral_earnings (
  id uuid primary key default gen_random_uuid(),
  referrer_id uuid not null references auth.users(id) on delete cascade,
  source_user_id uuid not null references auth.users(id) on delete cascade,
  generation smallint not null,
  kind text not null check (kind in ('tier_commission','first_withdrawal_bonus')),
  amount_cents int not null,
  meta jsonb,
  created_at timestamptz not null default now()
);
-- Backfill columns if an older referral_earnings table already existed.
alter table public.referral_earnings
  add column if not exists source_user_id uuid references auth.users(id) on delete cascade,
  add column if not exists generation smallint,
  add column if not exists kind text,
  add column if not exists amount_cents int,
  add column if not exists meta jsonb;
grant select on public.referral_earnings to authenticated;
grant all on public.referral_earnings to service_role;
alter table public.referral_earnings enable row level security;
drop policy if exists "see own earnings" on public.referral_earnings;
create policy "see own earnings" on public.referral_earnings for select to authenticated
  using (referrer_id = auth.uid() or public.has_role(auth.uid(),'admin'));

-- Build the 3-generation chain when a profile is referred.
create or replace function public.populate_referral_chain()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  g1 uuid := new.referred_by;
  g2 uuid;
  g3 uuid;
begin
  if g1 is null then return new; end if;
  insert into public.referrals(referrer_id, referred_id, generation)
    values (g1, new.id, 1) on conflict do nothing;
  select referred_by into g2 from public.profiles where id = g1;
  if g2 is not null then
    insert into public.referrals(referrer_id, referred_id, generation)
      values (g2, new.id, 2) on conflict do nothing;
    select referred_by into g3 from public.profiles where id = g2;
    if g3 is not null then
      insert into public.referrals(referrer_id, referred_id, generation)
        values (g3, new.id, 3) on conflict do nothing;
    end if;
  end if;
  return new;
end$$;

drop trigger if exists trg_populate_referrals on public.profiles;
create trigger trg_populate_referrals
  after insert on public.profiles
  for each row when (new.referred_by is not null)
  execute function public.populate_referral_chain();

-- Pay tier commissions: 30% / 5% / 5%. Idempotent on (source, kind, generation).
create unique index if not exists referral_earnings_unique_tier
  on public.referral_earnings(source_user_id, generation, kind)
  where kind = 'tier_commission';

create or replace function public.pay_referral_commissions(p_user uuid, p_tier_cents int)
returns void language plpgsql security definer set search_path = public as $$
declare
  rates int[] := array[30, 5, 5];
  r record;
  amt int;
begin
  for r in select referrer_id, generation from public.referrals where referred_id = p_user loop
    amt := (p_tier_cents * rates[r.generation]) / 100;
    if amt > 0 then
      insert into public.referral_earnings(referrer_id, source_user_id, generation, kind, amount_cents)
        values (r.referrer_id, p_user, r.generation, 'tier_commission', amt)
        on conflict do nothing;
      insert into public.wallets(user_id, available, total_earned)
      values (r.referrer_id, amt::numeric / 100, amt::numeric / 100)
      on conflict (user_id) do update
        set available = coalesce(public.wallets.available, 0) + excluded.available,
            total_earned = coalesce(public.wallets.total_earned, 0) + excluded.total_earned,
            updated_at = now();
    end if;
  end loop;
end$$;

-- 1% first-withdrawal bonus across 3 generations.
create unique index if not exists referral_earnings_unique_fw
  on public.referral_earnings(source_user_id, generation, kind)
  where kind = 'first_withdrawal_bonus';

create or replace function public.pay_first_withdrawal_bonus(p_user uuid, p_amount_cents int)
returns void language plpgsql security definer set search_path = public as $$
declare
  r record;
  amt int;
  already int;
begin
  select count(*) into already from public.referral_earnings
    where source_user_id = p_user and kind = 'first_withdrawal_bonus';
  if already > 0 then return; end if;
  for r in select referrer_id, generation from public.referrals where referred_id = p_user loop
    amt := greatest(1, p_amount_cents / 100);
    insert into public.referral_earnings(referrer_id, source_user_id, generation, kind, amount_cents)
      values (r.referrer_id, p_user, r.generation, 'first_withdrawal_bonus', amt)
      on conflict do nothing;
    insert into public.wallets(user_id, available, total_earned)
    values (r.referrer_id, amt::numeric / 100, amt::numeric / 100)
    on conflict (user_id) do update
      set available = coalesce(public.wallets.available, 0) + excluded.available,
          total_earned = coalesce(public.wallets.total_earned, 0) + excluded.total_earned,
          updated_at = now();
  end loop;
end$$;

-- ---------------------------------------------------------------------
-- 6. Activate tier (used by both PayPal capture and ads-completion paths)
-- ---------------------------------------------------------------------
create or replace function public.activate_tier(p_user uuid, p_tier public.tier_level)
returns void language plpgsql security definer set search_path = public as $$
declare
  price int;
begin
  select price_cents into price from public.referral_plans where tier::text = p_tier::text;
  update public.profiles set active_tier = p_tier where id = p_user;
  perform public.pay_referral_commissions(p_user, coalesce(price, 0));
end$$;

notify pgrst, 'reload schema';

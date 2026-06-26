-- ============================================================================
-- 2027-02 Tier pricing update, referral fix, and ad-view => task completion
-- ============================================================================
-- Run this in the Supabase SQL editor (project amaraselene128-netizen).
-- Idempotent: safe to re-run.

-- ---------------------------------------------------------------------------
-- 1. New tier prices (Bronze $100, Silver $1000, Gold $10000)
-- ---------------------------------------------------------------------------
alter table public.referral_plans add column if not exists price_cents int;

update public.referral_plans set price = 100,   price_cents = 10000   where tier = 'bronze';
update public.referral_plans set price = 1000,  price_cents = 100000  where tier = 'silver';
update public.referral_plans set price = 10000, price_cents = 1000000 where tier = 'gold';

-- ---------------------------------------------------------------------------
-- 2. Repair referrals table + RLS so referrals actually record
-- ---------------------------------------------------------------------------
-- Older schema.sql created referrals with a required `code` column and no
-- `generation`. Reconcile so both the trigger path and the client path work.
alter table public.referrals add column if not exists generation smallint default 1;
alter table public.referrals alter column generation set default 1;
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='referrals' and column_name='code'
  ) then
    execute 'alter table public.referrals alter column code drop not null';
  end if;
end $$;

-- Unique pair so the chain trigger can ON CONFLICT DO NOTHING safely.
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'referrals_referrer_referred_key'
  ) then
    begin
      alter table public.referrals
        add constraint referrals_referrer_referred_key unique (referrer_id, referred_id);
    exception when duplicate_table then null; end;
  end if;
end $$;

-- Allow the newly-signed-up user to INSERT their own referrals row.
drop policy if exists "Users insert own referral" on public.referrals;
create policy "Users insert own referral"
  on public.referrals for insert to authenticated
  with check (referred_id = auth.uid());

-- Add an explicit FK to profiles so PostgREST can embed profiles(...) in the
-- Referrals dashboard query. profiles.id already FKs to auth.users(id).
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'referrals_referred_id_fkey_profiles'
  ) then
    begin
      alter table public.referrals
        add constraint referrals_referred_id_fkey_profiles
        foreign key (referred_id) references public.profiles(id) on delete set null;
    exception when others then null; end;
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- 3. Fix populate_referral_chain trigger (profiles PK is `id`, not user_id)
--    and fire on UPDATE of referred_by too (Register sets it post-signup).
-- ---------------------------------------------------------------------------
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
  after insert or update of referred_by on public.profiles
  for each row when (new.referred_by is not null)
  execute function public.populate_referral_chain();

-- ---------------------------------------------------------------------------
-- 4. Task-completions log (ad/campaign views by active-tier users)
-- ---------------------------------------------------------------------------
create table if not exists public.task_completions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source text not null check (source in ('ad_view','campaign_view','manual')),
  ref_id text,
  reward_cents int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists task_completions_user_idx
  on public.task_completions(user_id, created_at desc);

grant select on public.task_completions to authenticated;
grant all    on public.task_completions to service_role;
alter table public.task_completions enable row level security;

drop policy if exists "Users see own completions" on public.task_completions;
create policy "Users see own completions"
  on public.task_completions for select to authenticated
  using (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));

-- ---------------------------------------------------------------------------
-- 5. credit_ad_view: also log a task completion when viewer has an active sub
-- ---------------------------------------------------------------------------
create or replace function public.credit_ad_view(
  p_ad_id uuid, p_user_id uuid, p_watched int,
  p_fingerprint text, p_user_agent text, p_ip text
) returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_ad public.advertisements%rowtype;
  v_reward int;
  v_advertiser_cost int;
  v_balance int;
  v_has_sub boolean := false;
begin
  select * into v_ad from public.advertisements where id = p_ad_id for update;
  if not found then raise exception 'Ad not found'; end if;
  if v_ad.status <> 'active' then raise exception 'Ad is not active'; end if;
  if p_watched < v_ad.duration_seconds then raise exception 'Watch incomplete'; end if;
  if exists (select 1 from public.ad_views where ad_id = p_ad_id and user_id = p_user_id and completed) then
    raise exception 'Already credited for this ad';
  end if;

  v_reward := case v_ad.duration_seconds
    when 15 then 1 when 30 then 2 when 45 then 3 when 60 then 4 end;
  v_advertiser_cost := case v_ad.duration_seconds
    when 15 then 5 when 30 then 6 when 45 then 7 when 60 then 8 end;

  if v_ad.spent_cents + v_advertiser_cost > v_ad.budget_cents then
    update public.advertisements set status = 'depleted' where id = p_ad_id;
    raise exception 'Ad budget exhausted';
  end if;

  insert into public.ad_views (ad_id, user_id, watched_seconds, completed, reward_cents, ip, user_agent, fingerprint)
  values (p_ad_id, p_user_id, p_watched, true, v_reward, p_ip, p_user_agent, p_fingerprint);

  update public.advertisements
    set spent_cents = spent_cents + v_advertiser_cost,
        views_completed = views_completed + 1,
        status = case when spent_cents + v_advertiser_cost >= budget_cents
                      then 'depleted'::public.ad_status else status end
    where id = p_ad_id;

  insert into public.tier_credits (user_id, balance_cents)
  values (p_user_id, v_reward)
  on conflict (user_id) do update
    set balance_cents = public.tier_credits.balance_cents + excluded.balance_cents,
        updated_at = now()
  returning balance_cents into v_balance;

  insert into public.tier_credit_ledger (user_id, delta_cents, source, ref_id)
  values (p_user_id, v_reward, 'ad_view', p_ad_id::text);

  -- Active-tier viewers also get a task completion record.
  select exists (
    select 1 from public.referral_subscriptions s
    where s.user_id = p_user_id
      and coalesce(s.active, true) = true
      and (s.expires_at is null or s.expires_at > now())
  ) into v_has_sub;

  if v_has_sub then
    insert into public.task_completions(user_id, source, ref_id, reward_cents)
    values (p_user_id, 'ad_view', p_ad_id::text, v_reward);
  end if;

  return jsonb_build_object(
    'balance_cents', v_balance,
    'reward_cents',  v_reward,
    'task_completed', v_has_sub
  );
end; $$;

revoke all on function public.credit_ad_view(uuid, uuid, int, text, text, text)
  from public, anon, authenticated;
grant execute on function public.credit_ad_view(uuid, uuid, int, text, text, text)
  to service_role;

-- ---------------------------------------------------------------------------
-- 6. unlock_tier_from_credits: align prices with new tiers
-- ---------------------------------------------------------------------------
create or replace function public.unlock_tier_from_credits(p_tier text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_price int;
  v_plan_id uuid;
  v_balance int;
  v_existing uuid;
begin
  if v_uid is null then raise exception 'Not authenticated'; end if;
  v_price := case lower(p_tier)
    when 'bronze' then 10000
    when 'silver' then 100000
    when 'gold'   then 1000000
    else null end;
  if v_price is null then raise exception 'Invalid tier'; end if;

  select id into v_plan_id from public.referral_plans
    where tier = lower(p_tier)::public.referral_tier and active limit 1;
  if v_plan_id is null then raise exception 'Plan not found'; end if;

  select id into v_existing from public.referral_subscriptions where user_id = v_uid;
  if v_existing is not null then raise exception 'Already subscribed'; end if;

  select balance_cents into v_balance from public.tier_credits where user_id = v_uid for update;
  if v_balance is null or v_balance < v_price then raise exception 'Insufficient tier credits'; end if;

  update public.tier_credits set balance_cents = balance_cents - v_price, updated_at = now() where user_id = v_uid;
  insert into public.referral_subscriptions (user_id, plan_id) values (v_uid, v_plan_id);
  insert into public.tier_credit_ledger (user_id, delta_cents, source, ref_id)
  values (v_uid, -v_price, 'tier_unlock', v_plan_id::text);

  return jsonb_build_object('tier', p_tier, 'balance_cents', v_balance - v_price);
end; $$;
revoke all on function public.unlock_tier_from_credits(text) from public, anon;
grant execute on function public.unlock_tier_from_credits(text) to authenticated;

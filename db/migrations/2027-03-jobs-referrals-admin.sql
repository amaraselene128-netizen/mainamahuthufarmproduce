-- EGMTASKS jobs, referrals and admin review repair.
-- Run this in the Supabase SQL editor if the live database has not yet been updated.

-- 1) Referral tiers: Bronze $5, Silver $100, Gold $1000.
alter table public.referral_plans
  add column if not exists price_cents int;

update public.referral_plans
  set price = 5, price_cents = 500, commission_rate = 0.10,
      features = '["10% commission","Unique referral link","Basic analytics"]'::jsonb
  where tier = 'bronze';
update public.referral_plans
  set price = 100, price_cents = 10000, commission_rate = 0.10,
      features = '["10% commission","Advanced analytics","Priority support"]'::jsonb
  where tier = 'silver';
update public.referral_plans
  set price = 1000, price_cents = 100000, commission_rate = 0.10,
      features = '["10% commission","Premium dashboard","Dedicated manager","Custom branding"]'::jsonb
  where tier = 'gold';

-- 2) Profile referral fields and safe referral-code generation.
do $$
begin
  if not exists (select 1 from pg_type where typname = 'tier_level') then
    create type public.tier_level as enum ('bronze','silver','gold');
  end if;
end$$;

alter table public.profiles
  add column if not exists referral_code text,
  add column if not exists referred_by uuid references public.profiles(id),
  add column if not exists active_tier public.tier_level;

create unique index if not exists profiles_referral_code_unique
  on public.profiles(referral_code) where referral_code is not null;

create or replace function public.make_referral_code(p_seed text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  base text := lower(regexp_replace(coalesce(p_seed, 'ref'), '[^a-zA-Z0-9]', '', 'g'));
  candidate text;
begin
  if length(base) = 0 then base := 'ref'; end if;
  base := substr(base, 1, 8);
  loop
    candidate := base || substr(md5(random()::text || clock_timestamp()::text), 1, 5);
    exit when not exists (select 1 from public.profiles where referral_code = candidate);
  end loop;
  return candidate;
end$$;

create or replace function public.set_referral_code()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.referral_code is null then
    new.referral_code := public.make_referral_code(new.username);
  end if;
  return new;
end$$;

drop trigger if exists trg_set_referral_code on public.profiles;
create trigger trg_set_referral_code
  before insert or update of username, referral_code on public.profiles
  for each row execute function public.set_referral_code();

-- 3) Referral rows are unique and can be backfilled from profiles.referred_by.
delete from public.referrals a
using public.referrals b
where a.ctid < b.ctid
  and a.referrer_id = b.referrer_id
  and a.referred_id is not distinct from b.referred_id;

create unique index if not exists referrals_referrer_referred_unique
  on public.referrals(referrer_id, referred_id) where referred_id is not null;

insert into public.referrals(referrer_id, referred_id, code, created_at)
select p.referred_by, p.id, coalesce(r.referral_code, 'legacy'), p.created_at
from public.profiles p
left join public.profiles r on r.id = p.referred_by
where p.referred_by is not null
on conflict do nothing;

-- 4) Make new auth signups attach referrals from auth metadata reliably.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  uname text;
  ref_code text := nullif(new.raw_user_meta_data->>'referral_code', '');
  referrer uuid;
begin
  uname := coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1));
  while exists (select 1 from public.profiles where username = uname) loop
    uname := uname || floor(random()*10000)::text;
  end loop;

  if ref_code is not null then
    select id into referrer from public.profiles where referral_code = ref_code limit 1;
  end if;

  insert into public.profiles (id, email, username, country_code, account_mode, referred_by)
  values (new.id, new.email, uname,
    coalesce(new.raw_user_meta_data->>'country_code', null),
    coalesce((new.raw_user_meta_data->>'account_mode')::public.account_mode, 'worker'),
    referrer);

  insert into public.wallets (user_id) values (new.id) on conflict (user_id) do nothing;

  if referrer is not null then
    insert into public.referrals(referrer_id, referred_id, code)
    values (referrer, new.id, ref_code)
    on conflict do nothing;
  end if;

  return new;
end;
$$;

-- 5) Referral earnings columns used by the commission trigger.
alter table public.referral_earnings
  add column if not exists source_user_id uuid references public.profiles(id),
  add column if not exists generation smallint,
  add column if not exists kind text,
  add column if not exists amount_cents int,
  add column if not exists meta jsonb;

create unique index if not exists referral_earnings_unique_tier_commission
  on public.referral_earnings(source_user_id, generation, kind)
  where kind = 'tier_commission' and source_user_id is not null and generation is not null;

create or replace function public.pay_subscription_commission(
  p_user uuid,
  p_tier_cents int
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid;
  referrer uuid;
  rates numeric[] := array[0.30, 0.05, 0.05];
  amt_cents int;
  amt numeric;
  gen int;
begin
  if p_user is null or p_tier_cents is null or p_tier_cents <= 0 then return; end if;

  current_user_id := p_user;
  for gen in 1..3 loop
    select referred_by into referrer from public.profiles where id = current_user_id;
    if referrer is null then return; end if;

    amt_cents := round(p_tier_cents * rates[gen]);
    amt := amt_cents::numeric / 100;
    if amt_cents > 0 then
      insert into public.referral_earnings(
        referrer_id, referral_id, amount, status, source_user_id, generation, kind, amount_cents, meta
      ) values (
        referrer,
        (select id from public.referrals where referrer_id = referrer and referred_id = p_user limit 1),
        amt,
        'paid',
        p_user,
        gen,
        'tier_commission',
        amt_cents,
        jsonb_build_object('source', 'tier_subscription')
      ) on conflict do nothing;

      insert into public.wallets(user_id, available, total_earned)
      values (referrer, amt, amt)
      on conflict (user_id) do update
        set available    = coalesce(public.wallets.available, 0) + excluded.available,
            total_earned = coalesce(public.wallets.total_earned, 0) + excluded.total_earned,
            updated_at   = now();

      insert into public.transactions(user_id, type, amount, status, reference, details)
      values (referrer, 'referral_commission', amt, 'completed', p_user::text || ':' || gen,
              jsonb_build_object('source_user_id', p_user, 'generation', gen, 'amount_cents', amt_cents))
      on conflict do nothing;
    end if;

    current_user_id := referrer;
  end loop;
end$$;

create or replace function public.on_referral_subscription_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  price int;
  tier_text text;
begin
  select coalesce(price_cents, round(price * 100)::int), tier::text
    into price, tier_text
  from public.referral_plans
  where id = new.plan_id;

  update public.profiles
    set active_tier = tier_text::public.tier_level
    where id = new.user_id;

  perform public.pay_subscription_commission(new.user_id, coalesce(price, 0));
  return new;
end$$;

drop trigger if exists trg_referral_subscription_commission on public.referral_subscriptions;
create trigger trg_referral_subscription_commission
  after insert on public.referral_subscriptions
  for each row execute function public.on_referral_subscription_insert();

-- 6) Spend watch-ad credits using the real plan price, not stale hard-coded values.
create or replace function public.unlock_tier_from_credits(p_tier text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_price int;
  v_plan_id uuid;
  v_balance int;
  v_existing uuid;
begin
  if v_uid is null then raise exception 'Not authenticated'; end if;

  select id, coalesce(price_cents, round(price * 100)::int)
    into v_plan_id, v_price
  from public.referral_plans
  where tier = lower(p_tier)::public.referral_tier and active
  limit 1;

  if v_plan_id is null or v_price is null then raise exception 'Plan not found'; end if;

  select id into v_existing from public.referral_subscriptions where user_id = v_uid;
  if v_existing is not null then raise exception 'Already subscribed'; end if;

  select balance_cents into v_balance from public.tier_credits where user_id = v_uid for update;
  if v_balance is null or v_balance < v_price then raise exception 'Insufficient tier credits'; end if;

  update public.tier_credits
    set balance_cents = balance_cents - v_price, updated_at = now()
    where user_id = v_uid;

  insert into public.referral_subscriptions (user_id, plan_id)
  values (v_uid, v_plan_id);

  insert into public.tier_credit_ledger (user_id, delta_cents, source, ref_id)
  values (v_uid, -v_price, 'tier_unlock', v_plan_id::text);

  return jsonb_build_object('tier', p_tier, 'balance_cents', v_balance - v_price);
end;
$$;

revoke all on function public.unlock_tier_from_credits(text) from public, anon;
grant execute on function public.unlock_tier_from_credits(text) to authenticated;

notify pgrst, 'reload schema';
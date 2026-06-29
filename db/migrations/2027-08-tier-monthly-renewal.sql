-- 2027-08: monthly tier subscription with auto-expiry + 50% renewals.
-- Tier becomes active for 30 days on initial activation. Renewal extends by
-- another 30 days at 50% of the tier price. Unrenewed subscriptions expire
-- and are purged on the next purge call.

alter table public.referral_subscriptions
  alter column expires_at set default (now() + interval '30 days');

update public.referral_subscriptions
  set expires_at = coalesce(expires_at, now() + interval '30 days')
  where expires_at is null;

-- Initial activation: insert with 30-day window, or extend if already active.
create or replace function public.activate_tier_after_payment(
  p_user uuid,
  p_tier text,
  p_paypal_order text
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_plan_id uuid;
  v_price int;
begin
  if p_user is null then raise exception 'Missing user'; end if;

  select id, coalesce(price_cents, round(price * 100)::int)
    into v_plan_id, v_price
  from public.referral_plans
  where tier = lower(p_tier)::public.referral_tier and active
  limit 1;

  if v_plan_id is null then raise exception 'Plan not found'; end if;

  insert into public.referral_subscriptions (user_id, plan_id, expires_at, active)
  values (p_user, v_plan_id, now() + interval '30 days', true)
  on conflict (user_id) do update
    set plan_id    = excluded.plan_id,
        expires_at = greatest(coalesce(public.referral_subscriptions.expires_at, now()), now()) + interval '30 days',
        active     = true;

  insert into public.transactions(user_id, type, amount, status, reference, details)
  values (p_user, 'tier_purchase', v_price::numeric / 100, 'completed', p_paypal_order,
          jsonb_build_object('tier', p_tier, 'provider', 'paypal'))
  on conflict do nothing;

  return jsonb_build_object('tier', p_tier, 'plan_id', v_plan_id, 'kind', 'activation');
end$$;

revoke all on function public.activate_tier_after_payment(uuid, text, text) from public, anon, authenticated;
grant execute on function public.activate_tier_after_payment(uuid, text, text) to service_role;

-- Monthly renewal at 50% of tier price. Extends expires_at by 30 days.
create or replace function public.renew_tier_after_payment(
  p_user uuid,
  p_tier text,
  p_paypal_order text
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_plan_id uuid;
  v_price int;
  v_renew_price numeric;
  v_now timestamptz := now();
begin
  if p_user is null then raise exception 'Missing user'; end if;

  select id, coalesce(price_cents, round(price * 100)::int)
    into v_plan_id, v_price
  from public.referral_plans
  where tier = lower(p_tier)::public.referral_tier and active
  limit 1;

  if v_plan_id is null then raise exception 'Plan not found'; end if;

  v_renew_price := (v_price::numeric / 100) * 0.5;

  insert into public.referral_subscriptions (user_id, plan_id, expires_at, active)
  values (p_user, v_plan_id, v_now + interval '30 days', true)
  on conflict (user_id) do update
    set plan_id    = excluded.plan_id,
        expires_at = greatest(coalesce(public.referral_subscriptions.expires_at, v_now), v_now) + interval '30 days',
        active     = true;

  insert into public.transactions(user_id, type, amount, status, reference, details)
  values (p_user, 'tier_renewal', v_renew_price, 'completed', p_paypal_order,
          jsonb_build_object('tier', p_tier, 'provider', 'paypal', 'renewal', true))
  on conflict do nothing;

  return jsonb_build_object('tier', p_tier, 'plan_id', v_plan_id, 'kind', 'renewal');
end$$;

revoke all on function public.renew_tier_after_payment(uuid, text, text) from public, anon, authenticated;
grant execute on function public.renew_tier_after_payment(uuid, text, text) to service_role;

-- Purge expired subscriptions. Called from client/dashboard.
create or replace function public.purge_expired_subscriptions()
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count int;
begin
  with deleted as (
    delete from public.referral_subscriptions
    where expires_at is not null and expires_at < now()
    returning 1
  )
  select count(*) into v_count from deleted;
  return v_count;
end$$;

revoke all on function public.purge_expired_subscriptions() from public;
grant execute on function public.purge_expired_subscriptions() to anon, authenticated, service_role;

notify pgrst, 'reload schema';

-- New tier prices and 30/5/3 referral commission distribution.

update public.referral_plans
  set price = 100,    price_cents = 10000,
      features = '["Access to Bronze-rated tasks","Regular + Bronze referral earnings","Min withdrawal $30"]'::jsonb
  where tier = 'bronze';
update public.referral_plans
  set price = 1000,   price_cents = 100000,
      features = '["Access to Silver-rated tasks","Regular + Bronze + Silver referral earnings","Min withdrawal $20"]'::jsonb
  where tier = 'silver';
update public.referral_plans
  set price = 10000,  price_cents = 1000000,
      features = '["Access to all tasks (Regular → Gold)","All referral tiers up to Gold","Min withdrawal $10"]'::jsonb
  where tier = 'gold';

-- Three-generation referral commission: 30% / 5% / 3%.
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
  rates numeric[] := array[0.30, 0.05, 0.03];
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

-- RPC used by the PayPal capture function to grant a tier after a successful payment.
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

  insert into public.referral_subscriptions (user_id, plan_id)
  values (p_user, v_plan_id)
  on conflict (user_id) do nothing;

  insert into public.transactions(user_id, type, amount, status, reference, details)
  values (p_user, 'tier_purchase', v_price::numeric / 100, 'completed', p_paypal_order,
          jsonb_build_object('tier', p_tier, 'provider', 'paypal'))
  on conflict do nothing;

  return jsonb_build_object('tier', p_tier, 'plan_id', v_plan_id);
end$$;

revoke all on function public.activate_tier_after_payment(uuid, text, text) from public, anon, authenticated;
grant execute on function public.activate_tier_after_payment(uuid, text, text) to service_role;

notify pgrst, 'reload schema';
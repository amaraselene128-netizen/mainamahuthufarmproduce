-- Run in the Supabase SQL editor (project: iycbpeujxgwcsmelvwdw).
-- Fixes:
--   1) Admin "Approve / Reject" campaign 400 — adds enum values.
--   2) Tier subscriptions did not pay referrer — adds commission trigger
--      (30% gen1, 5% gen2, 5% gen3) that credits wallets.available.

-- 1) Allow approved / rejected on campaign_status enum.
do $$
begin
  if not exists (
    select 1 from pg_enum e join pg_type t on t.oid = e.enumtypid
    where t.typname = 'campaign_status' and e.enumlabel = 'approved'
  ) then
    alter type public.campaign_status add value 'approved';
  end if;
  if not exists (
    select 1 from pg_enum e join pg_type t on t.oid = e.enumtypid
    where t.typname = 'campaign_status' and e.enumlabel = 'rejected'
  ) then
    alter type public.campaign_status add value 'rejected';
  end if;
end$$;

-- 2) Pay 30%/5%/5% referral commission on a successful tier subscription.
create or replace function public.pay_subscription_commission(
  p_user uuid,
  p_tier_dollars numeric
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  g1 uuid; g2 uuid; g3 uuid;
  gens uuid[];
  rates numeric[] := array[0.30, 0.05, 0.05];
  amt numeric;
  i int;
begin
  if p_tier_dollars is null or p_tier_dollars <= 0 then return; end if;

  select referred_by into g1 from public.profiles where id = p_user;
  if g1 is null then return; end if;
  select referred_by into g2 from public.profiles where id = g1;
  if g2 is not null then
    select referred_by into g3 from public.profiles where id = g2;
  end if;

  gens := array[g1, g2, g3];
  for i in 1..3 loop
    if gens[i] is not null then
      amt := round(p_tier_dollars * rates[i], 2);
      insert into public.referral_earnings(referrer_id, referral_id, amount, status)
        values (gens[i], null, amt, 'paid');
      insert into public.wallets(user_id, available, total_earned)
        values (gens[i], amt, amt)
        on conflict (user_id) do update
          set available    = public.wallets.available    + excluded.available,
              total_earned = public.wallets.total_earned + excluded.total_earned,
              updated_at   = now();
    end if;
  end loop;
end$$;

create or replace function public.on_referral_subscription_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare price_dollars numeric;
begin
  select price into price_dollars from public.referral_plans where id = new.plan_id;
  perform public.pay_subscription_commission(new.user_id, coalesce(price_dollars, 0));
  return new;
end$$;

drop trigger if exists trg_referral_subscription_commission on public.referral_subscriptions;
create trigger trg_referral_subscription_commission
  after insert on public.referral_subscriptions
  for each row execute function public.on_referral_subscription_insert();

notify pgrst, 'reload schema';
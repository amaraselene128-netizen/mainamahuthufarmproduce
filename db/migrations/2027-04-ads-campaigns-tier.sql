-- 2027-04: surface approved campaigns to workers, pay real money for ad views
-- when a tier is active, allow admins to grant a tier and edit campaigns/ads.

-- 1) Workers can read approved campaigns ---------------------------------
drop policy if exists "Workers read approved campaigns" on public.market_campaigns;
create policy "Workers read approved campaigns" on public.market_campaigns
  for select to authenticated using (status = 'approved');

-- 2) Per-campaign view ledger (mirrors ad_views, separate FK) ------------
create table if not exists public.campaign_views (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.market_campaigns(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  watched_seconds int not null,
  completed boolean not null default false,
  reward_cents int not null default 0,
  ip text, user_agent text, fingerprint text,
  created_at timestamptz not null default now()
);
create unique index if not exists campaign_views_one_completed_per_user
  on public.campaign_views(campaign_id, user_id) where completed;
grant select on public.campaign_views to authenticated;
grant all on public.campaign_views to service_role;
alter table public.campaign_views enable row level security;
drop policy if exists "User reads own campaign views" on public.campaign_views;
create policy "User reads own campaign views" on public.campaign_views
  for select to authenticated
  using (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));

-- 3) credit_ad_view: pay real wallet money when the viewer has an active tier
create or replace function public.credit_ad_view(
  p_ad_id uuid, p_user_id uuid, p_watched int,
  p_fingerprint text, p_user_agent text, p_ip text
) returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_ad public.advertisements%rowtype;
  v_reward int;
  v_advertiser_cost int;
  v_balance int;
  v_has_tier boolean;
  v_dollars numeric(12,2);
begin
  select * into v_ad from public.advertisements where id = p_ad_id for update;
  if not found then raise exception 'Ad not found'; end if;
  if v_ad.status <> 'active' then raise exception 'Ad is not active'; end if;
  if p_watched < v_ad.duration_seconds then raise exception 'Watch incomplete'; end if;
  if exists (select 1 from public.ad_views where ad_id = p_ad_id and user_id = p_user_id and completed) then
    raise exception 'Already credited for this ad';
  end if;

  v_reward := case v_ad.duration_seconds when 15 then 1 when 30 then 2 when 45 then 3 when 60 then 4 end;
  v_advertiser_cost := case v_ad.duration_seconds when 15 then 5 when 30 then 6 when 45 then 7 when 60 then 8 end;

  if v_ad.spent_cents + v_advertiser_cost > v_ad.budget_cents then
    update public.advertisements set status = 'depleted' where id = p_ad_id;
    raise exception 'Ad budget exhausted';
  end if;

  insert into public.ad_views (ad_id, user_id, watched_seconds, completed, reward_cents, ip, user_agent, fingerprint)
  values (p_ad_id, p_user_id, p_watched, true, v_reward, p_ip, p_user_agent, p_fingerprint);

  update public.advertisements
    set spent_cents = spent_cents + v_advertiser_cost,
        views_completed = views_completed + 1,
        status = case when spent_cents + v_advertiser_cost >= budget_cents then 'depleted'::public.ad_status else status end
    where id = p_ad_id;

  select exists(select 1 from public.referral_subscriptions where user_id = p_user_id) into v_has_tier;

  if v_has_tier then
    v_dollars := (v_reward::numeric)/100;
    insert into public.wallets (user_id, available, total_earned)
      values (p_user_id, v_dollars, v_dollars)
      on conflict (user_id) do update
        set available = public.wallets.available + excluded.available,
            total_earned = public.wallets.total_earned + excluded.total_earned,
            updated_at = now();
    insert into public.transactions (user_id, type, amount, status, reference, details)
      values (p_user_id, 'ad_earning', v_dollars, 'completed', p_ad_id::text,
              jsonb_build_object('ad_id', p_ad_id, 'duration', v_ad.duration_seconds));
    select coalesce(balance_cents,0) into v_balance from public.tier_credits where user_id = p_user_id;
    return jsonb_build_object('balance_cents', coalesce(v_balance,0), 'reward_cents', v_reward, 'paid_to','wallet');
  end if;

  insert into public.tier_credits (user_id, balance_cents)
  values (p_user_id, v_reward)
  on conflict (user_id) do update
    set balance_cents = public.tier_credits.balance_cents + excluded.balance_cents,
        updated_at = now()
  returning balance_cents into v_balance;

  insert into public.tier_credit_ledger (user_id, delta_cents, source, ref_id)
  values (p_user_id, v_reward, 'ad_view', p_ad_id::text);

  return jsonb_build_object('balance_cents', v_balance, 'reward_cents', v_reward, 'paid_to','tier_credits');
end; $$;

-- 4) credit_campaign_view: same payout logic, for approved market campaigns
create or replace function public.credit_campaign_view(
  p_campaign_id uuid, p_user_id uuid, p_watched int,
  p_fingerprint text, p_user_agent text, p_ip text
) returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_c public.market_campaigns%rowtype;
  v_dur int;
  v_reward int;
  v_balance int;
  v_has_tier boolean;
  v_dollars numeric(12,2);
begin
  select * into v_c from public.market_campaigns where id = p_campaign_id;
  if not found then raise exception 'Campaign not found'; end if;
  if v_c.status <> 'approved' then raise exception 'Campaign not approved'; end if;
  v_dur := coalesce(v_c.duration_seconds, 30);
  if p_watched < v_dur then raise exception 'Watch incomplete'; end if;
  if exists (select 1 from public.campaign_views where campaign_id = p_campaign_id and user_id = p_user_id and completed) then
    raise exception 'Already credited';
  end if;

  v_reward := case v_dur when 15 then 1 when 30 then 2 when 45 then 3 when 60 then 4 else 2 end;

  insert into public.campaign_views (campaign_id, user_id, watched_seconds, completed, reward_cents, ip, user_agent, fingerprint)
  values (p_campaign_id, p_user_id, p_watched, true, v_reward, p_ip, p_user_agent, p_fingerprint);

  select exists(select 1 from public.referral_subscriptions where user_id = p_user_id) into v_has_tier;

  if v_has_tier then
    v_dollars := (v_reward::numeric)/100;
    insert into public.wallets (user_id, available, total_earned)
      values (p_user_id, v_dollars, v_dollars)
      on conflict (user_id) do update
        set available = public.wallets.available + excluded.available,
            total_earned = public.wallets.total_earned + excluded.total_earned,
            updated_at = now();
    insert into public.transactions (user_id, type, amount, status, reference, details)
      values (p_user_id, 'campaign_earning', v_dollars, 'completed', p_campaign_id::text,
              jsonb_build_object('campaign_id', p_campaign_id, 'duration', v_dur));
    select coalesce(balance_cents,0) into v_balance from public.tier_credits where user_id = p_user_id;
    return jsonb_build_object('balance_cents', coalesce(v_balance,0), 'reward_cents', v_reward, 'paid_to','wallet');
  end if;

  insert into public.tier_credits (user_id, balance_cents) values (p_user_id, v_reward)
  on conflict (user_id) do update
    set balance_cents = public.tier_credits.balance_cents + excluded.balance_cents, updated_at = now()
  returning balance_cents into v_balance;

  insert into public.tier_credit_ledger (user_id, delta_cents, source, ref_id)
  values (p_user_id, v_reward, 'campaign_view', p_campaign_id::text);

  return jsonb_build_object('balance_cents', v_balance, 'reward_cents', v_reward, 'paid_to','tier_credits');
end; $$;

-- 5) Admin grant tier (free / out-of-band payment recovery) --------------
create or replace function public.admin_grant_tier(p_user uuid, p_tier text)
returns void language plpgsql security definer set search_path = public as $$
declare v_plan uuid;
begin
  if not public.has_role(auth.uid(),'admin') then raise exception 'Forbidden'; end if;
  select id into v_plan from public.referral_plans
    where tier = lower(p_tier)::public.referral_tier and active
    order by created_at desc limit 1;
  if v_plan is null then raise exception 'Plan not found for tier %', p_tier; end if;
  delete from public.referral_subscriptions where user_id = p_user;
  insert into public.referral_subscriptions(user_id, plan_id) values (p_user, v_plan);
end; $$;

grant execute on function public.credit_campaign_view(uuid,uuid,int,text,text,text) to authenticated, service_role;
grant execute on function public.admin_grant_tier(uuid,text) to authenticated;
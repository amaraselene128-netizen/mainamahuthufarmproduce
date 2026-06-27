-- Finalisation migration
-- 1. Explicit FKs to public.profiles so PostgREST can embed.
-- 2. credit_ad_view routes to wallets when profile.active_tier is set.
-- 3. Realtime publication for notifications.

-- ---------------------------------------------------------------------
-- 1. Explicit FKs for profile embedding
-- ---------------------------------------------------------------------
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'task_submissions_worker_profile_fk') then
    alter table public.task_submissions
      add constraint task_submissions_worker_profile_fk
      foreign key (worker_id) references public.profiles(id) on delete cascade;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'task_applications_worker_profile_fk') then
    alter table public.task_applications
      add constraint task_applications_worker_profile_fk
      foreign key (worker_id) references public.profiles(id) on delete cascade;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'tasks_hiring_profile_fk') then
    alter table public.tasks
      add constraint tasks_hiring_profile_fk
      foreign key (hiring_id) references public.profiles(id) on delete cascade;
  end if;
end $$;

-- ---------------------------------------------------------------------
-- 2. credit_ad_view -> route to wallet when tier active
-- ---------------------------------------------------------------------
create or replace function public.credit_ad_view(
  p_ad_id uuid, p_user_id uuid, p_watched int,
  p_fingerprint text, p_user_agent text, p_ip text
) returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_ad public.advertisements%rowtype;
  v_reward int;
  v_advertiser_cost int;
  v_balance int;
  v_active_tier text;
  v_wallet_cents numeric;
  v_destination text;
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
        status = case when spent_cents + v_advertiser_cost >= budget_cents then 'depleted'::public.ad_status else status end
    where id = p_ad_id;

  -- Determine destination based on the viewer's active tier (if column exists).
  begin
    execute 'select active_tier::text from public.profiles where id = $1'
      into v_active_tier using p_user_id;
  exception when undefined_column then
    v_active_tier := null;
  end;

  if v_active_tier is not null then
    v_destination := 'wallet';
    insert into public.wallets (user_id, available, total_earned)
    values (p_user_id, v_reward / 100.0, v_reward / 100.0)
    on conflict (user_id) do update
      set available    = public.wallets.available    + excluded.available,
          total_earned = public.wallets.total_earned + excluded.total_earned,
          updated_at = now()
    returning (available * 100)::int into v_balance;

    insert into public.tier_credit_ledger (user_id, delta_cents, source, ref_id)
    values (p_user_id, v_reward, 'ad_view_wallet', p_ad_id::text);
  else
    v_destination := 'tier_credits';
    insert into public.tier_credits (user_id, balance_cents)
    values (p_user_id, v_reward)
    on conflict (user_id) do update
      set balance_cents = public.tier_credits.balance_cents + excluded.balance_cents,
          updated_at = now()
    returning balance_cents into v_balance;

    insert into public.tier_credit_ledger (user_id, delta_cents, source, ref_id)
    values (p_user_id, v_reward, 'ad_view', p_ad_id::text);
  end if;

  return jsonb_build_object(
    'balance_cents', v_balance,
    'reward_cents', v_reward,
    'destination', v_destination
  );
end; $$;
revoke all on function public.credit_ad_view(uuid, uuid, int, text, text, text) from public, anon, authenticated;
grant execute on function public.credit_ad_view(uuid, uuid, int, text, text, text) to service_role;

-- ---------------------------------------------------------------------
-- 3. Realtime publication for notifications
-- ---------------------------------------------------------------------
do $$ begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (
       select 1 from pg_publication_tables
       where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'notifications'
     ) then
    execute 'alter publication supabase_realtime add table public.notifications';
  end if;
end $$;

notify pgrst, 'reload schema';

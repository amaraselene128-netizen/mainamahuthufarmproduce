-- ============================================================
-- EGMTASKS — Tier slots, ads embed support, daily caps, etc.
-- Migration 2027-03: tier-slots-embeds
-- ============================================================

-- 1) Advertisements: support embedded (link-only) ads + ad_type + instructions
alter table if exists public.advertisements
  add column if not exists embed_url text,
  add column if not exists ad_type text not null default 'upload'
    check (ad_type in ('upload','embed')),
  add column if not exists instructions text;

-- Make video_url nullable for embed ads
alter table if exists public.advertisements
  alter column video_url drop not null;

-- 2) Tasks: tier-weighted slot allocation columns
alter table if exists public.tasks
  add column if not exists tier_slots_total smallint not null default 18,
  add column if not exists open_slots_total smallint not null default 2,
  add column if not exists tier_slots_filled smallint not null default 0,
  add column if not exists open_slots_filled smallint not null default 0;

-- 3) Daily ad task cap for non-tier accounts (20 / 24h rolling)
create or replace function public.user_has_active_tier(_uid uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1 from public.referral_subscriptions s
    where s.user_id = _uid
      and s.status = 'active'
      and (s.expires_at is null or s.expires_at > now())
  );
$$;

-- Rebuild credit_ad_view to enforce daily cap + log task_completion for tiered users.
create or replace function public.credit_ad_view(_ad_id uuid, _viewer uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_has_tier boolean;
  v_daily int;
  v_credit int;
begin
  if _viewer is null then
    return jsonb_build_object('ok', false, 'reason', 'auth_required');
  end if;

  v_has_tier := public.user_has_active_tier(_viewer);

  -- Enforce 20 ad/campaign tasks per 24h for non-tier
  if not v_has_tier then
    select count(*) into v_daily
      from public.task_completions
     where worker_id = _viewer
       and source in ('ad_view','campaign_view')
       and created_at > now() - interval '24 hours';
    if v_daily >= 20 then
      return jsonb_build_object('ok', false, 'reason', 'daily_limit_reached');
    end if;
  end if;

  -- Compute viewer credit (advertiser CPV split — flat 50% as a safe default; tune as needed)
  select coalesce((budget_cents / nullif(views_purchased,0)) / 2, 0)
    into v_credit
    from public.advertisements where id = _ad_id;

  insert into public.ad_views(advertisement_id, viewer_id, credit_cents)
    values (_ad_id, _viewer, coalesce(v_credit,0));

  insert into public.task_completions(worker_id, source, source_id, credit_cents)
    values (_viewer, 'ad_view', _ad_id, coalesce(v_credit,0));

  return jsonb_build_object('ok', true, 'credit_cents', coalesce(v_credit,0), 'tiered', v_has_tier);
end
$$;

grant execute on function public.credit_ad_view(uuid, uuid) to authenticated;

-- 4) Tier-weighted task application allocation (18 tier / 2 open)
create or replace function public.apply_to_task(_task_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_has_tier boolean;
  v_task record;
  v_app_id uuid;
begin
  if v_uid is null then
    raise exception 'auth_required';
  end if;

  select * into v_task from public.tasks where id = _task_id for update;
  if not found then
    raise exception 'task_not_found';
  end if;
  if v_task.status not in ('active','open') then
    raise exception 'task_not_open';
  end if;

  -- Already applied?
  select id into v_app_id from public.task_applications
   where task_id = _task_id and worker_id = v_uid;
  if found then
    return jsonb_build_object('ok', true, 'already', true, 'application_id', v_app_id);
  end if;

  v_has_tier := public.user_has_active_tier(v_uid);

  if v_has_tier then
    if v_task.tier_slots_filled >= v_task.tier_slots_total then
      raise exception 'tier_slots_full';
    end if;
    update public.tasks set tier_slots_filled = tier_slots_filled + 1,
                            current_workers = coalesce(current_workers,0) + 1
      where id = _task_id;
  else
    if v_task.open_slots_filled >= v_task.open_slots_total then
      raise exception 'open_slots_full';
    end if;
    update public.tasks set open_slots_filled = open_slots_filled + 1,
                            current_workers = coalesce(current_workers,0) + 1
      where id = _task_id;
  end if;

  insert into public.task_applications(task_id, worker_id, status, tiered)
    values (_task_id, v_uid, 'pending', v_has_tier)
    returning id into v_app_id;

  return jsonb_build_object('ok', true, 'application_id', v_app_id, 'tiered', v_has_tier);
end
$$;

-- Add tiered flag to applications for admin prioritisation
alter table if exists public.task_applications
  add column if not exists tiered boolean not null default false;

grant execute on function public.apply_to_task(uuid) to authenticated;

-- 5) Useful indexes
create index if not exists idx_task_completions_worker_created
  on public.task_completions(worker_id, source, created_at desc);

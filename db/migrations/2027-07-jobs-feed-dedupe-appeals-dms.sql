-- 2027-07: dedupe applications/submissions, appeals, admin direct messages,
-- and broaden read access to active ads / approved campaigns for everyone.

-- ============================================================
-- 1) Dedupe: one task application per worker, one submission per application
-- ============================================================
create unique index if not exists task_applications_worker_task_uidx
  on public.task_applications (task_id, worker_id);

create unique index if not exists task_submissions_app_worker_uidx
  on public.task_submissions (application_id, worker_id);

-- Replace apply_to_task so duplicate applies raise a clean, catchable error.
create or replace function public.apply_to_task(_task_id uuid)
returns public.task_applications language plpgsql security definer set search_path = public as $$
declare
  t public.tasks%rowtype;
  app public.task_applications%rowtype;
  existing public.task_applications%rowtype;
begin
  -- already applied?
  select * into existing from public.task_applications
    where task_id = _task_id and worker_id = auth.uid() limit 1;
  if found then
    raise exception 'already_applied' using errcode = '23505';
  end if;

  select * into t from public.tasks where id = _task_id for update;
  if not found then raise exception 'Task not found'; end if;
  if t.status <> 'active' then raise exception 'Task is no longer accepting applicants'; end if;
  if t.current_workers >= t.max_workers then
    update public.tasks set status='taken' where id=_task_id;
    raise exception 'Task is full';
  end if;

  insert into public.task_applications (task_id, worker_id)
    values (_task_id, auth.uid())
    on conflict (task_id, worker_id) do nothing
    returning * into app;

  if app.id is null then
    raise exception 'already_applied' using errcode = '23505';
  end if;

  update public.tasks set current_workers = current_workers + 1,
    status = case when current_workers + 1 >= max_workers then 'taken'::public.task_status else status end
    where id = _task_id;
  return app;
end; $$;
grant execute on function public.apply_to_task(uuid) to authenticated;

-- ============================================================
-- 2) Public read access: approved campaigns + active ads
-- ============================================================
drop policy if exists "Anyone reads approved campaigns" on public.market_campaigns;
create policy "Anyone reads approved campaigns" on public.market_campaigns
  for select to anon, authenticated using (status = 'approved');

drop policy if exists "Anyone reads active ads" on public.advertisements;
create policy "Anyone reads active ads" on public.advertisements
  for select to anon, authenticated using (status = 'active');

-- ============================================================
-- 3) Account appeals (public)
-- ============================================================
create table if not exists public.account_appeals (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  reason text not null,
  contact text,
  status text not null default 'pending', -- pending|approved|rejected
  admin_notes text,
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);
grant insert on public.account_appeals to anon, authenticated;
grant select, update on public.account_appeals to authenticated;
grant all on public.account_appeals to service_role;
alter table public.account_appeals enable row level security;

drop policy if exists "Anyone can submit appeal" on public.account_appeals;
create policy "Anyone can submit appeal" on public.account_appeals
  for insert to anon, authenticated with check (true);

drop policy if exists "Admins read appeals" on public.account_appeals;
create policy "Admins read appeals" on public.account_appeals
  for select to authenticated using (public.has_role(auth.uid(),'admin'));

drop policy if exists "Admins update appeals" on public.account_appeals;
create policy "Admins update appeals" on public.account_appeals
  for update to authenticated using (public.has_role(auth.uid(),'admin'));

-- ============================================================
-- 4) Admin direct messages → reuse existing notifications table.
--    Add a helper that any admin can call to push a notification.
-- ============================================================
create or replace function public.admin_notify_user(
  _user uuid, _title text, _body text
) returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.has_role(auth.uid(),'admin') then
    raise exception 'Only admins can send notifications';
  end if;
  insert into public.notifications (user_id, title, body, read)
    values (_user, _title, _body, false);
end; $$;
grant execute on function public.admin_notify_user(uuid, text, text) to authenticated;

create or replace function public.admin_broadcast_notification(
  _title text, _body text
) returns integer language plpgsql security definer set search_path = public as $$
declare n integer;
begin
  if not public.has_role(auth.uid(),'admin') then
    raise exception 'Only admins can broadcast';
  end if;
  with ins as (
    insert into public.notifications (user_id, title, body, read)
    select id, _title, _body, false from public.profiles
    where coalesce(banned,false) = false and coalesce(suspended,false) = false
    returning 1
  ) select count(*) into n from ins;
  return n;
end; $$;
grant execute on function public.admin_broadcast_notification(text, text) to authenticated;

-- ============================================================
-- 5) Force-logout suspended/banned users via a JWT claim helper
--    (the frontend also checks the `profiles` row on every session.)
-- ============================================================
create or replace function public.is_account_blocked(_user uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(banned, false) or coalesce(suspended, false)
  from public.profiles where id = _user
$$;
grant execute on function public.is_account_blocked(uuid) to authenticated, anon;

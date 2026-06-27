-- Fixes:
-- 1) PostgREST embed errors (PGRST200) — recreate worker_id / hiring_id FKs so they
--    point at public.profiles using the auto-generated names the client uses.
-- 2) Reassert permissive SELECT policies for tasks, task_applications, advertisements
--    so non-admin workers can read active rows.
-- 3) Reload PostgREST schema cache.

-- ---------------------------------------------------------------------
-- 1. Re-point FKs to public.profiles so embeds resolve
-- ---------------------------------------------------------------------
do $$
declare r record;
begin
  -- task_submissions.worker_id  -> profiles.id  (constraint name PostgREST uses)
  for r in
    select conname from pg_constraint
     where conrelid = 'public.task_submissions'::regclass
       and contype = 'f'
       and conname in (
         'task_submissions_worker_id_fkey',
         'task_submissions_worker_profile_fk'
       )
  loop
    execute format('alter table public.task_submissions drop constraint %I', r.conname);
  end loop;
  alter table public.task_submissions
    add constraint task_submissions_worker_id_fkey
    foreign key (worker_id) references public.profiles(id) on delete cascade;

  -- task_applications.worker_id -> profiles.id
  for r in
    select conname from pg_constraint
     where conrelid = 'public.task_applications'::regclass
       and contype = 'f'
       and conname in (
         'task_applications_worker_id_fkey',
         'task_applications_worker_profile_fk'
       )
  loop
    execute format('alter table public.task_applications drop constraint %I', r.conname);
  end loop;
  alter table public.task_applications
    add constraint task_applications_worker_id_fkey
    foreign key (worker_id) references public.profiles(id) on delete cascade;

  -- tasks.hiring_id -> profiles.id
  for r in
    select conname from pg_constraint
     where conrelid = 'public.tasks'::regclass
       and contype = 'f'
       and conname in (
         'tasks_hiring_id_fkey',
         'tasks_hiring_profile_fk'
       )
  loop
    execute format('alter table public.tasks drop constraint %I', r.conname);
  end loop;
  alter table public.tasks
    add constraint tasks_hiring_id_fkey
    foreign key (hiring_id) references public.profiles(id) on delete cascade;
end$$;

-- ---------------------------------------------------------------------
-- 2. Permissive SELECT policies (idempotent reassert)
-- ---------------------------------------------------------------------
-- tasks: every authenticated user can read every task row
drop policy if exists "Tasks viewable" on public.tasks;
create policy "Tasks viewable" on public.tasks
  for select to authenticated using (true);

-- advertisements: active to everyone authenticated; own + admin for the rest
drop policy if exists "Ads viewable: active to all, own to advertiser, all to admin" on public.advertisements;
create policy "Ads viewable: active to all, own to advertiser, all to admin"
  on public.advertisements for select to authenticated
  using (status = 'active' or advertiser_id = auth.uid() or public.has_role(auth.uid(),'admin'));

-- task_applications: worker sees their own, hiring sees their task's, admin sees all
drop policy if exists "App visibility" on public.task_applications;
create policy "App visibility" on public.task_applications for select to authenticated
  using (
    worker_id = auth.uid()
    or exists (select 1 from public.tasks t where t.id = task_id and t.hiring_id = auth.uid())
    or public.has_role(auth.uid(),'admin')
  );

-- ---------------------------------------------------------------------
-- 3. Reload PostgREST cache so new FK names register immediately
-- ---------------------------------------------------------------------
notify pgrst, 'reload schema';

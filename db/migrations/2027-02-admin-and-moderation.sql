-- =====================================================================
-- EGRATASKS — Admin & Moderation overhaul (2027-02)
-- Fixes: task_submissions↔profiles join, support tickets visibility,
-- task upload errors, admin grant, moderation, broadcast messaging.
-- Safe to re-run.
-- =====================================================================

-- 1. Explicit FKs so PostgREST can embed profiles() in selects.
do $$ begin
  alter table public.task_submissions
    add constraint task_submissions_worker_id_profiles_fkey
    foreign key (worker_id) references public.profiles(id) on delete cascade;
exception when duplicate_object then null; when others then null; end $$;

do $$ begin
  alter table public.task_applications
    add constraint task_applications_worker_id_profiles_fkey
    foreign key (worker_id) references public.profiles(id) on delete cascade;
exception when duplicate_object then null; when others then null; end $$;

do $$ begin
  alter table public.support_tickets
    add constraint support_tickets_user_id_profiles_fkey
    foreign key (user_id) references public.profiles(id) on delete cascade;
exception when duplicate_object then null; when others then null; end $$;

do $$ begin
  alter table public.support_messages
    add constraint support_messages_sender_id_profiles_fkey
    foreign key (sender_id) references public.profiles(id) on delete cascade;
exception when duplicate_object then null; when others then null; end $$;

do $$ begin
  alter table public.tasks
    add constraint tasks_hiring_id_profiles_fkey
    foreign key (hiring_id) references public.profiles(id) on delete cascade;
exception when duplicate_object then null; when others then null; end $$;

do $$ begin
  alter table public.messages
    add constraint messages_from_user_profiles_fkey
    foreign key (from_user) references public.profiles(id) on delete set null;
exception when duplicate_object then null; when others then null; end $$;

-- 2. Add 'pending_review' to task_status so client posts go to admin queue.
do $$ begin
  alter type public.task_status add value if not exists 'pending_review';
exception when others then null; end $$;

-- 3. Columns NewTask.tsx inserts that didn't exist.
alter table public.tasks
  add column if not exists category text,
  add column if not exists category_group text;

-- 4. Default new tasks to pending_review (admin must approve).
--    Trigger overrides the column default whenever a non-admin inserts.
create or replace function public.tasks_force_pending_review()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if not public.has_role(auth.uid(), 'admin') then
    new.status := 'pending_review'::public.task_status;
  end if;
  return new;
end$$;

drop trigger if exists trg_tasks_pending_review on public.tasks;
create trigger trg_tasks_pending_review
  before insert on public.tasks
  for each row execute function public.tasks_force_pending_review();

-- Workers should only see approved/active tasks. Update the SELECT policy.
drop policy if exists "Tasks viewable" on public.tasks;
create policy "Tasks viewable" on public.tasks for select to authenticated
  using (
    status in ('active','taken','closed')
    or hiring_id = auth.uid()
    or public.has_role(auth.uid(),'admin')
  );

-- 5. Same flow for advertisements (status 'pending' already exists).
--    Worker-side EarnAds already filters status='active', no change needed.

-- 6. Admin direct messages — allow admins to insert with any from_user
--    and broadcast support via is_admin flag (column already exists).
drop policy if exists "Users send messages" on public.messages;
create policy "Users send messages" on public.messages for insert to authenticated
  with check (from_user = auth.uid() or public.has_role(auth.uid(),'admin'));

drop policy if exists "Admins read all messages" on public.messages;
create policy "Admins read all messages" on public.messages for select to authenticated
  using (to_user = auth.uid() or from_user = auth.uid() or public.has_role(auth.uid(),'admin'));

-- 7. Admin can manage user_roles (grant/revoke admin).
drop policy if exists "Admins manage roles" on public.user_roles;
create policy "Admins manage roles" on public.user_roles for all to authenticated
  using (public.has_role(auth.uid(),'admin'))
  with check (public.has_role(auth.uid(),'admin'));

-- 8. Worker application: admin-approval gating column already covered by
--    existing application_status enum ('joined','approved','rejected',...).
--    Add admin_notes for rejection reason.
alter table public.task_applications
  add column if not exists admin_notes text;

-- 9. Refresh PostgREST schema cache so embeds work immediately.
notify pgrst, 'reload schema';
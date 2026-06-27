-- =====================================================================
-- EGRATASKS — Admin & Moderation overhaul (2027-02). Safe to re-run.
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

-- 2. Columns NewTask.tsx inserts + moderation flag.
alter table public.tasks
  add column if not exists category text,
  add column if not exists category_group text,
  add column if not exists approved boolean not null default false,
  add column if not exists approved_at timestamptz,
  add column if not exists approved_by uuid references auth.users(id);

alter table public.advertisements
  add column if not exists approved boolean not null default false;

-- 3. Default new client-created tasks to NOT approved (admin must approve).
create or replace function public.tasks_force_pending_review()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if public.has_role(auth.uid(), 'admin') then
    new.approved := true;
    new.approved_at := now();
    new.approved_by := auth.uid();
  else
    new.approved := false;
  end if;
  return new;
end$$;
drop trigger if exists trg_tasks_pending_review on public.tasks;
create trigger trg_tasks_pending_review
  before insert on public.tasks
  for each row execute function public.tasks_force_pending_review();

-- Workers see only approved tasks; owners + admins see all.
drop policy if exists "Tasks viewable" on public.tasks;
create policy "Tasks viewable" on public.tasks for select to authenticated
  using (
    approved = true
    or hiring_id = auth.uid()
    or public.has_role(auth.uid(),'admin')
  );

-- 4. Admin can read all support tickets / messages (has_role bypass).
drop policy if exists "Users see own tickets" on public.support_tickets;
create policy "Users see own tickets" on public.support_tickets for select to authenticated
  using (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));

drop policy if exists "Ticket members read messages" on public.support_messages;
create policy "Ticket members read messages" on public.support_messages for select to authenticated
  using (
    public.has_role(auth.uid(),'admin')
    or exists (select 1 from public.support_tickets t where t.id = ticket_id and t.user_id = auth.uid())
  );

-- 5. Admin direct/broadcast messages.
drop policy if exists "Users send messages" on public.messages;
create policy "Users send messages" on public.messages for insert to authenticated
  with check (from_user = auth.uid() or public.has_role(auth.uid(),'admin'));

drop policy if exists "Admins read all messages" on public.messages;
create policy "Admins read all messages" on public.messages for select to authenticated
  using (to_user = auth.uid() or from_user = auth.uid() or public.has_role(auth.uid(),'admin'));

-- 6. Admin can manage user_roles (grant/revoke admin).
drop policy if exists "Admins manage roles" on public.user_roles;
create policy "Admins manage roles" on public.user_roles for all to authenticated
  using (public.has_role(auth.uid(),'admin'))
  with check (public.has_role(auth.uid(),'admin'));

-- 7. Worker application: admin-approval gating column for rejection reason.
alter table public.task_applications
  add column if not exists admin_notes text;

-- 8. Refresh PostgREST schema cache so embeds work immediately.
notify pgrst, 'reload schema';

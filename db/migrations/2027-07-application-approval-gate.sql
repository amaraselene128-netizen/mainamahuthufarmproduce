-- 2027-07: Enforce admin approval before an applicant "joins" a task.
-- 1) Add 'pending' to the application_status enum (kept alongside legacy 'joined').
-- 2) Switch task_applications default to 'pending'.
-- 3) Make apply_to_task() insert a pending row WITHOUT consuming a worker slot.
-- 4) Add a trigger so the slot is only consumed once an admin/client approves
--    the application, and freed if the application is later rejected.

do $$ begin
  alter type public.application_status add value if not exists 'pending';
exception when others then null; end $$;

alter table public.task_applications alter column status set default 'pending';

-- Normalise any legacy rows that still sit on 'joined' but were never reviewed
-- (current_workers was inflated by the old RPC). We do NOT decrement the
-- counter retroactively to avoid touching live task quotas.
-- New rows will use 'pending' going forward.

create or replace function public.apply_to_task(_task_id uuid)
returns public.task_applications language plpgsql security definer set search_path = public as $$
declare t public.tasks%rowtype; app public.task_applications%rowtype;
begin
  select * into t from public.tasks where id = _task_id for update;
  if not found then raise exception 'Task not found'; end if;
  if t.status <> 'active' then raise exception 'Task is no longer accepting applicants'; end if;
  if t.current_workers >= t.max_workers then
    update public.tasks set status='taken' where id=_task_id;
    raise exception 'Task is full';
  end if;
  -- Pending application — does NOT consume a worker slot. Admin/client must approve.
  insert into public.task_applications (task_id, worker_id, status)
    values (_task_id, auth.uid(), 'pending')
    returning * into app;
  return app;
end; $$;
grant execute on function public.apply_to_task(uuid) to authenticated;

create or replace function public.task_application_slot_sync()
returns trigger language plpgsql security definer set search_path = public as $$
declare t public.tasks%rowtype;
begin
  if tg_op = 'UPDATE' then
    -- Transitioning INTO approved (or submitted) consumes a slot.
    if (new.status in ('approved','submitted')) and (old.status not in ('approved','submitted')) then
      select * into t from public.tasks where id = new.task_id for update;
      if t.current_workers >= t.max_workers then
        raise exception 'Task is full — cannot approve more workers';
      end if;
      update public.tasks
        set current_workers = current_workers + 1,
            status = case when current_workers + 1 >= max_workers then 'taken'::public.task_status else status end
        where id = new.task_id;
    end if;
    -- Transitioning OUT of approved (e.g. rejected after approval) frees a slot.
    if (old.status in ('approved','submitted')) and (new.status not in ('approved','submitted')) then
      update public.tasks
        set current_workers = greatest(current_workers - 1, 0),
            status = case when status = 'taken' and current_workers - 1 < max_workers then 'active'::public.task_status else status end
        where id = new.task_id;
    end if;
  end if;
  return new;
end; $$;

drop trigger if exists task_application_slot_sync on public.task_applications;
create trigger task_application_slot_sync
  after update on public.task_applications
  for each row execute function public.task_application_slot_sync();

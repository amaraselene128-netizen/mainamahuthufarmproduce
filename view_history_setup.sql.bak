-- =====================================================================
-- View History — server-side persistence for "You Might Also Like"
-- Run this in the Supabase SQL editor.
-- =====================================================================

-- 1) Table
create table if not exists public.view_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  listing_id uuid not null,
  listing_type text not null check (listing_type in ('product','service','event')),
  section text,
  category text,
  subcategory text,
  viewed_at timestamptz not null default now(),
  unique (user_id, listing_id)
);

create index if not exists view_history_user_viewed_idx
  on public.view_history (user_id, viewed_at desc);

create index if not exists view_history_user_category_idx
  on public.view_history (user_id, category);

create index if not exists view_history_user_section_idx
  on public.view_history (user_id, section);

-- 2) RLS — users can only see/manage their own view history
alter table public.view_history enable row level security;

drop policy if exists "view_history_select_own" on public.view_history;
create policy "view_history_select_own"
  on public.view_history
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "view_history_insert_own" on public.view_history;
create policy "view_history_insert_own"
  on public.view_history
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "view_history_update_own" on public.view_history;
create policy "view_history_update_own"
  on public.view_history
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "view_history_delete_own" on public.view_history;
create policy "view_history_delete_own"
  on public.view_history
  for delete
  to authenticated
  using (auth.uid() = user_id);

-- 3) Upsert helper (refresh viewed_at on repeat views)
create or replace function public.record_view(
  _listing_id uuid,
  _listing_type text,
  _section text default null,
  _category text default null,
  _subcategory text default null
) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    return;
  end if;

  insert into public.view_history (
    user_id, listing_id, listing_type, section, category, subcategory, viewed_at
  )
  values (
    auth.uid(), _listing_id, _listing_type, _section, _category, _subcategory, now()
  )
  on conflict (user_id, listing_id) do update
    set viewed_at  = excluded.viewed_at,
        section    = coalesce(excluded.section, public.view_history.section),
        category   = coalesce(excluded.category, public.view_history.category),
        subcategory= coalesce(excluded.subcategory, public.view_history.subcategory);

  -- Keep only the 50 most recent per user
  delete from public.view_history v
  where v.user_id = auth.uid()
    and v.id not in (
      select id from public.view_history
      where user_id = auth.uid()
      order by viewed_at desc
      limit 50
    );
end;
$$;

grant execute on function public.record_view(uuid, text, text, text, text) to authenticated;

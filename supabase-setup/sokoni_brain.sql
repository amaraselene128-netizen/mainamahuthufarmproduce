-- =====================================================================
-- Sokoni Arena — Assistant Brain
-- Run this once in your external Supabase SQL editor.
-- Safe to re-run.
--
-- It creates a `assistant_brain` table that augments the in-app
-- semantic network. The app already ships with thousands of expansions
-- bundled in `src/lib/sokoni-assistant/semanticNetwork.ts`. Inserting
-- rows here lets you grow the brain over time without code changes.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1) Brain table — keyword clusters
-- ---------------------------------------------------------------------
create table if not exists public.assistant_brain (
  id           uuid primary key default gen_random_uuid(),
  cluster_id   text not null,                    -- e.g. "vehicles:cars", "home:seating"
  words        text[] not null default '{}',     -- list of related keywords
  weight       numeric not null default 1.0,
  notes        text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (cluster_id)
);

create index if not exists assistant_brain_cluster_idx
  on public.assistant_brain (cluster_id);

alter table public.assistant_brain enable row level security;

-- Public read (the brain is non-sensitive marketplace knowledge)
drop policy if exists "brain_public_read" on public.assistant_brain;
create policy "brain_public_read" on public.assistant_brain
  for select to anon, authenticated using (true);

-- Only admins can mutate
drop policy if exists "brain_admin_write" on public.assistant_brain;
create policy "brain_admin_write" on public.assistant_brain
  for all to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- ---------------------------------------------------------------------
-- 2) Conversation flow state — remembers active multi-turn flow per user
-- ---------------------------------------------------------------------
create table if not exists public.assistant_flow_state (
  user_id     uuid primary key references auth.users(id) on delete cascade,
  flow_id     text not null,
  step_id     text not null,
  updated_at  timestamptz not null default now()
);

alter table public.assistant_flow_state enable row level security;

drop policy if exists "flow_state_own" on public.assistant_flow_state;
create policy "flow_state_own" on public.assistant_flow_state
  for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------
-- 3) Seed a few starter clusters (optional — the app already has these
-- bundled, but having them here lets you extend or override).
-- ---------------------------------------------------------------------
insert into public.assistant_brain (cluster_id, words, notes) values
  ('vehicles:luxury', array['mercedes','benz','bmw','audi','lexus','porsche','range rover','jaguar','volvo','land rover'], 'European/luxury sedans & SUVs'),
  ('home:dining', array['dining set','dinning set','dining table','dining chair','4 seater dining','6 seater dining','8 seater dining'], 'Dining-room cluster — handles common typo "dinning"'),
  ('electronics:phones:apple', array['iphone','apple','iphone 15','iphone 14','iphone 13','iphone 12','iphone se','iphone pro','iphone pro max'], 'Apple smartphone family'),
  ('property:rent', array['for rent','to let','tolet','rental','bedsitter','one bedroom','two bedroom','three bedroom','studio apartment','furnished apartment'], 'Rental property cluster')
on conflict (cluster_id) do update
  set words = excluded.words,
      updated_at = now();

-- ---------------------------------------------------------------------
-- 4) Verification
-- ---------------------------------------------------------------------
select 'assistant_brain rows:' as check, count(*)::text as value from public.assistant_brain
union all
select 'assistant_flow_state exists:', 'yes' where to_regclass('public.assistant_flow_state') is not null;

-- ============================================================
-- EGMTASKS — full database schema.
-- Run once in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/iycbpeujxgwcsmelvwdw/sql/new
-- ============================================================

do $$ begin create type public.app_role as enum ('admin','moderator','user'); exception when duplicate_object then null; end $$;
do $$ begin create type public.account_mode as enum ('worker','hiring'); exception when duplicate_object then null; end $$;
do $$ begin create type public.task_tier as enum ('bronze','silver','gold'); exception when duplicate_object then null; end $$;
do $$ begin create type public.task_status as enum ('active','taken','closed','paused'); exception when duplicate_object then null; end $$;
do $$ begin create type public.application_status as enum ('joined','submitted','approved','rejected','revision'); exception when duplicate_object then null; end $$;
do $$ begin create type public.submission_status as enum ('pending','approved','rejected','revision'); exception when duplicate_object then null; end $$;
do $$ begin create type public.withdrawal_status as enum ('pending','approved','paid','rejected'); exception when duplicate_object then null; end $$;
do $$ begin create type public.fraud_level as enum ('low','medium','high','critical'); exception when duplicate_object then null; end $$;
do $$ begin create type public.ticket_status as enum ('open','pending','resolved','closed'); exception when duplicate_object then null; end $$;
do $$ begin create type public.referral_tier as enum ('bronze','silver','gold'); exception when duplicate_object then null; end $$;
do $$ begin create type public.market_link_type as enum ('youtube','tiktok','instagram','facebook','website','mobile_app','service'); exception when duplicate_object then null; end $$;

create table if not exists public.countries (
  code text primary key, name text not null,
  restricted boolean not null default false,
  created_at timestamptz not null default now()
);
grant select on public.countries to anon, authenticated;
grant all on public.countries to service_role;
alter table public.countries enable row level security;
drop policy if exists "Countries public" on public.countries;
create policy "Countries public" on public.countries for select to anon, authenticated using (true);
insert into public.countries (code, name) values
('US','United States'),('GB','United Kingdom'),('CA','Canada'),('AU','Australia'),
('KE','Kenya'),('NG','Nigeria'),('ZA','South Africa'),('GH','Ghana'),('TZ','Tanzania'),
('UG','Uganda'),('IN','India'),('PK','Pakistan'),('BD','Bangladesh'),('PH','Philippines'),
('ID','Indonesia'),('VN','Vietnam'),('MY','Malaysia'),('SG','Singapore'),('AE','United Arab Emirates'),
('SA','Saudi Arabia'),('EG','Egypt'),('MA','Morocco'),('DE','Germany'),('FR','France'),
('IT','Italy'),('ES','Spain'),('NL','Netherlands'),('SE','Sweden'),('NO','Norway'),
('BR','Brazil'),('MX','Mexico'),('AR','Argentina'),('CO','Colombia'),('CL','Chile'),
('JP','Japan'),('KR','South Korea'),('CN','China'),('HK','Hong Kong'),('TR','Turkey')
on conflict (code) do nothing;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  username text unique not null,
  full_name text,
  country_code text references public.countries(code),
  avatar_url text,
  bio text,
  skills text[] not null default '{}',
  social_links jsonb not null default '{}',
  account_mode public.account_mode not null default 'worker',
  two_factor_enabled boolean not null default false,
  suspended boolean not null default false,
  banned boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;
drop policy if exists "Profiles viewable by authenticated" on public.profiles;
create policy "Profiles viewable by authenticated" on public.profiles for select to authenticated using (true);
drop policy if exists "Users update own profile" on public.profiles;
create policy "Users update own profile" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
drop policy if exists "Users insert own profile" on public.profiles;
create policy "Users insert own profile" on public.profiles for insert to authenticated with check (id = auth.uid());

create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

drop policy if exists "Users read own roles" on public.user_roles;
create policy "Users read own roles" on public.user_roles for select to authenticated using (user_id = auth.uid());
drop policy if exists "Admins read all roles" on public.user_roles;
create policy "Admins read all roles" on public.user_roles for select to authenticated using (public.has_role(auth.uid(),'admin'));

create table if not exists public.wallets (
  user_id uuid primary key references auth.users(id) on delete cascade,
  available numeric(12,2) not null default 0,
  pending numeric(12,2) not null default 0,
  total_earned numeric(12,2) not null default 0,
  total_withdrawn numeric(12,2) not null default 0,
  updated_at timestamptz not null default now()
);
grant select, update on public.wallets to authenticated;
grant all on public.wallets to service_role;
alter table public.wallets enable row level security;
drop policy if exists "Users see own wallet" on public.wallets;
create policy "Users see own wallet" on public.wallets for select to authenticated using (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare uname text;
begin
  uname := coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1));
  while exists (select 1 from public.profiles where username = uname) loop
    uname := uname || floor(random()*10000)::text;
  end loop;
  insert into public.profiles (id, email, username, country_code, account_mode)
  values (new.id, new.email, uname,
    coalesce(new.raw_user_meta_data->>'country_code', null),
    coalesce((new.raw_user_meta_data->>'account_mode')::public.account_mode, 'worker'));
  insert into public.wallets (user_id) values (new.id);
  return new;
end; $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  icon text,
  description text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
grant select on public.categories to anon, authenticated;
grant all on public.categories to service_role;
alter table public.categories enable row level security;
drop policy if exists "Categories public" on public.categories;
create policy "Categories public" on public.categories for select to anon, authenticated using (true);
drop policy if exists "Admins manage categories" on public.categories;
create policy "Admins manage categories" on public.categories for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
insert into public.categories (slug, name, icon) values
('youtube','YouTube','Youtube'),('tiktok','TikTok','Music2'),('instagram','Instagram','Instagram'),
('facebook','Facebook','Facebook'),('websites','Websites','Globe'),('mobile-apps','Mobile Apps','Smartphone'),
('services','Services','Briefcase'),('writing','Writing','PenTool'),('design','Design','Palette')
on conflict (slug) do nothing;

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  hiring_id uuid not null references auth.users(id) on delete cascade,
  category_id uuid references public.categories(id),
  title text not null,
  description text not null,
  requirements text,
  instructions text,
  payment_amount numeric(10,2) not null check (payment_amount > 0),
  tier public.task_tier not null default 'bronze',
  deadline timestamptz,
  max_workers int not null default 20,
  current_workers int not null default 0,
  status public.task_status not null default 'active',
  attachments jsonb not null default '[]',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists tasks_status_idx on public.tasks(status, created_at desc);
create index if not exists tasks_hiring_idx on public.tasks(hiring_id);
grant select, insert, update, delete on public.tasks to authenticated;
grant all on public.tasks to service_role;
alter table public.tasks enable row level security;
drop policy if exists "Tasks viewable" on public.tasks;
create policy "Tasks viewable" on public.tasks for select to authenticated using (true);
drop policy if exists "Hiring users create tasks" on public.tasks;
create policy "Hiring users create tasks" on public.tasks for insert to authenticated with check (hiring_id = auth.uid());
drop policy if exists "Hiring update own tasks" on public.tasks;
create policy "Hiring update own tasks" on public.tasks for update to authenticated using (hiring_id = auth.uid() or public.has_role(auth.uid(),'admin'));
drop policy if exists "Hiring delete own tasks" on public.tasks;
create policy "Hiring delete own tasks" on public.tasks for delete to authenticated using (hiring_id = auth.uid() or public.has_role(auth.uid(),'admin'));

create table if not exists public.task_applications (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  worker_id uuid not null references auth.users(id) on delete cascade,
  status public.application_status not null default 'joined',
  applied_at timestamptz not null default now(),
  unique (task_id, worker_id)
);
create index if not exists task_apps_worker_idx on public.task_applications(worker_id);
create index if not exists task_apps_task_idx on public.task_applications(task_id);
grant select, insert, update on public.task_applications to authenticated;
grant all on public.task_applications to service_role;
alter table public.task_applications enable row level security;
drop policy if exists "App visibility" on public.task_applications;
create policy "App visibility" on public.task_applications for select to authenticated
  using (worker_id = auth.uid() or exists (select 1 from public.tasks t where t.id = task_id and t.hiring_id = auth.uid()) or public.has_role(auth.uid(),'admin'));
drop policy if exists "Workers apply" on public.task_applications;
create policy "Workers apply" on public.task_applications for insert to authenticated with check (worker_id = auth.uid());
drop policy if exists "Hiring updates application" on public.task_applications;
create policy "Hiring updates application" on public.task_applications for update to authenticated
  using (exists (select 1 from public.tasks t where t.id = task_id and t.hiring_id = auth.uid()) or public.has_role(auth.uid(),'admin'));

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
  insert into public.task_applications (task_id, worker_id) values (_task_id, auth.uid()) returning * into app;
  update public.tasks set current_workers = current_workers + 1,
    status = case when current_workers + 1 >= max_workers then 'taken'::public.task_status else status end
    where id = _task_id;
  return app;
end; $$;
grant execute on function public.apply_to_task(uuid) to authenticated;

create table if not exists public.task_submissions (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.task_applications(id) on delete cascade,
  task_id uuid not null references public.tasks(id) on delete cascade,
  worker_id uuid not null references auth.users(id) on delete cascade,
  files jsonb not null default '[]',
  urls text[] not null default '{}',
  comments text,
  status public.submission_status not null default 'pending',
  admin_comment text,
  reviewer_id uuid references auth.users(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists submissions_worker_idx on public.task_submissions(worker_id);
grant select, insert, update on public.task_submissions to authenticated;
grant all on public.task_submissions to service_role;
alter table public.task_submissions enable row level security;
drop policy if exists "Submission visibility" on public.task_submissions;
create policy "Submission visibility" on public.task_submissions for select to authenticated
  using (worker_id = auth.uid() or exists (select 1 from public.tasks t where t.id = task_id and t.hiring_id = auth.uid()) or public.has_role(auth.uid(),'admin'));
drop policy if exists "Workers insert submissions" on public.task_submissions;
create policy "Workers insert submissions" on public.task_submissions for insert to authenticated with check (worker_id = auth.uid());
drop policy if exists "Submission updates" on public.task_submissions;
create policy "Submission updates" on public.task_submissions for update to authenticated
  using ((worker_id = auth.uid() and status in ('pending','revision')) or exists (select 1 from public.tasks t where t.id = task_id and t.hiring_id = auth.uid()) or public.has_role(auth.uid(),'admin'));

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  hiring_id uuid not null references auth.users(id) on delete cascade,
  worker_id uuid references auth.users(id) on delete set null,
  rating int not null check (rating between 1 and 5),
  feedback text,
  satisfaction int check (satisfaction between 1 and 5),
  admin_feedback text,
  created_at timestamptz not null default now()
);
grant select, insert on public.reviews to authenticated;
grant all on public.reviews to service_role;
alter table public.reviews enable row level security;
drop policy if exists "Reviews viewable" on public.reviews;
create policy "Reviews viewable" on public.reviews for select to authenticated using (true);
drop policy if exists "Hiring creates reviews" on public.reviews;
create policy "Hiring creates reviews" on public.reviews for insert to authenticated with check (hiring_id = auth.uid());

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null,
  amount numeric(12,2) not null,
  status text not null default 'completed',
  reference text,
  details jsonb default '{}',
  created_at timestamptz not null default now()
);
create index if not exists tx_user_idx on public.transactions(user_id, created_at desc);
grant select on public.transactions to authenticated;
grant all on public.transactions to service_role;
alter table public.transactions enable row level security;
drop policy if exists "Users see own tx" on public.transactions;
create policy "Users see own tx" on public.transactions for select to authenticated using (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));

create table if not exists public.withdrawal_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  amount numeric(12,2) not null check (amount > 0),
  method text not null,
  details jsonb not null default '{}',
  status public.withdrawal_status not null default 'pending',
  approved_at timestamptz,
  paid_at timestamptz,
  created_at timestamptz not null default now()
);
grant select, insert on public.withdrawal_requests to authenticated;
grant all on public.withdrawal_requests to service_role;
alter table public.withdrawal_requests enable row level security;
drop policy if exists "Users see own withdrawals" on public.withdrawal_requests;
create policy "Users see own withdrawals" on public.withdrawal_requests for select to authenticated using (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));
drop policy if exists "Users request withdrawal" on public.withdrawal_requests;
create policy "Users request withdrawal" on public.withdrawal_requests for insert to authenticated with check (user_id = auth.uid());
drop policy if exists "Admins update withdrawals" on public.withdrawal_requests;
create policy "Admins update withdrawals" on public.withdrawal_requests for update to authenticated using (public.has_role(auth.uid(),'admin'));

create table if not exists public.payment_methods (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null,
  details jsonb not null default '{}',
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.payment_methods to authenticated;
grant all on public.payment_methods to service_role;
alter table public.payment_methods enable row level security;
drop policy if exists "Users manage own payment methods" on public.payment_methods;
create policy "Users manage own payment methods" on public.payment_methods for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null,
  title text not null,
  body text,
  link text,
  read boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists notifs_user_idx on public.notifications(user_id, created_at desc);
grant select, update on public.notifications to authenticated;
grant all on public.notifications to service_role;
alter table public.notifications enable row level security;
drop policy if exists "Users see own notifications" on public.notifications;
create policy "Users see own notifications" on public.notifications for select to authenticated using (user_id = auth.uid());
drop policy if exists "Users mark own notifications" on public.notifications;
create policy "Users mark own notifications" on public.notifications for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  from_user uuid references auth.users(id) on delete set null,
  to_user uuid not null references auth.users(id) on delete cascade,
  subject text,
  body text not null,
  read boolean not null default false,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);
grant select, insert, update on public.messages to authenticated;
grant all on public.messages to service_role;
alter table public.messages enable row level security;
drop policy if exists "Users see own messages" on public.messages;
create policy "Users see own messages" on public.messages for select to authenticated using (to_user = auth.uid() or from_user = auth.uid());
drop policy if exists "Users send messages" on public.messages;
create policy "Users send messages" on public.messages for insert to authenticated with check (from_user = auth.uid() or public.has_role(auth.uid(),'admin'));

create table if not exists public.market_submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  link_type public.market_link_type not null,
  category_slug text,
  url text not null,
  notes text,
  status text not null default 'pending',
  created_at timestamptz not null default now()
);
grant select, insert on public.market_submissions to anon, authenticated;
grant all on public.market_submissions to service_role;
alter table public.market_submissions enable row level security;
drop policy if exists "Anyone submit market" on public.market_submissions;
create policy "Anyone submit market" on public.market_submissions for insert to anon, authenticated with check (true);
drop policy if exists "Owner reads own market" on public.market_submissions;
create policy "Owner reads own market" on public.market_submissions for select to authenticated using (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));

create table if not exists public.referral_plans (
  id uuid primary key default gen_random_uuid(),
  tier public.referral_tier unique not null,
  price numeric(10,2) not null,
  commission_rate numeric(5,4) not null,
  features jsonb not null default '[]',
  active boolean not null default true
);
grant select on public.referral_plans to anon, authenticated;
grant all on public.referral_plans to service_role;
alter table public.referral_plans enable row level security;
drop policy if exists "Plans public" on public.referral_plans;
create policy "Plans public" on public.referral_plans for select to anon, authenticated using (true);
drop policy if exists "Admins manage plans" on public.referral_plans;
create policy "Admins manage plans" on public.referral_plans for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
insert into public.referral_plans (tier, price, commission_rate, features) values
('bronze', 2,    0.10, '["10% commission","Unique referral link","Basic analytics"]'),
('silver', 500,  0.10, '["10% commission","Advanced analytics","Priority support"]'),
('gold',   1000, 0.10, '["10% commission","Premium dashboard","Dedicated manager","Custom branding"]')
on conflict (tier) do nothing;

create table if not exists public.referral_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_id uuid not null references public.referral_plans(id),
  started_at timestamptz not null default now(),
  expires_at timestamptz,
  active boolean not null default true,
  unique (user_id)
);
grant select, insert on public.referral_subscriptions to authenticated;
grant all on public.referral_subscriptions to service_role;
alter table public.referral_subscriptions enable row level security;
drop policy if exists "Users see own subscription" on public.referral_subscriptions;
create policy "Users see own subscription" on public.referral_subscriptions for select to authenticated using (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));
drop policy if exists "Users buy subscription" on public.referral_subscriptions;
create policy "Users buy subscription" on public.referral_subscriptions for insert to authenticated with check (user_id = auth.uid());

create table if not exists public.referrals (
  id uuid primary key default gen_random_uuid(),
  referrer_id uuid not null references auth.users(id) on delete cascade,
  referred_id uuid references auth.users(id) on delete set null,
  code text not null,
  verified_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists refs_referrer_idx on public.referrals(referrer_id);
create index if not exists refs_code_idx on public.referrals(code);
grant select, insert, update on public.referrals to authenticated;
grant all on public.referrals to service_role;
alter table public.referrals enable row level security;
drop policy if exists "Users see own referrals" on public.referrals;
create policy "Users see own referrals" on public.referrals for select to authenticated using (referrer_id = auth.uid() or referred_id = auth.uid() or public.has_role(auth.uid(),'admin'));

create table if not exists public.referral_clicks (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  ip_hash text,
  user_agent text,
  created_at timestamptz not null default now()
);
grant select, insert on public.referral_clicks to anon, authenticated;
grant all on public.referral_clicks to service_role;
alter table public.referral_clicks enable row level security;
drop policy if exists "Public log clicks" on public.referral_clicks;
create policy "Public log clicks" on public.referral_clicks for insert to anon, authenticated with check (true);
drop policy if exists "Admin reads clicks" on public.referral_clicks;
create policy "Admin reads clicks" on public.referral_clicks for select to authenticated using (public.has_role(auth.uid(),'admin'));

create table if not exists public.referral_earnings (
  id uuid primary key default gen_random_uuid(),
  referrer_id uuid not null references auth.users(id) on delete cascade,
  referral_id uuid references public.referrals(id) on delete set null,
  amount numeric(10,2) not null,
  status text not null default 'pending',
  created_at timestamptz not null default now()
);
grant select on public.referral_earnings to authenticated;
grant all on public.referral_earnings to service_role;
alter table public.referral_earnings enable row level security;
drop policy if exists "Users see own earnings" on public.referral_earnings;
create policy "Users see own earnings" on public.referral_earnings for select to authenticated using (referrer_id = auth.uid() or public.has_role(auth.uid(),'admin'));

create table if not exists public.referral_withdrawals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  amount numeric(10,2) not null,
  status public.withdrawal_status not null default 'pending',
  method text,
  created_at timestamptz not null default now()
);
grant select, insert on public.referral_withdrawals to authenticated;
grant all on public.referral_withdrawals to service_role;
alter table public.referral_withdrawals enable row level security;
drop policy if exists "Users see own ref withdrawals" on public.referral_withdrawals;
create policy "Users see own ref withdrawals" on public.referral_withdrawals for select to authenticated using (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));
drop policy if exists "Users request ref withdrawal" on public.referral_withdrawals;
create policy "Users request ref withdrawal" on public.referral_withdrawals for insert to authenticated with check (user_id = auth.uid());

create table if not exists public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  subject text not null,
  category text,
  status public.ticket_status not null default 'open',
  assigned_to uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update on public.support_tickets to authenticated;
grant all on public.support_tickets to service_role;
alter table public.support_tickets enable row level security;
drop policy if exists "Users see own tickets" on public.support_tickets;
create policy "Users see own tickets" on public.support_tickets for select to authenticated using (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));
drop policy if exists "Users create tickets" on public.support_tickets;
create policy "Users create tickets" on public.support_tickets for insert to authenticated with check (user_id = auth.uid());
drop policy if exists "Owner or admin update ticket" on public.support_tickets;
create policy "Owner or admin update ticket" on public.support_tickets for update to authenticated using (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));

create table if not exists public.support_messages (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.support_tickets(id) on delete cascade,
  sender_id uuid references auth.users(id) on delete set null,
  body text not null,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);
grant select, insert on public.support_messages to authenticated;
grant all on public.support_messages to service_role;
alter table public.support_messages enable row level security;
drop policy if exists "Ticket members read messages" on public.support_messages;
create policy "Ticket members read messages" on public.support_messages for select to authenticated
  using (exists (select 1 from public.support_tickets t where t.id = ticket_id and (t.user_id = auth.uid() or public.has_role(auth.uid(),'admin'))));
drop policy if exists "Ticket members send messages" on public.support_messages;
create policy "Ticket members send messages" on public.support_messages for insert to authenticated
  with check (exists (select 1 from public.support_tickets t where t.id = ticket_id and (t.user_id = auth.uid() or public.has_role(auth.uid(),'admin'))));

create table if not exists public.fraud_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  level public.fraud_level not null,
  type text not null,
  score numeric(5,2) not null default 0,
  details jsonb not null default '{}',
  resolved boolean not null default false,
  created_at timestamptz not null default now()
);
grant select on public.fraud_reports to authenticated;
grant all on public.fraud_reports to service_role;
alter table public.fraud_reports enable row level security;
drop policy if exists "Admins read fraud" on public.fraud_reports;
create policy "Admins read fraud" on public.fraud_reports for select to authenticated using (public.has_role(auth.uid(),'admin'));

create table if not exists public.device_fingerprints (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  fingerprint text not null,
  ip_hash text,
  user_agent text,
  created_at timestamptz not null default now()
);
grant select, insert on public.device_fingerprints to authenticated;
grant all on public.device_fingerprints to service_role;
alter table public.device_fingerprints enable row level security;
drop policy if exists "Users record own fp" on public.device_fingerprints;
create policy "Users record own fp" on public.device_fingerprints for insert to authenticated with check (user_id = auth.uid());
drop policy if exists "Admins read fp" on public.device_fingerprints;
create policy "Admins read fp" on public.device_fingerprints for select to authenticated using (public.has_role(auth.uid(),'admin'));

create table if not exists public.settings (
  key text primary key,
  value jsonb not null default '{}',
  updated_at timestamptz not null default now()
);
grant select on public.settings to anon, authenticated;
grant all on public.settings to service_role;
alter table public.settings enable row level security;
drop policy if exists "Settings public read" on public.settings;
create policy "Settings public read" on public.settings for select to anon, authenticated using (true);
drop policy if exists "Admins write settings" on public.settings;
create policy "Admins write settings" on public.settings for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
insert into public.settings (key, value) values
('payouts', '{"min_withdrawal": 10, "monthly_date": 28, "currency": "USD"}'),
('platform', '{"hq": "Nairobi, Kenya", "support_email": "support@egmtasks.com"}')
on conflict (key) do nothing;

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$ begin new.updated_at = now(); return new; end; $$;
drop trigger if exists touch_profiles on public.profiles;
create trigger touch_profiles before update on public.profiles for each row execute function public.touch_updated_at();
drop trigger if exists touch_tasks on public.tasks;
create trigger touch_tasks before update on public.tasks for each row execute function public.touch_updated_at();
drop trigger if exists touch_tickets on public.support_tickets;
create trigger touch_tickets before update on public.support_tickets for each row execute function public.touch_updated_at();

-- Storage buckets
insert into storage.buckets (id, name, public) values ('avatars','avatars',true) on conflict do nothing;
insert into storage.buckets (id, name, public) values ('submissions','submissions',false) on conflict do nothing;
insert into storage.buckets (id, name, public) values ('task-attachments','task-attachments',true) on conflict do nothing;

drop policy if exists "Avatars public read" on storage.objects;
create policy "Avatars public read" on storage.objects for select using (bucket_id = 'avatars');
drop policy if exists "Users upload own avatar" on storage.objects;
create policy "Users upload own avatar" on storage.objects for insert to authenticated with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "Users update own avatar" on storage.objects;
create policy "Users update own avatar" on storage.objects for update to authenticated using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Submissions owner read" on storage.objects;
create policy "Submissions owner read" on storage.objects for select to authenticated using (bucket_id = 'submissions' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "Submissions owner upload" on storage.objects;
create policy "Submissions owner upload" on storage.objects for insert to authenticated with check (bucket_id = 'submissions' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Task attachments public read" on storage.objects;
create policy "Task attachments public read" on storage.objects for select using (bucket_id = 'task-attachments');
drop policy if exists "Task attachments owner upload" on storage.objects;
create policy "Task attachments owner upload" on storage.objects for insert to authenticated with check (bucket_id = 'task-attachments' and (storage.foldername(name))[1] = auth.uid()::text);
-- ============================================================
-- Additions (June 2026): support attachments, market_campaigns,
-- admin update policy for campaigns, submission-approval trigger
-- to credit worker wallets.
-- ============================================================

alter table public.support_messages add column if not exists attachments jsonb not null default '[]';
alter table public.support_tickets  add column if not exists attachments jsonb not null default '[]';

create table if not exists public.market_campaigns (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  category text not null,
  title text not null,
  description text not null,
  website_url text,
  video_url text,
  social_url text,
  budget numeric(12,2),
  target_countries text[] not null default '{}',
  start_date date,
  end_date date,
  instructions text,
  contact_email text,
  attachments jsonb not null default '[]',
  status text not null default 'pending',
  admin_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  promotion_type text not null default 'external' check (promotion_type in ('on_site','external')),
  video_file_url text,
  duration_seconds int check (duration_seconds is null or duration_seconds in (15,30,45,60))
);
grant select, insert on public.market_campaigns to anon, authenticated;
grant select, insert, update, delete on public.market_campaigns to authenticated;
grant all on public.market_campaigns to service_role;
alter table public.market_campaigns enable row level security;
drop policy if exists "Anyone submit campaign" on public.market_campaigns;
create policy "Anyone submit campaign" on public.market_campaigns
  for insert to anon, authenticated with check (true);
drop policy if exists "Owner or admin read campaign" on public.market_campaigns;
create policy "Owner or admin read campaign" on public.market_campaigns
  for select to authenticated using (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));
drop policy if exists "Admin update campaign" on public.market_campaigns;
create policy "Admin update campaign" on public.market_campaigns
  for update to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
drop policy if exists "Admin delete campaign" on public.market_campaigns;
create policy "Admin delete campaign" on public.market_campaigns
  for delete to authenticated using (public.has_role(auth.uid(),'admin'));

-- Auto-credit worker wallet + log transaction when a submission is approved.
create or replace function public.on_submission_status_change()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  pay numeric(12,2);
begin
  if new.status = 'approved' and (old.status is null or old.status <> 'approved') then
    select payment_amount into pay from public.tasks where id = new.task_id;
    if pay is not null then
      insert into public.wallets (user_id, available, total_earned)
      values (new.worker_id, pay, pay)
      on conflict (user_id) do update
        set available    = public.wallets.available    + excluded.available,
            total_earned = public.wallets.total_earned + excluded.total_earned,
            updated_at   = now();
      insert into public.transactions (user_id, type, amount, status, reference, details)
      values (new.worker_id, 'task_earning', pay, 'completed', new.id::text,
              jsonb_build_object('task_id', new.task_id, 'submission_id', new.id));
    end if;
    update public.task_applications set status = 'approved' where id = new.application_id;
  elsif new.status = 'rejected' and (old.status is null or old.status <> 'rejected') then
    update public.task_applications set status = 'rejected' where id = new.application_id;
  elsif new.status = 'revision' and (old.status is null or old.status <> 'revision') then
    update public.task_applications set status = 'revision' where id = new.application_id;
  end if;
  return new;
end; $$;
drop trigger if exists on_submission_status_change on public.task_submissions;
create trigger on_submission_status_change
  after insert or update of status on public.task_submissions
  for each row execute function public.on_submission_status_change();

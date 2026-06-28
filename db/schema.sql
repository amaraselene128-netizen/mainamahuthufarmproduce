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
do $$ begin create type public.tier_level as enum ('bronze','silver','gold'); exception when duplicate_object then null; end $$;

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
  referral_code text,
  referred_by uuid references public.profiles(id),
  active_tier public.tier_level,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists profiles_referral_code_unique on public.profiles(referral_code) where referral_code is not null;
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
declare
  uname text;
  ref_code text := nullif(new.raw_user_meta_data->>'referral_code', '');
  referrer uuid;
begin
  uname := coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1));
  while exists (select 1 from public.profiles where username = uname) loop
    uname := uname || floor(random()*10000)::text;
  end loop;
  if ref_code is not null then
    select id into referrer from public.profiles where referral_code = ref_code limit 1;
  end if;
  insert into public.profiles (id, email, username, country_code, account_mode, referred_by)
  values (new.id, new.email, uname,
    coalesce(new.raw_user_meta_data->>'country_code', null),
    coalesce((new.raw_user_meta_data->>'account_mode')::public.account_mode, 'worker'),
    referrer);
  insert into public.wallets (user_id) values (new.id) on conflict (user_id) do nothing;
  if referrer is not null then
    insert into public.referrals(referrer_id, referred_id, code)
    values (referrer, new.id, ref_code)
    on conflict do nothing;
  end if;
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
  price_cents int,
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
('bronze', 5,    0.10, '["10% commission","Unique referral link","Basic analytics"]'),
('silver', 100,  0.10, '["10% commission","Advanced analytics","Priority support"]'),
('gold',   1000, 0.10, '["10% commission","Premium dashboard","Dedicated manager","Custom branding"]')
on conflict (tier) do nothing;
update public.referral_plans set price = 5, price_cents = 500 where tier = 'bronze';
update public.referral_plans set price = 100, price_cents = 10000 where tier = 'silver';
update public.referral_plans set price_cents = 100000 where tier = 'gold';

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
  source_user_id uuid references public.profiles(id),
  generation smallint,
  kind text,
  amount numeric(10,2) not null,
  amount_cents int,
  meta jsonb,
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

-- ============================================================
-- REWARDED ADS PROGRAM
-- ============================================================

do $$ begin create type public.ad_status as enum ('pending','active','paused','rejected','depleted'); exception when duplicate_object then null; end $$;

create table if not exists public.advertisements (
  id uuid primary key default gen_random_uuid(),
  advertiser_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  video_url text not null,
  video_public_id text,
  destination_url text not null,
  button_text text not null default 'Install Now',
  duration_seconds int not null check (duration_seconds in (15,30,45,60)),
  country_targeting text[] not null default '{}',
  budget_cents int not null check (budget_cents >= 0),
  spent_cents int not null default 0 check (spent_cents >= 0),
  views_purchased int not null default 0,
  views_completed int not null default 0,
  status public.ad_status not null default 'pending',
  admin_notes text,
  approved_at timestamptz,
  created_at timestamptz not null default now()
);
grant select, insert, update on public.advertisements to authenticated;
grant all on public.advertisements to service_role;
alter table public.advertisements enable row level security;
drop policy if exists "Ads viewable: active to all, own to advertiser, all to admin" on public.advertisements;
create policy "Ads viewable: active to all, own to advertiser, all to admin"
  on public.advertisements for select to authenticated
  using (status = 'active' or advertiser_id = auth.uid() or public.has_role(auth.uid(),'admin'));
drop policy if exists "Advertiser inserts own ad" on public.advertisements;
create policy "Advertiser inserts own ad" on public.advertisements for insert to authenticated
  with check (advertiser_id = auth.uid());
drop policy if exists "Advertiser updates own ad metadata" on public.advertisements;
create policy "Advertiser updates own ad metadata" on public.advertisements for update to authenticated
  using (advertiser_id = auth.uid() or public.has_role(auth.uid(),'admin'))
  with check (advertiser_id = auth.uid() or public.has_role(auth.uid(),'admin'));

create table if not exists public.ad_views (
  id uuid primary key default gen_random_uuid(),
  ad_id uuid not null references public.advertisements(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  watched_seconds int not null,
  completed boolean not null default false,
  reward_cents int not null default 0,
  ip text,
  user_agent text,
  fingerprint text,
  created_at timestamptz not null default now()
);
create unique index if not exists ad_views_one_completed_per_user
  on public.ad_views (ad_id, user_id) where completed;
grant select on public.ad_views to authenticated;
grant all on public.ad_views to service_role;
alter table public.ad_views enable row level security;
drop policy if exists "User reads own ad views" on public.ad_views;
create policy "User reads own ad views" on public.ad_views for select to authenticated
  using (user_id = auth.uid() or public.has_role(auth.uid(),'admin')
         or exists (select 1 from public.advertisements a where a.id = ad_id and a.advertiser_id = auth.uid()));

create table if not exists public.ad_clicks (
  id uuid primary key default gen_random_uuid(),
  ad_id uuid not null references public.advertisements(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  destination_url text not null,
  clicked_at timestamptz not null default now()
);
grant select, insert on public.ad_clicks to authenticated;
grant all on public.ad_clicks to service_role;
alter table public.ad_clicks enable row level security;
drop policy if exists "User inserts own click" on public.ad_clicks;
create policy "User inserts own click" on public.ad_clicks for insert to authenticated
  with check (user_id = auth.uid());
drop policy if exists "Click visible to clicker, advertiser, admin" on public.ad_clicks;
create policy "Click visible to clicker, advertiser, admin" on public.ad_clicks for select to authenticated
  using (user_id = auth.uid() or public.has_role(auth.uid(),'admin')
         or exists (select 1 from public.advertisements a where a.id = ad_id and a.advertiser_id = auth.uid()));

create table if not exists public.tier_credits (
  user_id uuid primary key references auth.users(id) on delete cascade,
  balance_cents int not null default 0 check (balance_cents >= 0),
  updated_at timestamptz not null default now()
);
grant select on public.tier_credits to authenticated;
grant all on public.tier_credits to service_role;
alter table public.tier_credits enable row level security;
drop policy if exists "User reads own credits" on public.tier_credits;
create policy "User reads own credits" on public.tier_credits for select to authenticated
  using (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));

create table if not exists public.tier_credit_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  delta_cents int not null,
  source text not null,
  ref_id text,
  created_at timestamptz not null default now()
);
grant select on public.tier_credit_ledger to authenticated;
grant all on public.tier_credit_ledger to service_role;
alter table public.tier_credit_ledger enable row level security;
drop policy if exists "User reads own ledger" on public.tier_credit_ledger;
create policy "User reads own ledger" on public.tier_credit_ledger for select to authenticated
  using (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));

-- SECURITY DEFINER: credit a completed ad view, enforce fraud rules + budget cap.
create or replace function public.credit_ad_view(
  p_ad_id uuid, p_user_id uuid, p_watched int,
  p_fingerprint text, p_user_agent text, p_ip text
) returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_ad public.advertisements%rowtype;
  v_reward int;
  v_advertiser_cost int;
  v_balance int;
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

  insert into public.tier_credits (user_id, balance_cents)
  values (p_user_id, v_reward)
  on conflict (user_id) do update
    set balance_cents = public.tier_credits.balance_cents + excluded.balance_cents,
        updated_at = now()
  returning balance_cents into v_balance;

  insert into public.tier_credit_ledger (user_id, delta_cents, source, ref_id)
  values (p_user_id, v_reward, 'ad_view', p_ad_id::text);

  return jsonb_build_object('balance_cents', v_balance, 'reward_cents', v_reward);
end; $$;
revoke all on function public.credit_ad_view(uuid, uuid, int, text, text, text) from public, anon, authenticated;
grant execute on function public.credit_ad_view(uuid, uuid, int, text, text, text) to service_role;

-- SECURITY DEFINER: spend tier credits to unlock a referral subscription.
create or replace function public.unlock_tier_from_credits(p_tier text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_price int;
  v_plan_id uuid;
  v_balance int;
  v_existing uuid;
begin
  if v_uid is null then raise exception 'Not authenticated'; end if;

  select id, coalesce(price_cents, round(price * 100)::int)
    into v_plan_id, v_price
  from public.referral_plans
  where tier = lower(p_tier)::public.referral_tier and active
  limit 1;
  if v_plan_id is null or v_price is null then raise exception 'Plan not found'; end if;

  select id into v_existing from public.referral_subscriptions where user_id = v_uid;
  if v_existing is not null then raise exception 'Already subscribed'; end if;

  select balance_cents into v_balance from public.tier_credits where user_id = v_uid for update;
  if v_balance is null or v_balance < v_price then raise exception 'Insufficient tier credits'; end if;

  update public.tier_credits set balance_cents = balance_cents - v_price, updated_at = now() where user_id = v_uid;
  insert into public.referral_subscriptions (user_id, plan_id) values (v_uid, v_plan_id);
  insert into public.tier_credit_ledger (user_id, delta_cents, source, ref_id)
  values (v_uid, -v_price, 'tier_unlock', v_plan_id::text);

  return jsonb_build_object('tier', p_tier, 'balance_cents', v_balance - v_price);
end; $$;
revoke all on function public.unlock_tier_from_credits(text) from public, anon;
grant execute on function public.unlock_tier_from_credits(text) to authenticated;

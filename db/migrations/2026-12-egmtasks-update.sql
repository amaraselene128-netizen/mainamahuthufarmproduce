-- Run this in the Supabase SQL editor.
-- 1) Bring market_campaigns up to date (adds the columns admin_notes/updated_at
--    + the new on-site / external promotion fields that the front-end now sends).

alter table public.market_campaigns
  add column if not exists admin_notes text,
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists promotion_type text not null default 'external'
    check (promotion_type in ('on_site','external')),
  add column if not exists video_file_url text,
  add column if not exists duration_seconds int
    check (duration_seconds is null or duration_seconds in (15,30,45,60));

-- Make sure PostgREST reloads the schema cache.
notify pgrst, 'reload schema';

-- 2) Re-price referral plans and set commission to 10% across the board.
update public.referral_plans set price = 2,    commission_rate = 0.10,
  features = '["10% commission","Unique referral link","Basic analytics"]'::jsonb
  where tier = 'bronze';
update public.referral_plans set price = 500,  commission_rate = 0.10,
  features = '["10% commission","Advanced analytics","Priority support"]'::jsonb
  where tier = 'silver';
update public.referral_plans set price = 1000, commission_rate = 0.10,
  features = '["10% commission","Premium dashboard","Dedicated manager","Custom branding"]'::jsonb
  where tier = 'gold';

-- 3) Rebrand the platform settings row.
update public.settings
  set value = jsonb_set(value, '{support_email}', '"support@egmtasks.com"')
  where key = 'platform';
-- 2027-05: Re-ensure workers can read approved market campaigns
-- (idempotent — safe to re-run). Required so approved campaigns show up under
-- /dashboard/earn and /dashboard/worker for non-owner workers.

drop policy if exists "Workers read approved campaigns" on public.market_campaigns;
create policy "Workers read approved campaigns" on public.market_campaigns
  for select to authenticated using (status = 'approved');

-- Also let anonymous visitors see approved campaigns on public listings if needed.
drop policy if exists "Anyone reads approved campaigns" on public.market_campaigns;
create policy "Anyone reads approved campaigns" on public.market_campaigns
  for select to anon using (status = 'approved');

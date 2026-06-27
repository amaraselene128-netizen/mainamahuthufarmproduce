# EGRATASKS — Full Platform Overhaul Plan

This is a large, multi-area change. Below is the scoped plan I'd execute. Please confirm or trim before I build.

## 1. Admin moderation (tasks, ads, campaigns)
- Fix admin pages to actually query: submissions, applications, ads, campaigns, market submissions — currently many fetches/RLS are mismatched.
- Admin can **edit, delete, hide, pause, approve, reject, respond** on every task / ad / campaign / submission.
- Add `admin_notes` + `hidden` flag to `tasks`, `advertisements`, `market_submissions` where missing.
- Tasks become **tier-locked**: client uploads without tier → status `pending_review` → admin assigns `required_tier` on approval → only users at/above that tier see it on the Tasks page.

## 2. Tier pricing (everywhere)
- Bronze **$5**, Silver **$100**, Gold **$1000**.
- Update `TIER_PRICE_CENTS` in `src/lib/ads.ts`, the `referral_plans` table, `unlock_tier_from_credits` RPC, and any displayed copy.
- Two upgrade paths everywhere a tier is shown:
  1. **Pay with PayPal** → checkout
  2. **Earn via Ads** → starts a tier campaign

## 3. PayPal direct upgrade
- Add `paypal-create-order` and `paypal-capture-order` edge functions.
- Requires secrets: `PAYPAL_CLIENT_ID`, `PAYPAL_SECRET`, `PAYPAL_MODE` (`sandbox`/`live`). I'll request these.
- On capture: insert subscription row, mark tier active, record `transactions` row.

## 4. Ads = tasks (unified)
- Surface active ad views inside the main **Tasks** page under a "Watch & Earn" category, in addition to the existing Earn (Ads) page.
- One renderer; the Tasks list pulls from `advertisements` where `status='active'`.
- **Video itself is clickable** to count as a view (in addition to the existing "I watched" button). Both call the same `credit_ad_view` RPC.
- On ad upload, **auto-detect video duration** via `loadedmetadata` and pre-fill `duration_seconds` (rounded to nearest allowed bucket 15/30/45/60).

## 5. Tier-upgrade-via-ads campaign
- New table `tier_campaigns(user_id, target_tier, target_cents, progress_cents, status, started_at)`.
- User clicks "Earn this tier via ads" → row inserted, target = tier price.
- Every completed ad view credits `progress_cents` (uses existing reward logic but routed to the campaign instead of the wallet while active).
- Dashboard banner appears while a campaign is active: encouraging copy + **progress bar** + remaining amount.
- When progress ≥ target → auto-unlock tier, close campaign, toast.

## 6. Social/evidence tasks
- Extend `task_submissions` with: `evidence_urls text[]`, `evidence_type` (`screenshot|recording|handle|other`), `handle_or_username`, `action_date`, `notes`.
- New task category set: YouTube subscribe, FB follow/like/share/comment, App install/open/review, etc.
- Worker submission form requires at least one piece of evidence; admin reviews manually and approves/rejects → wallet credit on approve.

## 7. Referral program (3 generations + bonus)
- Tables: extend `profiles.referred_by uuid`, add `referrals(referrer_id, referred_id, generation, created_at)`.
- On a referred user's tier purchase (PayPal or ads-earned):
  - Gen 1 referrer: **30%** of tier price
  - Gen 2 referrer: **5%**
  - Gen 3 referrer: **5%**
- On each referred user's **first withdrawal**: **1% bonus** to each of the 3 upline referrers.
- Implemented as a `pay_referral_commissions(referred_user, tier_price_cents)` SQL function + trigger; idempotent (won't double-pay on retries).
- Referral hierarchy never expires; commissions are unlimited going forward.

## 8. General hardening
- Audit every dashboard widget and admin row: ensure they fetch and render real data (no empty stubs).
- Every button → wired to an action; every link → routed.
- Make MarketWithUs category tiles on the home page clickable → route to the matching submission form.

## Technical details (for the technical reader)
- **DB migration** adds: `tasks.required_tier`, `tasks.hidden`, `advertisements.hidden`, `market_submissions.hidden/admin_notes`, `task_submissions` evidence columns, `tier_campaigns`, `referrals`, updates `referral_plans.price_cents`, rewrites `unlock_tier_from_credits` and adds `pay_referral_commissions`, `start_tier_campaign`, `credit_tier_campaign` RPCs. GRANTs + RLS for each new table.
- **Edge functions**: `paypal-create-order`, `paypal-capture-order`, `admin-ads` (edit/hide/delete), `admin-campaigns` (edit/hide/delete).
- **Frontend**: new `PayPalCheckout.tsx`, `TierCampaignBanner.tsx`, evidence-upload UI in submission form, ad auto-duration on `AdvertiserCampaign.tsx`, clickable-video in `AdPlayer.tsx`, unified ads listing inside `Tasks` page, MarketWithUs tile links.

## Required from you
1. Confirm PayPal as the only direct-payment provider (vs. enabling Lovable's built-in Stripe/Paddle, which would also handle tax/compliance for you).
2. Provide **PayPal REST API Client ID + Secret** (sandbox first; live later) when I request them.
3. Confirm referral split: 30% / 5% / 5% across 3 generations + 1% first-withdrawal bonus — your message said "30% from B, 5% from C and D" which I'm reading as 30/5/5. Correct?
4. For ads-earned tier upgrades: while a tier campaign is active, ad rewards go **only** to the campaign (not the wallet). OK?

Reply "go" (with any tweaks) and I'll ship it in stages: DB+admin fixes first, then PayPal+tiers, then ads-as-tasks + campaign banner, then referrals, then evidence tasks.
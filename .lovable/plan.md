
## Goal

Implement the EGRATASKS rewarded ads program end-to-end:

1. Advertisers upload video campaigns (Cloudinary).
2. Users watch full videos (countdown only, no skip / no scrubber) to earn **Tier Credits** (non-withdrawable) that unlock Bronze/Silver/Gold referral tiers.
3. Post-watch CTA opens the destination (Play Store / App Store / URL).
4. Strict fraud rules (tab-active, one reward per ad per user, full watch only).
5. Fix mobile layout overlap on the existing site.

PayPal direct-pay path for tiers is out of scope for this turn (link is "already working" per request) — only the **ads earning path** is built. The referral link generation already exists in `Referrals.tsx`.

---

## 1. Database (migration)

New tables (with grants + RLS per project rules):

```text
advertisements
  id, advertiser_id (auth.users), title, description,
  video_url, video_public_id, destination_url, button_text,
  duration_seconds (15|30|45|60), country_targeting text[],
  budget_cents, spent_cents, views_purchased, views_completed,
  status ('pending'|'approved'|'active'|'paused'|'rejected'|'depleted'),
  created_at, approved_at, admin_notes

ad_views
  id, ad_id, user_id, watched_seconds, completed bool,
  reward_cents, ip, user_agent, fingerprint, created_at
  UNIQUE(ad_id, user_id) WHERE completed = true   -- one reward per ad per user

ad_clicks
  id, ad_id, user_id, clicked_at, destination_url

tier_credits           -- non-withdrawable ad-earned balance
  user_id PK, balance_cents int default 0, updated_at

tier_credit_ledger     -- audit trail
  id, user_id, delta_cents, source ('ad_view'|'tier_unlock'),
  ref_id (ad_view id or subscription id), created_at
```

RLS:
- `advertisements`: advertiser sees own; everyone authenticated can SELECT active rows; admin via `has_role` can update status.
- `ad_views` / `ad_clicks`: user can insert own; user can read own; admin reads all.
- `tier_credits` / `tier_credit_ledger`: read own only; writes via SECURITY DEFINER functions.

SECURITY DEFINER RPCs:
- `credit_ad_view(p_ad_id uuid, p_watched int, p_fingerprint text)` → validates duration ≥ ad duration, no prior completed view, ad active + budget left; inserts `ad_views`, increments `tier_credits.balance_cents` by reward (15s→1, 30s→2, 45s→3, 60s→4), inserts ledger row, decrements `advertisements.spent_cents`/increments `views_completed`, sets status='depleted' when spent ≥ budget. Returns new balance.
- `unlock_tier_from_credits(p_tier text)` → checks `tier_credits.balance_cents >= price`, debits, inserts a `referral_subscriptions` row for the matching tier plan, ledger row. Returns subscription.

## 2. Edge function: `request-credit-ad-view`

Server-side validation layer (Deno, mcp-lite/Hono not needed — plain `Deno.serve` with `corsHeaders` from `npm:@supabase/supabase-js@2/cors`).
- Validates JWT manually (verify_jwt=false), Zod-validates body `{ ad_id, watched_seconds, fingerprint }`.
- Pulls ad row with service role, confirms `watched_seconds >= duration_seconds`, calls `credit_ad_view` RPC, returns `{ balance_cents, reward_cents }`.
- Why edge function: keeps fraud thresholds + fingerprint logging server-side; client cannot self-credit.

## 3. Frontend — viewer

New page `src/pages/EarnAds.tsx` (route `/dashboard/earn`):
- Lists available ads (filtered by country + budget remaining + not already completed by user).
- Tier-credit balance card + progress bar toward selected tier (Bronze/Silver/Gold).

New component `src/components/ads/AdPlayer.tsx`:
- `<video>` with `controls={false}`, `disablePictureInPicture`, `controlsList="nodownload noplaybackrate"`, no seekbar, autoplay+muted-fallback, ref.
- Overlay shows **countdown only** (e.g. `28s`), no progress, no skip.
- `onTimeUpdate` recomputes remaining; **`seeking` listener resets `currentTime` to last known max** to block scrubbing.
- `visibilitychange` + `blur` → pause + flag invalidates reward.
- On `ended`: call edge function with `watched_seconds = duration` + fingerprint (canvas+UA hash). On success: toast reward, show CTA.

New component `src/components/ads/AdCTA.tsx`:
- Modal with `button_text` → `window.open(destination_url, '_blank')`, logs `ad_clicks`, plus "Close" button.

New page `src/pages/TierUnlock.tsx` (route `/dashboard/earn/unlock`) to spend credits on Bronze/Silver/Gold (calls `unlock_tier_from_credits`). Hook into existing `Referrals.tsx` so the unlocked subscription shows the link immediately.

## 4. Frontend — advertiser

New page `src/pages/AdvertiserCampaign.tsx` (route `/dashboard/advertise`):
- Form: title, description, video upload via existing `uploadToCloudinary` (resource_type video), destination_url, button_text (select), duration (15/30/45/60), countries (multi), budget USD.
- Inserts `advertisements` row with `status='pending'`, `spent_cents=0`, `views_purchased = floor(budget / advertiser_cost)`.

Advertiser dashboard `src/pages/AdvertiserDashboard.tsx` (route `/dashboard/advertise/campaigns`):
- Views Purchased / Completed / Budget Remaining / Completion Rate / Avg Watch Time / CTR / Status per campaign (aggregates from `ad_views` + `ad_clicks`).

## 5. Admin

New page `src/pages/AdminAds.tsx` (route `/admin/ads`):
- Pending queue → Approve/Reject; Approve sets `status='active'`.
- List active + paused with quick pause/resume + spent/budget bars.
- Link added to `AdminLayout.tsx` sidebar.

## 6. Navigation

- Dashboard sidebar (DashLayout): add **Earn (Ads)**, **Advertise** entries.
- Admin sidebar: add **Ads**.
- `Home.tsx` adds a small "Earn by watching ads" CTA in the rewards strip.

## 7. Mobile overlap fix

Audit and fix on `Header.tsx`, `DashLayout.tsx`, dashboard pages:
- Header: replace fixed grid with flex + `flex-wrap` on `< md`; collapse nav into existing hamburger; ensure `pt-16` body offset.
- `DashLayout`: switch desktop sidebar `lg:grid-cols-[240px_1fr]` and add `overflow-x-hidden` + `min-w-0` on main column; mobile uses drawer (Sheet) — fix double-stack causing overlap.
- Home/MarketWithUs hero: `min-h-[100svh]`, `px-4 sm:px-6`, replace `absolute` decorations that overflow with `pointer-events-none overflow-hidden` wrapper.
- Tables: wrap in `overflow-x-auto` where missing.

## 8. Technical details

- Reward table constant in `src/lib/ads.ts`:
  ```ts
  export const AD_DURATIONS = [15,30,45,60] as const;
  export const REWARD_CENTS = {15:1,30:2,45:3,60:4} as const;
  export const ADVERTISER_CENTS = {15:5,30:6,45:7,60:8} as const;
  export const TIER_PRICE_CENTS = { bronze:500, silver:1000, gold:1500 } as const;
  ```
- Fingerprint: lightweight hash of `navigator.userAgent + screen + canvas` — no third-party lib.
- Anti-skip strategy lives both client-side (UX) **and** server-side (RPC rejects partial watches, unique-completed-per-user index).
- Cloudinary: re-use `uploadToCloudinary` with `folder: "egratasks/ads"` and pass through `resource_type: "video"` (already handled in helper).
- No new secrets needed (Cloudinary preset already configured, Supabase already connected, no PayPal in this turn).

## Out of scope this turn

- PayPal direct purchase of tiers (you said link path is already working).
- VPN/bot detection beyond fingerprint + tab-active + unique constraint (can layer later).
- Country targeting enforcement uses simple `country_code` match from profile; no geo-IP lookup.

## Files

New: `src/pages/EarnAds.tsx`, `TierUnlock.tsx`, `AdvertiserCampaign.tsx`, `AdvertiserDashboard.tsx`, `AdminAds.tsx`; `src/components/ads/AdPlayer.tsx`, `AdCTA.tsx`; `src/lib/ads.ts`; `src/lib/fingerprint.ts`; `supabase/functions/request-credit-ad-view/index.ts`.

Edited: `src/App.tsx` (routes), `src/components/dashboard/DashLayout.tsx` (nav + mobile), `src/pages/AdminLayout.tsx` (nav), `src/components/site/Header.tsx` (mobile), `src/pages/Home.tsx` (entry CTA + mobile), `src/pages/Referrals.tsx` (link to ads-unlock), `db/schema.sql` (appended migration).

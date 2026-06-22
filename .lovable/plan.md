## Goal

Make EGRATASKS feel "logged-in aware" across the entire site, expand the task category catalog to your full list, add Cloudinary uploads for avatars + task submissions, and make sure the admin pages and referral program actually fetch and work.

The home page layout stays as it is — only the header CTAs change based on auth state, and new pages are added for the expanded categories.

---

## 1. Auth-aware navigation (whole site, not just dashboard)

- Update `src/components/site/Header.tsx` to use `useAuth()`:
  - When **logged out** → show "Login" + "Get Started" (current behavior).
  - When **logged in** → hide Login/Register/Get Started. Show: avatar + username, "Dashboard" link, "Admin" link if `isAdmin`, and a "Sign out" button.
- Same logic for the mobile menu drawer (everything stays inside the hamburger — no stretched buttons).
- Hero section in `src/pages/Home.tsx`:
  - When logged in, replace the "Get Started / Login / Register" cluster with a single "Go to dashboard" CTA + "Browse tasks" secondary.
- Add a public "Categories" page and "Market With Us" page (linked from header + footer) so logged-in users can keep exploring.

## 2. Full freelance category catalog

- Create `src/data/categories.ts` exporting the full grouped list you provided (Programming & Tech → Data Verification, organized by the emoji-headed groups).
- Create `src/data/market-categories.ts` for the "Market With Us" catalog (Social Media Promotion → Other Digital Services).
- `src/pages/NewTask.tsx` (admin/client task creator):
  - Replace the flat DB-fetched `category_id` dropdown with a **grouped select** (optgroup per group) sourced from `categories.ts`. Store the chosen string in `tasks.category_id` (kept as text/free-form) — we will not migrate DB on your behalf.
- Create a new public page `/categories` listing all groups + sub-categories.
- Create a new public page `/market-with-us` listing the market promotion catalog with the submission form fields you described (campaign category, title, description, URLs, budget, dates, contact, etc.). For now the form posts to a `market_campaigns` table (SQL provided below) — if you don't run the SQL, the page still renders the catalog read-only.

## 3. Cloudinary upload integration

Credentials go in `.env`:

```
VITE_CLOUDINARY_CLOUD_NAME=dpboreqsc
VITE_CLOUDINARY_UPLOAD_PRESET=egrotasks
```

(API Key/Secret are **not** needed for unsigned uploads from the browser and must not be exposed — we use the unsigned preset only.)

- Add `src/lib/cloudinary.ts` with a single `uploadToCloudinary(file)` helper that POSTs to `https://api.cloudinary.com/v1_1/dpboreqsc/image/upload` using the `egrotasks` preset and returns `{ secure_url, public_id }`.
- Wire it into:
  - `src/pages/ProfilePage.tsx` → avatar upload (writes URL to `profiles.avatar_url`).
  - `src/pages/NewTask.tsx` → optional task cover image / attachments (stored on the task row in a new `attachments jsonb` column — see SQL below).
  - Task submission flow (worker submitting proof screenshots) → array of Cloudinary URLs stored on `task_applications.proof_urls`.

## 4. Admin pages — make fetching work

- Audit each admin page and ensure it uses the right query / edge function:
  - `Users.tsx`, `Tasks.tsx`, `Withdrawals.tsx`, `Countries.tsx`, `Refs.tsx`, `Fraud.tsx`, `AdminSupport.tsx`.
- For pages that currently rely only on RLS and may return empty arrays for admins, switch them to call their corresponding `admin-*` edge function (already in `supabase/functions/`) for the privileged listing. Add minimal listing endpoints where missing (e.g. `admin-users` list).
- Make `AdminOverview.tsx` show real counts (users, active tasks, pending withdrawals, open tickets) by calling `count: "exact", head: true` queries.

## 5. Referral program structure

- `Referrals.tsx` rewrite:
  - Show the user's permanent referral code (a short slug, not the raw UUID) — generated on first visit and stored on `profiles.referral_code`.
  - Link format: `${origin}/auth/register?ref=<code>`.
  - Plans section unchanged but properly fetched; subscription button disabled if no wallet balance (for paid tiers).
  - Stats cards: clicks, signups, verified, earnings — already in code, but switch the `referral_clicks` query to use `code = profile.referral_code` instead of `user.id`.
  - Add a referred-users table view (username, country, status, your earnings) sourced from `referrals` joined with `profiles`.
- `Register.tsx`: when `?ref=<code>` is present, look up the referrer, store `referred_by` on the new profile, and insert a row in `referrals`.

## 6. SQL you need to run

Provided as one block at the end of the response. It will:

- Add `profiles.referral_code text unique` + backfill + trigger.
- Add `profiles.referred_by uuid references profiles(id)`.
- Add `tasks.attachments jsonb default '[]'::jsonb` and `tasks.category_group text`.
- Add `task_applications.proof_urls text[] default '{}'`.
- Create `public.market_campaigns` table with proper grants + RLS + status enum.
- Indexes on `referrals.referrer_id`, `referral_clicks.code`, `market_campaigns.user_id`.

---

## Technical notes

- All new pages get a `<Header />` + `<Footer />` so logged-in users can navigate them.
- No backend code outside Supabase — Cloudinary is browser-only via unsigned preset.
- Hero/home content stays visually identical except for the auth CTA swap.
- The category catalog lives in TS files (not the DB) so you can edit them without migrations.

---

## Out of scope (tell me if you want them next)

- Migrating existing `tasks.category_id` foreign keys to the new grouped catalog.
- Building campaign analytics dashboards (views/clicks/conversions per campaign).
- A separate worker "Market" feed for paid social-engagement tasks.

Approve and I will implement all six sections in one pass and hand you the SQL.
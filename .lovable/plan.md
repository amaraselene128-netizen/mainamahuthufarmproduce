
Big request — 10 distinct changes. Grouping work to minimize risk of regression while keeping each area independent.

## 1. Referrals page → PayPal checkout (mirror `TierUnlock`)
Rewrite `src/pages/Referrals.tsx` plan-cards section: replace the "Pay with PayPal · Coming soon" disabled button with the same `paypal-create-order` → redirect → `paypal-capture-order` flow used in `TierUnlock.tsx` (search-params handling, `paypal_pending_order` session bridge). Keep the rest of the page (link, stats, table) intact.

## 2. Ads / campaigns / advertisements in Available Jobs (for everyone)
- `AvailableTasks.tsx` already merges `tasks` + `advertisements` + `market_campaigns`. Issue: campaigns filtered out when missing `video_file_url || video_url` (embed-only ads excluded) and advertisements filtered by `status="active"` (but new ones are saved as `pending` until admin approves). Verify against actual schema:
  - Remove the video-url filter for campaigns (link/embed ads are valid).
  - Also include `advertisements` with `ad_type=embed` and `embed_url`.
- Add RLS migration so any authenticated user can SELECT approved `market_campaigns` and active `advertisements` (current 2027-05 migration only covers campaigns).

## 3. Earnings page — include referral earnings
Locate the earnings/wallet aggregation (likely `WalletPage.tsx`); add a `referral_earnings` line item alongside task and ad earnings. Sum `amount_cents` / `amount` and surface in totals + recent-activity list.

## 4. Prevent duplicate task application
- Frontend: in `AvailableTasks.apply()` catch unique-violation (`23505`) and show "You already applied" toast.
- Backend `apply_to_task` RPC: wrap insert in `ON CONFLICT DO NOTHING` and return `already_applied` status. Migration file added.
- Hide Apply button for tasks already in `task_applications` for the user — fetch a `Set` of applied task ids on load.

## 5. Cloudinary for submission files + admin instant-download
- Worker submit page: upload attachments via `uploadToCloudinary` (already used for ads) into folder `egratasks/submissions/<task_id>`. Store `secure_url` in `task_submissions.attachments`.
- Admin `ReviewTask.tsx`: render attachments as `<a href={url} download>` so clicks download directly (same as worker side).

## 6. Worker — one submission per task (warning)
- Add unique constraint `(task_id, worker_id)` on `task_submissions` if not present.
- Frontend submit handler: check existing submission first; if present, show "You have already submitted. Multiple submissions may flag your account." and disable the form.
- Backend safety: `ON CONFLICT DO NOTHING`.

## 7. Suspended / banned users blocked at login
- `profiles` already has `suspended` / `banned` columns.
- Sign-in flow (`Login.tsx` + `auth-context`): after `signInWithPassword`, fetch profile; if `suspended || banned`, call `supabase.auth.signOut()` and show a blocking screen with appeal CTA.
- Also gate `auth-context` session restoration so a previously-issued JWT for a banned user is immediately signed out on app boot.

## 8. Appeal program (public)
- New table `account_appeals (id, email, reason, status, admin_notes, created_at)` + RLS allowing public INSERT, admin SELECT/UPDATE.
- New page `src/pages/Appeal.tsx` at `/appeal` — public form (email + description + signed declaration).
- Add a clearly visible "Account suspended? Appeal here" link in Home hero + Footer.
- Admin: new `src/pages/AdminAppeals.tsx` with approve / reject (approve unsets `suspended`/`banned` on the matching profile via edge function using service-role).

## 9. Admin direct messages / notifications
- New table `admin_messages (id, recipient_id, subject, body, read_at, created_at)` with RLS: recipient SELECT/UPDATE own; admin INSERT.
- Edge function `admin-notify` (verify_jwt + admin check) to push a notification row.
- New admin page `src/pages/AdminNotify.tsx`: pick user (or broadcast), subject, body → send.
- User side: surface in existing `Notifs.tsx` page (merge with whatever it currently shows).

## 10. Keep existing functionality untouched
All edits are additive or scoped to specific symbols. No refactors of unrelated components, no design-system changes.

## Files

**New**
- `db/migrations/2027-07-jobs-feed-dedupe-appeals-dms.sql`
- `supabase/functions/admin-notify/index.ts`
- `supabase/functions/admin-appeal-decision/index.ts`
- `src/pages/Appeal.tsx`
- `src/pages/AdminAppeals.tsx`
- `src/pages/AdminNotify.tsx`

**Edited**
- `src/pages/Referrals.tsx` (PayPal flow)
- `src/pages/AvailableTasks.tsx` (broaden feed, dedupe applied)
- `src/pages/WalletPage.tsx` (referral earnings)
- `src/pages/TaskDetail.tsx` (submission dedupe, Cloudinary upload)
- `src/pages/ReviewTask.tsx` (download attribute)
- `src/lib/auth-context.tsx` + `src/pages/Login.tsx` (suspension gate)
- `src/pages/Home.tsx` + `src/components/site/Footer.tsx` (appeal CTA)
- `src/App.tsx` (new routes)
- `src/pages/AdminLayout.tsx` (nav items for Appeals + Notify)
- `src/pages/Notifs.tsx` (merge admin messages)
- `supabase/config.toml` (register new functions)

## Notes
- All RPC / RLS changes go in one migration file the user runs in Supabase SQL editor.
- PayPal flow reuses existing `paypal-create-order` (already supports `tier` param matching referral_plans tiers).
- No design tokens or hero/footer styling changed — only adding a single CTA link.

Approve and I'll implement.

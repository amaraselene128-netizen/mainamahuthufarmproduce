# Fix admin panel + add moderation, messaging, and tier-aware flows

This is a large multi-area change. I'll tackle it in one migration + targeted code edits. Confirm before I ship.

## 1. Admin Submissions queue — "task_submissions ↔ profiles" relationship error
Root cause: the query joins `task_submissions` to `profiles` via an implicit FK, but no FK exists on `task_submissions.user_id → profiles.id` in the live schema (only to `auth.users`).
Fix: add an explicit FK `task_submissions.user_id REFERENCES public.profiles(id)` (and same for `task_id → tasks.id` if missing) so PostgREST can embed `profiles(...)`. Refresh schema cache via `NOTIFY pgrst, 'reload schema'`.

## 2. Admin Suspend / Ban → "Edge Function returned non-2xx"
The `admin-users` function only updates `profiles.suspended`/`banned`. Likely failure: those columns don't exist on the live `profiles` table, or the JWT verify path fails because `verify_jwt = true` is set but signing-keys mode is on.
Fix:
- Add `suspended boolean default false`, `banned boolean default false` to `profiles` if missing.
- Switch `admin-users` to in-code JWT validation (`verify_jwt = false` in `config.toml`) — matches platform default and our other functions in this project.
- Return clearer error JSON so the toast shows the real reason.

## 3. Client task / campaign / ad upload error
Likely the insert violates RLS or hits a missing column after recent schema additions (`required_tier`, `hidden`, `status='pending_review'`). I'll:
- Make these columns nullable with safe defaults.
- Set `status='pending_review'` on client-side insert (instead of `active`) and write an RLS policy `INSERT WITH CHECK (auth.uid() = posted_by)`.
- Same pattern for `advertisements`.

## 4. Admin Support cannot see tickets
`AdminSupport.tsx` queries `support_tickets` with `profiles(username,email)` — same missing-FK problem as #1. Add FK `support_tickets.user_id → profiles.id` and matching FK on `support_messages.sender_id`. Also widen the admin RLS SELECT policy on both tables to `has_role(auth.uid(),'admin')`.

## 5. Admin → Users: Direct message / broadcast
- New page section in `AdminUsers` with two buttons per row: "Message" (opens dialog), "Broadcast" at the top (sends to all).
- New edge function `admin-notify` (service-role) inserts rows into existing `messages` table (worker/client dashboard already reads it). Broadcast loops over `profiles.id`.
- Notification toast on the user side via existing realtime subscription (no changes needed if already wired; otherwise add).

## 6. Tier-locked task / ad / campaign moderation flow
- New status values: `pending_review | approved | rejected | active` on `tasks`, `advertisements`.
- Worker-facing list filters: `WHERE status='approved' AND (required_tier IS NULL OR user_tier >= required_tier)`.
- Admin can edit `required_tier`, approve, reject, hide. Already partly in plan.md — I'll wire it through.

## 7. Worker application gating
- `task_applications.status` defaults to `pending`.
- In `TaskDetail.tsx`: hide/disable Submit and download buttons unless `status='approved'`. Show "Awaiting admin approval" badge. If `rejected`, show locked state with reason.
- Admin gets an Approve/Reject action per application under Admin → Tasks → [task].

## 8. Admin task detail = full visibility
New page `AdminTaskDetail.tsx` (or extend existing `AdminTaskReview`): shows all task fields, instructions, attached files (renders Cloudinary URLs), client profile card with username/email/country, "Message client" button (reuses #5), list of applications + submissions with approve/reject.

## 9. Grant admin privilege from Users page
Add "Make admin" / "Revoke admin" button. Extends `admin-users` with `action: 'set_admin'` → inserts/deletes from `user_roles` (role=`admin`). Visible only to current admins.

## 10. Earn (Ads) — hide tier-payment panel when tier active
In `EarnAds.tsx`: read `profiles.current_tier`. If non-null and not expired, render the standard "Earn to wallet" view only and hide the "Earn this tier via ads" upsell. Banner title swaps from "Watch ads to unlock your tier" → "Watch ads — earnings go to your wallet".

## 11. Withdrawals — anytime requests with strict notice
- Remove the window-based block in `WalletPage.tsx` / `withdrawal-window.ts` for submission. Keep `withdrawal-window.ts` for display only.
- Always show a prominent red-bordered notice: "You can submit a withdrawal request anytime. Requests made outside our processing window (X–Y, day Z) may be rejected or delayed."
- Edge function still records the request normally.

## Technical details (for the technical reader)
- Single migration `db/migrations/2027-02-admin-and-moderation.sql`:
  - Add FKs: `task_submissions.user_id`, `task_submissions.task_id`, `support_tickets.user_id`, `support_messages.sender_id` → respective targets.
  - Add columns if missing: `profiles.suspended`, `profiles.banned`, `tasks.required_tier`, `tasks.status`, `tasks.hidden`, `advertisements.status`, `advertisements.hidden`, `task_applications.status`, `task_applications.admin_notes`.
  - GRANTs preserved per project convention.
  - Admin RLS policies via existing `has_role()` for: tasks, advertisements, task_submissions, task_applications, support_tickets, support_messages, messages.
  - `NOTIFY pgrst, 'reload schema'` at end.
- Edge functions:
  - `admin-notify` (new) — broadcast/direct message insert into `messages`.
  - `admin-users` — add `set_admin` action; switch to in-code JWT validation; better error JSON.
  - `supabase/config.toml` — drop `verify_jwt = true` for `admin-users`.
- Frontend:
  - `src/pages/AdminSupport.tsx` — also fetch `support_messages.sender_id → profiles` via the new FK; no other changes after FK lands.
  - `src/pages/Users.tsx` (admin) — add Message dialog, Broadcast button, Make/Revoke admin button.
  - `src/pages/AdminTaskReview.tsx` — full task detail + client card + attachments + applications/submissions table with approve/reject.
  - `src/pages/TaskDetail.tsx` (worker) — gate Submit/Download on `application.status === 'approved'`.
  - `src/pages/NewTask.tsx` and `src/pages/AdvertiserCampaign.tsx` — insert with `status='pending_review'`; show "Submitted for review" confirmation.
  - `src/pages/EarnAds.tsx` — branch UI on active tier.
  - `src/pages/WalletPage.tsx` — remove submit-time block, keep notice.

## Required from you
Reply **"go"** to ship all 11 items in one batch. If you'd rather slice it, tell me which numbers to do first (I'd recommend 1, 2, 3, 4 first since they're blockers, then the rest).

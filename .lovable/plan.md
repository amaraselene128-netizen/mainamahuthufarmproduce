## Goal

Tighten EGRATASKS end-to-end: admin can create tasks and review worker submissions; workers see + download task attachments; support tickets accept files; withdrawals enforce balance and the 28th→5th payout window (instant during window for tasks completed inside it); the whole site reacts to login state; navigation always scrolls to top; campaigns flow into the admin queue; and "How it works" / FAQ anchors actually scroll to those sections.

---

## 1. Scroll-to-top on every navigation

- Add `src/components/site/ScrollToTop.tsx` that listens to `useLocation()` and scrolls window to top on path change. If the URL has a hash (`#how`, `#faq`), scroll the element with `scrollIntoView({ behavior: "smooth" })` instead.
- Mount it once inside `src/App.tsx`, above `<Routes>`.
- Replace plain `<a href="/#how">` with a `<HashLink>`-style `<Link to="/#how">` everywhere; the scroller handles the scroll-into-view.

## 2. Auth-aware site (Header, Footer, MarketWithUs, Home CTAs)

- **Footer**: when `useAuth().user` is present, swap "Help center → /support" for `/dashboard/support`, hide "Referral program" only if signed out, and replace any login/register links with a single "Dashboard" link.
- **MarketWithUs**: keep the form public, but show "Submit as <username>" + a "Back to dashboard" link when logged in. Remove the trailing "sign in to track" hint when logged in.
- **Home → CTA section** (bottom of `Home.tsx`): when logged in, show "Go to dashboard" + "Browse tasks" instead of "Get Started / Login".
- Make every "Get Started / Login / Register" button across pages (`About`, `Contact`, `Categories`, `MarketWithUs`, `Privacy`, `Terms`) use the same auth-aware helper — extract `src/components/site/AuthCta.tsx`.

## 3. "How it works" + FAQ deep links

- Header nav already points to `/#how` and `/#faq`. Add IDs (`id="how"` already exists; add `id="faq"` to FAQ section). With the ScrollToTop hash handler the click will scroll correctly from any page.
- Footer + Home buttons updated to use the same anchor targets.

## 4. Admin task creation + submissions review

- New admin page `src/pages/AdminNewTask.tsx` (route `/admin/tasks/new`) that reuses the same form as `NewTask.tsx` but inserts with `hiring_id = admin user id` (still satisfies RLS via admin policy). Add "+ New task" button on `Tasks.tsx`.
- New admin page `src/pages/AdminTaskReview.tsx` (route `/admin/tasks/:id`) that mirrors `ReviewTask.tsx` (list all submissions, approve / revision / reject with comments). Existing RLS already lets admins update via `has_role`. Tasks list rows link to this page.
- After approval, the existing trigger should credit the worker wallet. Add SQL trigger `on_submission_approved` that, when `task_submissions.status` flips to `approved`, inserts a `transactions` row, bumps `wallets.available` (or instant payout — see section 6), and updates the application status. After rejection it just marks the application rejected.

## 5. Worker downloads + dashboard submission status

- `AvailableTasks.tsx` cards: show an "Attachments" chip when `tasks.attachments` is non-empty; clicking opens a modal that lists each `{ url, name }` with a Download button (anchor `download` attr pointing to Cloudinary URL).
- New `src/pages/TaskDetail.tsx` (`/dashboard/worker/:id`) so workers can see full description + downloads + an apply / submit flow in one place.
- `Applied.tsx` already shows applications — extend the row to render `admin_comment` and a colored status pill (approved / rejected / revision) so the worker sees the response.
- `Completed.tsx` / `Rejected.tsx` updated to surface the same `admin_comment` block.

## 6. Withdrawal flow

- Add `src/lib/withdrawal-window.ts` exporting `isWithdrawalOpen(now = new Date())` → true if day ≥ 28 of month, or day ≤ 5 of next month. Also `nextOpenDate()` for UI messaging.
- `WalletPage.tsx`:
  - Disable submit when amount ≤ 0, amount > available, or window is closed. Show inline reasons under the button ("Insufficient balance", "Withdrawals open Mar 28 → Apr 5").
  - On submit during open window, call new edge function `request-withdrawal` which: validates window + balance server-side, debits `wallets.available`, creates `withdrawal_requests` with `status='paid'` (instant) + `paid_at=now()`, inserts a `transactions` row. Outside the window the function rejects.
  - Show a "Window status" pill at the top of Wallet ("Open · closes Apr 5" / "Closed · opens in 12 days").
- Admin `Withdrawals.tsx` keeps approve / reject for any legacy `pending` rows but most flows now auto-pay.

## 7. Support tickets with uploads

- `db/schema.sql` adds `support_messages.attachments jsonb default '[]'` (only if missing). The migration tool will run an `alter table ... add column if not exists`.
- `Support.tsx`: new ticket form gets a file picker that uploads to Cloudinary (`uploadManyToCloudinary`) and stores the URLs on the first message + the ticket. Reply input gets an attach button too.
- `AdminSupport.tsx`: render attachments as thumbnails / download links per message and let the admin upload screenshots in replies.

## 8. Campaign approvals

- `MarketWithUs.tsx` already inserts into `market_campaigns` with `status: 'pending'`. Add new admin route `/admin/campaigns` (page `src/pages/AdminCampaigns.tsx`) listing pending → approved / rejected with notes. Add nav entry in `AdminLayout`.
- RLS already grants admins update via `has_role` (verify in SQL — add if missing).

## 9. Functional dashboard sweep

Quick pass to wire any remaining stub pages to real data:
- `Notifs.tsx`, `Messages.tsx`, `Analytics.tsx`, `Reviews.tsx`, `Referrals.tsx`, `Settings.tsx` — ensure each fetches its table (creating empty-state UI if no data) and removes any "coming soon" placeholders. No new features beyond what the tables already support.

---

## Technical notes

```text
Routes added
  /admin/tasks/new            → AdminNewTask
  /admin/tasks/:id            → AdminTaskReview
  /admin/campaigns            → AdminCampaigns
  /dashboard/worker/:id       → TaskDetail

New files
  src/components/site/ScrollToTop.tsx
  src/components/site/AuthCta.tsx
  src/lib/withdrawal-window.ts
  src/pages/AdminNewTask.tsx
  src/pages/AdminTaskReview.tsx
  src/pages/AdminCampaigns.tsx
  src/pages/TaskDetail.tsx
  supabase/functions/request-withdrawal/index.ts

Schema additions (migration tool)
  alter table support_messages add column if not exists attachments jsonb default '[]'
  alter table support_tickets  add column if not exists attachments jsonb default '[]'
  create trigger on_submission_approved → credit wallet + insert transaction
  policy: admins update market_campaigns (if missing)
```

---

## Out of scope

- Push/email notifications for ticket replies and review outcomes
- Recurring/automated payout cron on the 28th (we make it instant during window instead)
- Worker chat threads with the admin reviewer beyond the existing `admin_comment` text

Approve and I'll implement all nine sections in one pass.
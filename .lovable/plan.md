# EGMTASKS — big sweep

This is a large multi-area change. I'll ship it as one coordinated batch so nothing half-lands. Tell me to proceed (or trim any group) and I'll execute.

## 1. Admin can review submitted tasks
- Wire the "submitted" count on `AdminOverview` to `/admin/tasks/review`.
- Rebuild `AdminTaskReview` to list every `task_submissions` row (pending first) with task title, worker, files/links, and Approve / Reject / Request-changes buttons calling `admin-tasks` edge fn.

## 2. Auth gate on campaigns / tasks
- In `TaskDetail.tsx` and the campaign card click handlers (`AvailableTasks`, `EarnAds`), if `!user` → `navigate('/login?next=' + currentPath)`.
- `Login.tsx` + `Register.tsx` honor `?next=` after success.

## 3. Hero feature cards cut off (screenshot)
- `Home.tsx` hero strip: remove `overflow-hidden` / fixed height on the feature card row, add `pb-6` so the rounded bottoms aren't clipped on mobile.

## 4. Referrals page — emphasise monthly subscription
- `Referrals.tsx`: swap presentation. Monthly sub becomes the primary CTA (large gold price), one-time unlock shown as secondary line. Keep the new $50 / $500 / $5000 monthly numbers prominent.

## 5. Terms & Privacy rewrite
- Replace `Terms.tsx` and `Privacy.tsx` content with the long sample you pasted, expanded with extra clauses (fraud, AML, KYC, data retention, cookies, intl transfers, arbitration, severability, etc.) to be comprehensive.
- Insert your custom paragraphs (2-month dormant funds, no platform liability for task legality, non-withdrawable principal, client must prepay, data-leak disclaimer) in the third quarter of each doc.
- Render as long-form `StaticShell` with anchored sections.

## 6. Task upload — remove client tier selection
- `NewTask.tsx`: drop the tier picker. Admin sets `required_tier` on approval in `AdminTaskReview`.

## 7. Campaigns — add embedded-video option
- `AdvertiserCampaign.tsx`: add a tab "Embedded video" → URL field (YT/FB/IG/TikTok), title, instructions, CTA, budget. No file upload. Store `embed_url` instead of `video_url`. Player (`AdPlayer.tsx`) detects embed and renders iframe.
- DB: `alter table advertisements add column embed_url text;` migration.

## 8. Tier promotion across site
- New `/tiers` page explaining tiers, %s, and pricing prominently.
- Reusable `<TierPromoBanner/>` ("Did you know? A higher tier gives priority placement on tasks. Learn more →") shown on Home hero, dashboard Overview, AvailableTasks top, TaskDetail sidebar.
- Reusable `<TierBadge tier=.../>` (gold/silver/bronze crown chip) shown on dashboard header, profile, task application row (so admin sees it on review).

## 9. Task slot allocation 18 tier / 2 non-tier
- New columns on `tasks`: `slots_tier int default 18`, `slots_open int default 2`.
- RPC `apply_to_task(p_task)` checks applicant's active sub and decrements the matching counter atomically; rejects when bucket empty. `AvailableTasks` / `TaskDetail` call this RPC.
- Daily cap for non-tier on ads/campaigns: function `can_view_ad(uid)` → false if non-sub user has ≥20 `ad_views` today. `credit_ad_view` calls it first.

## 10. FAQ expansion
- `Home.tsx` FAQ section: expand from current ~6 to ~16 Q&As covering payouts, tiers, refunds, KYC, withdrawals, M-Pesa, PayPal, disputes, embedded ads, slots. Keep 2-column responsive grid so vertical space stays similar.

## 11. Mobile polish pass
- Audit `Home`, `AvailableTasks`, `TaskDetail`, `Referrals`, `Dashboard` at 375px: fix any overflow, ensure cards have `pb-` breathing room, sticky CTAs don't cover content, FAQ stacks single-column under `sm`.

## Out of scope / I will NOT do without your nod
- "Thousands of T&Cs clauses" → I'll write a thorough ~50-section document, not literally thousands (would be unreadable). Say "longer" and I'll keep extending.
- Touching unrelated business logic beyond items above.

## Technical notes
- New SQL migration: `db/migrations/2027-03-tiers-slots-embeds.sql` covering embed_url, slot columns, `apply_to_task`, `can_view_ad`, daily-cap index. Idempotent.
- All new RPCs `security definer` + grants to `authenticated`.
- No new third-party deps.

Reply "go" to ship all 11, or list the numbers you want first.

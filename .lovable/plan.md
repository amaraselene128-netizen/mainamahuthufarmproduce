
## Goal

Convert EGRATASKS from TanStack Start (SSR on Cloudflare Workers) to a **static Vite + React SPA** deployable to Netlify CDN. All server-side logic moves to **Supabase Edge Functions**. DB + Auth + Storage stay on Supabase.

This is a structural rewrite. I will execute it in phases and stop after each phase so you can verify before I continue.

## What changes

- No more SSR. Routes render client-side; SEO meta is set via `react-helmet-async`.
- No more `createServerFn`, no `requireSupabaseAuth` middleware, no `src/start.ts`, no `vite.config.ts` wrapped in `@lovable.dev/vite-tanstack-config`, no `src/routes/__root.tsx` shell.
- Routing switches to `react-router-dom` (industry standard for SPAs, simplest for Netlify). Each existing `src/routes/*.tsx` becomes a `src/pages/*.tsx` mounted in a central `<Routes>` table.
- A real `index.html` lives at project root.
- `public/_redirects` (`/*  /index.html  200`) + `netlify.toml` handle SPA deep links.
- All current DB calls already use the browser `db` client → those keep working. Anything privileged (admin role grants, fraud actions, etc.) moves to a Supabase Edge Function called via `supabase.functions.invoke(...)`.

## What you keep

- All existing UI components (`src/components/**`), styles, shadcn/ui, Tailwind theme.
- The full Supabase schema and RLS policies (no DB changes needed).
- Auth context, page bodies, dashboard layout, admin layout, brand assets.

## What you lose (be aware)

- **Server-rendered SEO**: Crawlers that don't execute JS (rare in 2026) won't see meta tags. `react-helmet-async` handles modern crawlers fine.
- **Per-route share preview cards** on first paint — they're client-set. Acceptable for a freelancing app.
- All `createServerFn` files I previously wrote get deleted; replacement logic lives in edge functions or direct client RLS calls.

## Phases (I will pause between each)

### Phase 1 — Scaffold the SPA shell *(this turn if you approve)*
1. `bun add react-router-dom react-helmet-async` ; remove TanStack Start packages.
2. Replace `vite.config.ts` with plain `@vitejs/plugin-react` + path aliases.
3. Create `index.html` at root with `<div id="root">` + Vite entry.
4. Create `src/main.tsx` mounting `<App />` with `<BrowserRouter>`, `<QueryClientProvider>`, `<HelmetProvider>`, `<AuthProvider>`, `<Toaster>`.
5. Create `src/App.tsx` with the central `<Routes>` table mirroring the current routes.
6. Add `public/_redirects` and `netlify.toml` (`[build] command="bun run build"  publish="dist"`).
7. Delete `src/start.ts`, `src/server.ts`, `src/router.tsx`, `src/routeTree.gen.ts`, `src/lib/error-page.ts`, `src/integrations/supabase/auth-middleware.ts`, `src/integrations/supabase/auth-attacher.ts`, `src/integrations/supabase/client.server.ts`.

### Phase 2 — Port every route file
For each file under `src/routes/`, move the component out, drop the `createFileRoute` wrapper, replace `<Link to=...>` import source from `@tanstack/react-router` → `react-router-dom`, replace `useNavigate`/`useParams` imports likewise, swap route `head()` blocks for `<Helmet>` components. Land the file under `src/pages/`. Delete `src/routes/`.

### Phase 3 — Edge functions for privileged ops *(done)*
Created four Supabase Edge Functions, all gated by JWT verification + `has_role(auth.uid(), 'admin')` using the service-role key:
- `admin-users` — suspend/ban/unsuspend/unban a profile
- `admin-withdrawals` — set status (approved / paid / rejected), stamps `approved_at` / `paid_at`
- `admin-tasks` — set status, delete
- `admin-countries` — toggle `restricted`

Shared auth/CORS in `supabase/functions/_shared/admin.ts`. All four registered in `supabase/config.toml`. Admin pages (`Users.tsx`, `Withdrawals.tsx`, `Tasks.tsx`, `Countries.tsx`) now call `db.functions.invoke(...)` instead of writing to tables directly. `Fraud.tsx` stays read-only.

### Phase 4 — Verify
Build locally (`bun run build`), preview, click through key flows: auth → register → dashboard → admin → publish task → apply. Fix anything broken. Then you upload `dist/` to Netlify (or connect the repo) and it works.

### Phase 5 — Finish missing pages
Only after the SPA migration is stable. You list the specific empty/broken pages and I fill them in. I will not bundle "complete all remaining pages" into the migration — that's how things break invisibly.

## Technical notes for the curious

- Vite build output → `dist/`. Netlify publish dir = `dist`. Build command = `bun run build`.
- `_redirects` is the canonical Netlify SPA fallback (also works on Cloudflare Pages, Render).
- Auth flow stays identical: `supabase.auth.signInWithPassword`, session persisted in `localStorage`, `onAuthStateChange` listener in `AuthProvider`.
- Edge functions deployed via `supabase functions deploy`. Lovable's Supabase integration handles deployment when I create files under `supabase/functions/<name>/index.ts`.
- Env vars needed at build time: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`. Set in Netlify dashboard under Site settings → Environment variables.

## What I need from you to start

Just approve. I'll execute Phase 1 only, you reload the preview, confirm the app still mounts, then I move to Phase 2.

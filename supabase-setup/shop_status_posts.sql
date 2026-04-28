-- =====================================================================
-- SHOP STATUS POSTS — Lets shop owners post stories AS their shop on Fun Circle.
--
-- HOW TO RUN:
--   1. Open the Supabase SQL editor for your project
--   2. Paste this entire file
--   3. Click "Run"
--
-- Safe to re-run.
-- =====================================================================

-- 1) Add shop_id column (nullable — null = personal user post)
ALTER TABLE public.fun_circle_stories
  ADD COLUMN IF NOT EXISTS shop_id uuid REFERENCES public.shops(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS fun_circle_stories_shop_id_idx
  ON public.fun_circle_stories (shop_id, created_at DESC);

-- 2) SELECT policy — friends-only for personal posts, but EVERY shop-authored
--    story is publicly visible (so non-friends still see shop announcements).
DROP POLICY IF EXISTS "Users can view stories from friends or own" ON public.fun_circle_stories;
DROP POLICY IF EXISTS "view_stories" ON public.fun_circle_stories;

CREATE POLICY "view_stories"
ON public.fun_circle_stories FOR SELECT
USING (
  shop_id IS NOT NULL                                  -- shop posts: public
  OR auth.uid() = user_id                              -- own personal post
  OR public.are_friends(auth.uid(), user_id)           -- friend's personal post
);

-- 3) INSERT policy — author themselves, OR post AS a shop they own.
DROP POLICY IF EXISTS "Users can create their own stories" ON public.fun_circle_stories;
DROP POLICY IF EXISTS "insert_stories" ON public.fun_circle_stories;

CREATE POLICY "insert_stories"
ON public.fun_circle_stories FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND (
    shop_id IS NULL
    OR EXISTS (
      SELECT 1 FROM public.shops s
      WHERE s.id = shop_id
        AND s.user_id = auth.uid()
        AND s.is_active = true
    )
  )
);

-- 4) DELETE policy — author OR owner of the shop.
DROP POLICY IF EXISTS "Users can delete their own stories" ON public.fun_circle_stories;
DROP POLICY IF EXISTS "delete_stories" ON public.fun_circle_stories;

CREATE POLICY "delete_stories"
ON public.fun_circle_stories FOR DELETE
USING (
  auth.uid() = user_id
  OR (shop_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.shops s
    WHERE s.id = shop_id AND s.user_id = auth.uid()
  ))
);

-- 5) Verify
SELECT 'shop_id column' AS check, EXISTS (
  SELECT 1 FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'fun_circle_stories'
    AND column_name = 'shop_id'
) AS ok;

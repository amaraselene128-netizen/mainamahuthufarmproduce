-- =====================================================================
-- SokoniArena — combined Supabase setup script
-- Run this ONCE in your Supabase project: SQL Editor → New Query → paste → Run.
-- It is safe to re-run (uses IF NOT EXISTS / DROP IF EXISTS / CREATE OR REPLACE).
--
-- Fixes:
--   1) Fun Circle stories showing "Unknown" as the owner.
--   2) Sets up the view_history table + RPC for cross-device "You Might Also Like".
-- =====================================================================


-- ---------------------------------------------------------------------
-- FIX 1: profiles_public view
--
-- The current view uses `security_invoker = on`, so it inherits the RLS
-- policy on `public.profiles` that only lets a user read THEIR OWN row.
-- Result: every other user's profile is invisible → stories, comments,
-- friends, etc. display "Unknown".
--
-- The view only exposes non-sensitive columns (no email, no phone), so
-- recreating it as a SECURITY DEFINER view (the default, by setting
-- security_invoker = off) is safe and is the standard Supabase pattern
-- for a curated public projection of a private table.
-- ---------------------------------------------------------------------

DROP VIEW IF EXISTS public.profiles_public;

CREATE VIEW public.profiles_public
WITH (security_invoker = off) AS
SELECT
  id,
  user_id,
  username,
  avatar_url,
  bio,
  location,
  is_verified,
  created_at,
  updated_at
FROM public.profiles;

GRANT SELECT ON public.profiles_public TO authenticated, anon;


-- ---------------------------------------------------------------------
-- FIX 2: view_history table, RLS, and record_view RPC
-- ---------------------------------------------------------------------

-- Table
CREATE TABLE IF NOT EXISTS public.view_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  listing_id uuid NOT NULL,
  listing_type text NOT NULL CHECK (listing_type IN ('product','service','event')),
  section text,
  category text,
  subcategory text,
  viewed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, listing_id)
);

CREATE INDEX IF NOT EXISTS view_history_user_viewed_idx
  ON public.view_history (user_id, viewed_at DESC);
CREATE INDEX IF NOT EXISTS view_history_user_category_idx
  ON public.view_history (user_id, category);
CREATE INDEX IF NOT EXISTS view_history_user_section_idx
  ON public.view_history (user_id, section);

-- RLS
ALTER TABLE public.view_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "view_history_select_own" ON public.view_history;
CREATE POLICY "view_history_select_own"
  ON public.view_history FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "view_history_insert_own" ON public.view_history;
CREATE POLICY "view_history_insert_own"
  ON public.view_history FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "view_history_update_own" ON public.view_history;
CREATE POLICY "view_history_update_own"
  ON public.view_history FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "view_history_delete_own" ON public.view_history;
CREATE POLICY "view_history_delete_own"
  ON public.view_history FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- record_view RPC — upsert + auto-trim to 50 most recent per user
CREATE OR REPLACE FUNCTION public.record_view(
  _listing_id uuid,
  _listing_type text,
  _section text DEFAULT NULL,
  _category text DEFAULT NULL,
  _subcategory text DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN;
  END IF;

  INSERT INTO public.view_history (
    user_id, listing_id, listing_type, section, category, subcategory, viewed_at
  )
  VALUES (
    auth.uid(), _listing_id, _listing_type, _section, _category, _subcategory, now()
  )
  ON CONFLICT (user_id, listing_id) DO UPDATE
    SET viewed_at   = EXCLUDED.viewed_at,
        section     = COALESCE(EXCLUDED.section,    public.view_history.section),
        category    = COALESCE(EXCLUDED.category,   public.view_history.category),
        subcategory = COALESCE(EXCLUDED.subcategory, public.view_history.subcategory);

  DELETE FROM public.view_history v
  WHERE v.user_id = auth.uid()
    AND v.id NOT IN (
      SELECT id FROM public.view_history
      WHERE user_id = auth.uid()
      ORDER BY viewed_at DESC
      LIMIT 50
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.record_view(uuid, text, text, text, text) TO authenticated;

-- =====================================================================
-- Done. Refresh your app — story owners will now show real usernames,
-- and view history will sync across devices for signed-in users.
-- =====================================================================
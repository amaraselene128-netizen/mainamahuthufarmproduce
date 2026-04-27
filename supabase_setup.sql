-- =====================================================================
-- SokoniArena — RUN THIS ONCE IN SUPABASE SQL EDITOR
-- Project: wxokpcbouchusnplpruc
--
-- HOW TO RUN:
--   1. Open https://supabase.com/dashboard/project/wxokpcbouchusnplpruc/sql/new
--   2. Paste this entire file
--   3. Click "Run"
--
-- WHY: We checked your database via the REST API and confirmed that the
-- view `public.profiles_public` does NOT exist. Every Fun Circle hook
-- (stories, friends, comments, messages, suggestions) reads from that
-- view. When it is missing, all queries return empty and every author
-- renders as "Unknown". This script creates the view (and a few related
-- helpers) so identities show up everywhere.
--
-- Safe to re-run.
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1) profiles_public — public projection of the profiles table
-- ---------------------------------------------------------------------
-- security_invoker = off (the default) means the view runs with the
-- privileges of its OWNER, not the calling user, so it bypasses the
-- restrictive RLS on `public.profiles`. Only non-sensitive columns are
-- exposed below — no email, no phone, no auth data.
-- ---------------------------------------------------------------------

DROP VIEW IF EXISTS public.profiles_public CASCADE;

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
-- 2) view_history table + record_view RPC
-- (powers the cross-device "You Might Also Like" recommendations)
-- ---------------------------------------------------------------------

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

ALTER TABLE public.view_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "view_history_select_own" ON public.view_history;
CREATE POLICY "view_history_select_own" ON public.view_history
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "view_history_insert_own" ON public.view_history;
CREATE POLICY "view_history_insert_own" ON public.view_history
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "view_history_update_own" ON public.view_history;
CREATE POLICY "view_history_update_own" ON public.view_history
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "view_history_delete_own" ON public.view_history;
CREATE POLICY "view_history_delete_own" ON public.view_history
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

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
  IF auth.uid() IS NULL THEN RETURN; END IF;

  INSERT INTO public.view_history (user_id, listing_id, listing_type, section, category, subcategory, viewed_at)
  VALUES (auth.uid(), _listing_id, _listing_type, _section, _category, _subcategory, now())
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
      ORDER BY viewed_at DESC LIMIT 50
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.record_view(uuid, text, text, text, text) TO authenticated;


-- ---------------------------------------------------------------------
-- 3) Verification — these should all return rows after running
-- ---------------------------------------------------------------------
SELECT 'profiles_public rows:' AS check, count(*)::text AS value FROM public.profiles_public
UNION ALL
SELECT 'view_history exists:', 'yes' WHERE to_regclass('public.view_history') IS NOT NULL;

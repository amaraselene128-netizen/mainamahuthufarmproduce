-- =====================================================================
-- SOKONI BEAST 🦁 — Database setup
-- Project: SokoniArena
--
-- HOW TO RUN:
--   1. Open the Supabase SQL editor for your project
--   2. Paste this entire file
--   3. Click "Run"
--
-- WHAT THIS DOES:
-- Creates the tables the Sokoni Beast assistant needs to remember every
-- user, persist every conversation, log analytics, and sync per-user
-- "predator memory" (viewed listings, cart intent, preferences) across
-- devices.
--
-- Safe to re-run.
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1) assistant_conversations — one row per chat session
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.assistant_conversations (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  started_at      timestamptz NOT NULL DEFAULT now(),
  ended_at        timestamptz,
  is_active       boolean NOT NULL DEFAULT true,
  last_activity_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS assistant_conversations_user_idx
  ON public.assistant_conversations (user_id, started_at DESC);

ALTER TABLE public.assistant_conversations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "own_convos_select" ON public.assistant_conversations;
CREATE POLICY "own_convos_select" ON public.assistant_conversations
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "own_convos_insert" ON public.assistant_conversations;
CREATE POLICY "own_convos_insert" ON public.assistant_conversations
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "own_convos_update" ON public.assistant_conversations;
CREATE POLICY "own_convos_update" ON public.assistant_conversations
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "own_convos_delete" ON public.assistant_conversations;
CREATE POLICY "own_convos_delete" ON public.assistant_conversations
  FOR DELETE TO authenticated USING (auth.uid() = user_id);


-- ---------------------------------------------------------------------
-- 2) assistant_messages — one row per chat message
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.assistant_messages (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.assistant_conversations(id) ON DELETE CASCADE,
  user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role            text NOT NULL CHECK (role IN ('user','assistant','system')),
  content         text NOT NULL,
  intent_type     text,
  action_taken    text,
  metadata        jsonb,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS assistant_messages_conv_idx
  ON public.assistant_messages (conversation_id, created_at);
CREATE INDEX IF NOT EXISTS assistant_messages_user_idx
  ON public.assistant_messages (user_id, created_at DESC);

ALTER TABLE public.assistant_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "own_msgs_select" ON public.assistant_messages;
CREATE POLICY "own_msgs_select" ON public.assistant_messages
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "own_msgs_insert" ON public.assistant_messages;
CREATE POLICY "own_msgs_insert" ON public.assistant_messages
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "own_msgs_delete" ON public.assistant_messages;
CREATE POLICY "own_msgs_delete" ON public.assistant_messages
  FOR DELETE TO authenticated USING (auth.uid() = user_id);


-- ---------------------------------------------------------------------
-- 3) assistant_analytics — anonymous + per-user event tracking
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.assistant_analytics (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id  uuid NOT NULL,
  event_type  text NOT NULL,
  event_data  jsonb,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS assistant_analytics_event_idx
  ON public.assistant_analytics (event_type, created_at DESC);
CREATE INDEX IF NOT EXISTS assistant_analytics_user_idx
  ON public.assistant_analytics (user_id, created_at DESC);

ALTER TABLE public.assistant_analytics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "analytics_insert_any" ON public.assistant_analytics;
CREATE POLICY "analytics_insert_any" ON public.assistant_analytics
  FOR INSERT TO authenticated, anon WITH CHECK (true);

DROP POLICY IF EXISTS "analytics_select_own" ON public.assistant_analytics;
CREATE POLICY "analytics_select_own" ON public.assistant_analytics
  FOR SELECT TO authenticated USING (auth.uid() = user_id);


-- ---------------------------------------------------------------------
-- 4) beast_memory — predator memory for personalization
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.beast_memory (
  user_id              uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  viewed_listings      jsonb NOT NULL DEFAULT '[]'::jsonb,
  cart_intent          jsonb NOT NULL DEFAULT '[]'::jsonb,
  favorited_listings   jsonb NOT NULL DEFAULT '[]'::jsonb,
  preferred_categories jsonb NOT NULL DEFAULT '{}'::jsonb,
  preferred_locations  jsonb NOT NULL DEFAULT '{}'::jsonb,
  last_search          text,
  last_intent          jsonb,
  last_shop_id         uuid,
  total_interactions   integer NOT NULL DEFAULT 0,
  updated_at           timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.beast_memory ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "beast_memory_select_own" ON public.beast_memory;
CREATE POLICY "beast_memory_select_own" ON public.beast_memory
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "beast_memory_upsert_own_insert" ON public.beast_memory;
CREATE POLICY "beast_memory_upsert_own_insert" ON public.beast_memory
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "beast_memory_upsert_own_update" ON public.beast_memory;
CREATE POLICY "beast_memory_upsert_own_update" ON public.beast_memory
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);


-- ---------------------------------------------------------------------
-- 5) Verification — these should all return rows after running
-- ---------------------------------------------------------------------
SELECT 'assistant_conversations' AS table, to_regclass('public.assistant_conversations')::text AS exists
UNION ALL SELECT 'assistant_messages',     to_regclass('public.assistant_messages')::text
UNION ALL SELECT 'assistant_analytics',    to_regclass('public.assistant_analytics')::text
UNION ALL SELECT 'beast_memory',           to_regclass('public.beast_memory')::text;

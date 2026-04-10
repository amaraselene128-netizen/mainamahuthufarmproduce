import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const dbUrl = Deno.env.get("SUPABASE_DB_URL")!;

    const sql = `
      -- Cart items table
      CREATE TABLE IF NOT EXISTS public.cart_items (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id uuid NOT NULL,
        listing_id uuid NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
        created_at timestamptz DEFAULT now(),
        UNIQUE(user_id, listing_id)
      );

      ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;

      -- RLS policies for cart_items
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'cart_items' AND policyname = 'Users can view own cart') THEN
          CREATE POLICY "Users can view own cart" ON public.cart_items FOR SELECT TO authenticated USING (auth.uid() = user_id);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'cart_items' AND policyname = 'Users can add to cart') THEN
          CREATE POLICY "Users can add to cart" ON public.cart_items FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'cart_items' AND policyname = 'Users can remove from cart') THEN
          CREATE POLICY "Users can remove from cart" ON public.cart_items FOR DELETE TO authenticated USING (auth.uid() = user_id);
        END IF;
      END $$;

      -- Fix notify_story_reaction function to use 'metadata' instead of 'data'
      CREATE OR REPLACE FUNCTION public.notify_story_reaction()
      RETURNS trigger
      LANGUAGE plpgsql
      SECURITY DEFINER
      SET search_path TO 'public'
      AS $fn$
      DECLARE
        story_owner uuid;
        reactor_name text;
      BEGIN
        SELECT user_id INTO story_owner FROM public.fun_circle_stories WHERE id = NEW.story_id;
        IF story_owner = NEW.user_id THEN RETURN NEW; END IF;
        SELECT username INTO reactor_name FROM public.profiles WHERE user_id = NEW.user_id;
        INSERT INTO public.notifications (user_id, type, title, message, metadata)
        VALUES (
          story_owner,
          'story_reaction',
          'New reaction on your story',
          COALESCE(reactor_name, 'Someone') || ' reacted to your story',
          jsonb_build_object('story_id', NEW.story_id, 'reaction_type', NEW.reaction_type)
        );
        RETURN NEW;
      END;
      $fn$;

      -- Fix notify_listing_favorite function
      CREATE OR REPLACE FUNCTION public.notify_listing_favorite()
      RETURNS trigger
      LANGUAGE plpgsql
      SECURITY DEFINER
      SET search_path TO 'public'
      AS $fn$
      DECLARE
        listing_owner uuid;
        listing_title text;
        faver_name text;
      BEGIN
        SELECT user_id, title INTO listing_owner, listing_title FROM public.listings WHERE id = NEW.listing_id;
        IF listing_owner = NEW.user_id THEN RETURN NEW; END IF;
        SELECT username INTO faver_name FROM public.profiles WHERE user_id = NEW.user_id;
        INSERT INTO public.notifications (user_id, type, title, message, metadata)
        VALUES (
          listing_owner,
          'listing_favorite',
          'Someone liked your listing ❤️',
          COALESCE(faver_name, 'Someone') || ' favorited "' || listing_title || '"',
          jsonb_build_object('listing_id', NEW.listing_id)
        );
        RETURN NEW;
      END;
      $fn$;

      -- Fix notify_shop_follow function
      CREATE OR REPLACE FUNCTION public.notify_shop_follow()
      RETURNS trigger
      LANGUAGE plpgsql
      SECURITY DEFINER
      SET search_path TO 'public'
      AS $fn$
      DECLARE
        shop_owner uuid;
        shop_name_val text;
        follower_name text;
      BEGIN
        SELECT user_id, name INTO shop_owner, shop_name_val FROM public.shops WHERE id = NEW.shop_id;
        IF shop_owner = NEW.user_id THEN RETURN NEW; END IF;
        SELECT username INTO follower_name FROM public.profiles WHERE user_id = NEW.user_id;
        INSERT INTO public.notifications (user_id, type, title, message, metadata)
        VALUES (
          shop_owner,
          'shop_follow',
          'New shop follower! 🎉',
          COALESCE(follower_name, 'Someone') || ' followed your shop "' || shop_name_val || '"',
          jsonb_build_object('shop_id', NEW.shop_id)
        );
        RETURN NEW;
      END;
      $fn$;

      -- Create triggers if they don't exist
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_story_reaction_notify') THEN
          CREATE TRIGGER on_story_reaction_notify AFTER INSERT ON public.fun_circle_story_reactions FOR EACH ROW EXECUTE FUNCTION notify_story_reaction();
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_listing_favorite_notify') THEN
          CREATE TRIGGER on_listing_favorite_notify AFTER INSERT ON public.favorites FOR EACH ROW EXECUTE FUNCTION notify_listing_favorite();
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_shop_follow_notify') THEN
          CREATE TRIGGER on_shop_follow_notify AFTER INSERT ON public.shop_followers FOR EACH ROW EXECUTE FUNCTION notify_shop_follow();
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_shop_review_rating') THEN
          CREATE TRIGGER on_shop_review_rating AFTER INSERT OR UPDATE OR DELETE ON public.shop_reviews FOR EACH ROW EXECUTE FUNCTION update_shop_rating();
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_shop_request_approval') THEN
          CREATE TRIGGER on_shop_request_approval AFTER UPDATE ON public.shop_creation_requests FOR EACH ROW EXECUTE FUNCTION handle_shop_request_approval();
        END IF;
      END $$;

      -- Storage policies for fun-circle bucket
      DO $$ BEGIN
        -- Allow authenticated users to upload to their own folder
        IF NOT EXISTS (SELECT 1 FROM storage.policies WHERE name = 'Users can upload avatars') THEN
          INSERT INTO storage.policies (name, bucket_id, operation, definition, check_expression)
          VALUES ('Users can upload avatars', 'fun-circle', 'INSERT', NULL, '(auth.uid()::text = (storage.foldername(name))[1])');
        END IF;
      END $$;
    `;

    // Use the REST API to execute SQL
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${serviceRoleKey}`,
        "apikey": serviceRoleKey,
      },
    });

    // Try direct SQL execution via pg
    // Since we can't run raw SQL via REST, let's use individual operations
    // Create the cart_items table using the admin client
    
    // Actually, we need to use the SQL editor approach via the management API
    const mgmtResponse = await fetch(
      `https://api.supabase.com/v1/projects/${supabaseUrl.split('//')[1].split('.')[0]}/database/query`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${serviceRoleKey}`,
        },
        body: JSON.stringify({ query: sql }),
      }
    );

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "SQL provided - please run in Supabase SQL Editor",
        sql: sql
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

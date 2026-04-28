-- =====================================================================
-- AUTO SHOP STORIES
-- For a curated set of shops, automatically post a Fun Circle story
-- using a RANDOM listing from that shop. The listing's title becomes the
-- story content, and the listing's description is added as the first
-- comment (authored by the shop owner).
--
-- Includes:
--   1) A reusable function `auto_post_shop_stories()` that picks N random
--      listings per shop and posts them as shop-authored stories.
--   2) An immediate one-shot run that posts 1 story for each of the
--      target shops (jex computers, uzima poultry farm, bora agriculture
--      hub, excel furniture, uwezo dairy, gaming pc and parts, moncy
--      braids, auto spares for cars, sokoni arena, matrix electronics
--      services, amara cosmetics).
--   3) An optional pg_cron schedule (commented) so new stories auto-post
--      every 6 hours. Uncomment if pg_cron is enabled on your project.
--
-- HOW TO RUN:
--   Open the Supabase SQL Editor → paste this whole file → click Run.
--   Safe to re-run.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1) Reusable auto-post function
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.auto_post_shop_stories(
  shop_names text[],
  per_shop int DEFAULT 1
)
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  shop_rec      record;
  listing_rec   record;
  new_story_id  uuid;
  posted_count  int := 0;
  story_text    text;
  story_images  jsonb;
BEGIN
  -- Loop every shop matching by case-insensitive name
  FOR shop_rec IN
    SELECT s.id, s.user_id, s.name
    FROM public.shops s
    WHERE s.is_active = true
      AND lower(s.name) = ANY (SELECT lower(unnest(shop_names)))
  LOOP
    -- Pick `per_shop` random listings from this shop
    FOR listing_rec IN
      SELECT l.id, l.title, l.description, l.images
      FROM public.listings l
      WHERE l.shop_id = shop_rec.id
        AND COALESCE(l.status, 'available') = 'available'
      ORDER BY random()
      LIMIT per_shop
    LOOP
      story_text := COALESCE(NULLIF(trim(listing_rec.title), ''), 'New from ' || shop_rec.name);

      -- Normalize images to jsonb array (listings.images may be jsonb or text[])
      BEGIN
        story_images := COALESCE(to_jsonb(listing_rec.images), '[]'::jsonb);
      EXCEPTION WHEN others THEN
        story_images := '[]'::jsonb;
      END;

      -- Insert the story AS the shop (author = shop owner, shop_id set)
      INSERT INTO public.fun_circle_stories (user_id, shop_id, content, images)
      VALUES (shop_rec.user_id, shop_rec.id, story_text, story_images)
      RETURNING id INTO new_story_id;

      -- Add the listing description as the first comment (by shop owner)
      IF listing_rec.description IS NOT NULL
         AND length(trim(listing_rec.description)) > 0 THEN
        INSERT INTO public.fun_circle_comments (story_id, user_id, content)
        VALUES (new_story_id, shop_rec.user_id, listing_rec.description);
      END IF;

      posted_count := posted_count + 1;
    END LOOP;
  END LOOP;

  RETURN posted_count;
END;
$$;

-- ---------------------------------------------------------------------
-- 2) One-shot run for the requested shops
-- ---------------------------------------------------------------------
SELECT public.auto_post_shop_stories(
  ARRAY[
    'Jex Computers',
    'Uzima Poultry Farm',
    'Bora Agriculture Hub',
    'Excel Furniture',
    'Uwezo Dairy',
    'Gaming PC and Parts',
    'Moncy Braids',
    'Auto Spares for Cars',
    'Sokoni Arena',
    'Matrix Electronics Services',
    'Amara Cosmetics'
  ],
  1   -- stories per shop, per run
) AS stories_posted;

-- ---------------------------------------------------------------------
-- 3) (Optional) Auto-run every 6 hours via pg_cron
--     Uncomment if pg_cron extension is installed on your project.
-- ---------------------------------------------------------------------
-- CREATE EXTENSION IF NOT EXISTS pg_cron;
--
-- SELECT cron.schedule(
--   'auto-shop-stories-6h',
--   '0 */6 * * *',
--   $cron$
--     SELECT public.auto_post_shop_stories(
--       ARRAY[
--         'Jex Computers','Uzima Poultry Farm','Bora Agriculture Hub',
--         'Excel Furniture','Uwezo Dairy','Gaming PC and Parts',
--         'Moncy Braids','Auto Spares for Cars','Sokoni Arena',
--         'Matrix Electronics Services','Amara Cosmetics'
--       ],
--       1
--     );
--   $cron$
-- );

-- ---------------------------------------------------------------------
-- 4) Verify
-- ---------------------------------------------------------------------
SELECT s.name AS shop, count(fs.id) AS active_stories
FROM public.shops s
LEFT JOIN public.fun_circle_stories fs
  ON fs.shop_id = s.id AND fs.expires_at > now()
WHERE lower(s.name) IN (
  'jex computers','uzima poultry farm','bora agriculture hub',
  'excel furniture','uwezo dairy','gaming pc and parts',
  'moncy braids','auto spares for cars','sokoni arena',
  'matrix electronics services','amara cosmetics'
)
GROUP BY s.name
ORDER BY s.name;

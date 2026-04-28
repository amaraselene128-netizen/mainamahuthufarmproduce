-- =====================================================================
-- AUTO SHOP STORIES (max 5 active per shop)
-- For a curated set of shops, automatically post Fun Circle stories
-- using RANDOM listings from that shop. Each shop is kept topped up to
-- a MAXIMUM of 5 active (non-expired) stories — the function only adds
-- the difference, never more.
--
-- The listing's title becomes the story content, and the listing's
-- description is added as the first comment (authored by the shop owner).
--
-- HOW TO RUN:
--   Open the Supabase SQL Editor → paste this whole file → click Run.
--   Safe to re-run (idempotent — caps at 5 active stories per shop).
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1) Reusable auto-post function (tops up to `max_active` per shop)
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.auto_post_shop_stories(
  shop_names text[],
  max_active int DEFAULT 5
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
  active_count  int;
  needed        int;
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
    -- How many active (non-expired) stories does this shop currently have?
    SELECT count(*) INTO active_count
    FROM public.fun_circle_stories
    WHERE shop_id = shop_rec.id
      AND expires_at > now();

    needed := max_active - active_count;
    IF needed <= 0 THEN
      CONTINUE;  -- already at/over the cap, skip
    END IF;

    -- Pick `needed` random listings from this shop, avoiding duplicates
    -- of any listing already used in an active story.
    FOR listing_rec IN
      SELECT l.id, l.title, l.description, l.images
      FROM public.listings l
      WHERE l.shop_id = shop_rec.id
        AND COALESCE(l.status, 'available') = 'available'
        AND NOT EXISTS (
          SELECT 1 FROM public.fun_circle_stories fs
          WHERE fs.shop_id = shop_rec.id
            AND fs.expires_at > now()
            AND fs.content = COALESCE(NULLIF(trim(l.title), ''), 'New from ' || shop_rec.name)
        )
      ORDER BY random()
      LIMIT needed
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
-- 2) One-shot run: top each requested shop up to 5 active stories
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
  5   -- maximum active stories per shop
) AS stories_posted;

-- ---------------------------------------------------------------------
-- 3) (Optional) Auto top-up every 6 hours via pg_cron
--     Uncomment if pg_cron extension is installed on your project.
--     This will keep each shop at 5 active stories as old ones expire.
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
--       5
--     );
--   $cron$
-- );

-- ---------------------------------------------------------------------
-- 4) Verify (should show up to 5 active stories per shop)
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

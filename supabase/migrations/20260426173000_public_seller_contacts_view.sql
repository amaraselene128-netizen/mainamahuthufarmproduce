-- Public seller contacts for listing actions.
-- Exposes only minimal contact fields needed for call/WhatsApp buttons.

DROP VIEW IF EXISTS public.seller_contacts_public;

CREATE VIEW public.seller_contacts_public
WITH (security_invoker = on) AS
SELECT
  p.user_id,
  COALESCE(p.display_name, 'Seller') AS username,
  p.phone_number AS phone,
  p.phone_number AS whatsapp
FROM public.profiles p
WHERE p.phone_number IS NOT NULL
  AND length(trim(p.phone_number)) > 0;

GRANT SELECT ON public.seller_contacts_public TO authenticated, anon;

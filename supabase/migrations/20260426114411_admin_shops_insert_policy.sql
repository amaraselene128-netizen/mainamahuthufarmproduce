-- Fix: admins could not approve & create shops because the prior
-- "Admins can manage all shops" policy was FOR ALL ... USING (...) only,
-- with no WITH CHECK clause, so INSERT was blocked. Replace it with
-- explicit per-action policies that include WITH CHECK where needed.

DROP POLICY IF EXISTS "Admins can manage all shops" ON public.shops;

CREATE POLICY "Admins can insert any shop"
  ON public.shops FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update any shop"
  ON public.shops FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete any shop"
  ON public.shops FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view all shops"
  ON public.shops FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

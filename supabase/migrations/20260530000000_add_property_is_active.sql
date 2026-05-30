-- Soft-delete support: properties are deactivated instead of deleted.
-- Inactive properties stay in the database (and remain visible in the admin
-- panel for future updates) but are hidden from public search, the home
-- screen, and public detail pages.

ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

-- Keep public listing queries (filtered by is_active) fast.
CREATE INDEX IF NOT EXISTS properties_is_active_idx
  ON public.properties (is_active);

-- Tighten anonymous read access: the public (anon) role may only read active
-- listings. Authenticated admins keep full read access via the existing
-- "Allow authenticated read access" policy, so deactivated properties still
-- show up in the admin panel.
DROP POLICY IF EXISTS "Allow public read access" ON public.properties;
CREATE POLICY "Allow public read access"
  ON public.properties
  FOR SELECT
  TO anon
  USING (is_active = true);

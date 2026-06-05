
-- 1. Add premium / pricing columns
ALTER TABLE public.scripts
  ADD COLUMN IF NOT EXISTS is_premium boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS price_xof integer,
  ADD COLUMN IF NOT EXISTS terms_accepted_at timestamptz;

ALTER TABLE public.comics
  ADD COLUMN IF NOT EXISTS is_premium boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS price_xof integer,
  ADD COLUMN IF NOT EXISTS terms_accepted_at timestamptz,
  ADD COLUMN IF NOT EXISTS comic_panels jsonb;

ALTER TABLE public.episodes
  ADD COLUMN IF NOT EXISTS is_premium boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS price_xof integer,
  ADD COLUMN IF NOT EXISTS is_free_preview boolean NOT NULL DEFAULT false;

-- 2. Public read policies
-- Scripts: public can view published, non-premium public scripts (and premium listing metadata is also exposed; content gating handled client-side for now)
DROP POLICY IF EXISTS "Public can view published scripts" ON public.scripts;
CREATE POLICY "Public can view published scripts"
  ON public.scripts FOR SELECT
  USING (is_public = true AND status = 'published');

DROP POLICY IF EXISTS "Public can view published comics" ON public.comics;
CREATE POLICY "Public can view published comics"
  ON public.comics FOR SELECT
  USING (is_public = true AND status = 'published');

DROP POLICY IF EXISTS "Public can view public series" ON public.series;
CREATE POLICY "Public can view public series"
  ON public.series FOR SELECT
  USING (is_public = true);

-- Grant anon SELECT so public listings work without auth
GRANT SELECT ON public.scripts TO anon;
GRANT SELECT ON public.comics TO anon;
GRANT SELECT ON public.series TO anon;
GRANT SELECT ON public.episodes TO anon;

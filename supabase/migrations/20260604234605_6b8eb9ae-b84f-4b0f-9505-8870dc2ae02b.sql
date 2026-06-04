
CREATE TABLE public.episodes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  series_id UUID NOT NULL REFERENCES public.series(id) ON DELETE CASCADE,
  episode_number INTEGER NOT NULL,
  title TEXT,
  script_content TEXT,
  comic_panels JSONB,
  duration INTEGER,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published')),
  view_count INTEGER NOT NULL DEFAULT 0,
  like_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  published_at TIMESTAMPTZ,
  UNIQUE (series_id, episode_number)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.episodes TO authenticated;
GRANT SELECT ON public.episodes TO anon;
GRANT ALL ON public.episodes TO service_role;

ALTER TABLE public.episodes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view published episodes of public series"
ON public.episodes FOR SELECT
USING (
  status = 'published'
  AND EXISTS (
    SELECT 1 FROM public.series s
    WHERE s.id = episodes.series_id AND s.is_public = true
  )
);

CREATE POLICY "Owners can view their episodes"
ON public.episodes FOR SELECT
TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.series s WHERE s.id = episodes.series_id AND s.user_id = auth.uid())
);

CREATE POLICY "Owners can insert episodes"
ON public.episodes FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (SELECT 1 FROM public.series s WHERE s.id = episodes.series_id AND s.user_id = auth.uid())
);

CREATE POLICY "Owners can update episodes"
ON public.episodes FOR UPDATE
TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.series s WHERE s.id = episodes.series_id AND s.user_id = auth.uid())
)
WITH CHECK (
  EXISTS (SELECT 1 FROM public.series s WHERE s.id = episodes.series_id AND s.user_id = auth.uid())
);

CREATE POLICY "Owners can delete episodes"
ON public.episodes FOR DELETE
TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.series s WHERE s.id = episodes.series_id AND s.user_id = auth.uid())
);

CREATE INDEX idx_episodes_series ON public.episodes(series_id);

CREATE OR REPLACE FUNCTION public.update_episodes_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER trg_episodes_updated_at
BEFORE UPDATE ON public.episodes
FOR EACH ROW EXECUTE FUNCTION public.update_episodes_updated_at();

CREATE OR REPLACE FUNCTION public.sync_series_episode_count()
RETURNS TRIGGER AS $$
DECLARE sid UUID;
BEGIN
  sid := COALESCE(NEW.series_id, OLD.series_id);
  UPDATE public.series
  SET episode_count = (SELECT COUNT(*) FROM public.episodes WHERE series_id = sid),
      updated_at = now()
  WHERE id = sid;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trg_episodes_count_ins
AFTER INSERT OR DELETE ON public.episodes
FOR EACH ROW EXECUTE FUNCTION public.sync_series_episode_count();

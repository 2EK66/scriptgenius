-- Add policy to allow viewing published series
CREATE POLICY "Anyone can view published series" 
ON public.series 
FOR SELECT 
USING (is_published = true);

-- Add view count and likes count to series table
ALTER TABLE public.series 
ADD COLUMN view_count INTEGER DEFAULT 0,
ADD COLUMN likes_count INTEGER DEFAULT 0;
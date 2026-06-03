-- Find and fix the remaining security definer view
-- Drop the public_scripts view if it has security definer
DROP VIEW IF EXISTS public.public_scripts CASCADE;

-- Recreate public_scripts view without security definer
CREATE VIEW public.public_scripts AS
SELECT 
  s.id,
  s.user_id,
  s.title,
  s.content,
  s.genre,
  s.age_range,
  s.theme,
  s.custom_idea,
  s.status,
  s.word_count,
  s.is_public,
  s.allow_social_sharing,
  s.view_count,
  s.likes_count,
  s.created_at,
  s.updated_at,
  p.full_name AS author_name,
  p.avatar_url AS author_avatar
FROM public.scripts s
JOIN public.profiles p ON s.user_id = p.id
WHERE s.is_public = true;
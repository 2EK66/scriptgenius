CREATE OR REPLACE FUNCTION public.increment_public_content_view(p_content_id uuid, p_source text)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_count integer;
BEGIN
  CASE p_source
    WHEN 'scripts' THEN
      UPDATE public.scripts
      SET view_count = COALESCE(view_count, 0) + 1,
          updated_at = now()
      WHERE id = p_content_id
        AND is_public = true
        AND status = 'published'
      RETURNING view_count INTO new_count;
    WHEN 'comics' THEN
      UPDATE public.comics
      SET view_count = COALESCE(view_count, 0) + 1,
          updated_at = now()
      WHERE id = p_content_id
        AND is_public = true
        AND status = 'published'
      RETURNING view_count INTO new_count;
    WHEN 'series' THEN
      UPDATE public.series
      SET view_count = COALESCE(view_count, 0) + 1,
          updated_at = now()
      WHERE id = p_content_id
        AND is_public = true
      RETURNING view_count INTO new_count;
    ELSE
      RAISE EXCEPTION 'Type de contenu invalide';
  END CASE;

  IF new_count IS NULL THEN
    RAISE EXCEPTION 'Contenu public introuvable';
  END IF;

  RETURN new_count;
END;
$$;

CREATE OR REPLACE FUNCTION public.toggle_public_content_like(p_content_id uuid, p_source text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id uuid := auth.uid();
  existing_like_id uuid;
  new_count integer;
  is_public_content boolean;
  liked boolean;
BEGIN
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Connexion requise';
  END IF;

  CASE p_source
    WHEN 'scripts' THEN
      SELECT EXISTS (
        SELECT 1 FROM public.scripts
        WHERE id = p_content_id AND is_public = true AND status = 'published'
      ) INTO is_public_content;
    WHEN 'comics' THEN
      SELECT EXISTS (
        SELECT 1 FROM public.comics
        WHERE id = p_content_id AND is_public = true AND status = 'published'
      ) INTO is_public_content;
    WHEN 'series' THEN
      SELECT EXISTS (
        SELECT 1 FROM public.series
        WHERE id = p_content_id AND is_public = true
      ) INTO is_public_content;
    ELSE
      RAISE EXCEPTION 'Type de contenu invalide';
  END CASE;

  IF NOT is_public_content THEN
    RAISE EXCEPTION 'Contenu public introuvable';
  END IF;

  SELECT id INTO existing_like_id
  FROM public.script_likes
  WHERE user_id = current_user_id
    AND script_id = p_content_id
  ORDER BY created_at DESC
  LIMIT 1;

  IF existing_like_id IS NOT NULL THEN
    DELETE FROM public.script_likes
    WHERE user_id = current_user_id
      AND script_id = p_content_id;
    liked := false;
  ELSE
    INSERT INTO public.script_likes (user_id, script_id)
    VALUES (current_user_id, p_content_id);
    liked := true;
  END IF;

  CASE p_source
    WHEN 'scripts' THEN
      UPDATE public.scripts
      SET likes_count = GREATEST(0, COALESCE((SELECT COUNT(*) FROM public.script_likes WHERE script_id = p_content_id), 0)),
          updated_at = now()
      WHERE id = p_content_id
      RETURNING likes_count INTO new_count;
    WHEN 'comics' THEN
      UPDATE public.comics
      SET likes_count = GREATEST(0, COALESCE((SELECT COUNT(*) FROM public.script_likes WHERE script_id = p_content_id), 0)),
          updated_at = now()
      WHERE id = p_content_id
      RETURNING likes_count INTO new_count;
    WHEN 'series' THEN
      UPDATE public.series
      SET likes_count = GREATEST(0, COALESCE((SELECT COUNT(*) FROM public.script_likes WHERE script_id = p_content_id), 0)),
          updated_at = now()
      WHERE id = p_content_id
      RETURNING likes_count INTO new_count;
  END CASE;

  RETURN jsonb_build_object('liked', liked, 'likes_count', COALESCE(new_count, 0));
END;
$$;

GRANT EXECUTE ON FUNCTION public.increment_public_content_view(uuid, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.toggle_public_content_like(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_public_content_view(uuid, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.toggle_public_content_like(uuid, text) TO service_role;
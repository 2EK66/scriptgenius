
-- Ajouter les nouveaux champs pour la galerie publique
ALTER TABLE public.scripts ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT FALSE;
ALTER TABLE public.scripts ADD COLUMN IF NOT EXISTS allow_social_sharing BOOLEAN DEFAULT TRUE;
ALTER TABLE public.scripts ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;
ALTER TABLE public.scripts ADD COLUMN IF NOT EXISTS likes_count INTEGER DEFAULT 0;

-- Créer une table pour les likes des utilisateurs
CREATE TABLE IF NOT EXISTS public.script_likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  script_id UUID REFERENCES public.scripts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, script_id)
);

-- Enable Row Level Security pour la table script_likes
ALTER TABLE public.script_likes ENABLE ROW LEVEL SECURITY;

-- Créer les politiques pour script_likes
CREATE POLICY "Users can view all likes" ON public.script_likes
  FOR SELECT USING (true);

CREATE POLICY "Users can insert own likes" ON public.script_likes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own likes" ON public.script_likes
  FOR DELETE USING (auth.uid() = user_id);

-- Créer une vue pour les scripts publics avec les informations de l'auteur
CREATE OR REPLACE VIEW public.public_scripts AS
SELECT 
  s.*,
  p.full_name as author_name,
  p.avatar_url as author_avatar
FROM public.scripts s
JOIN public.profiles p ON s.user_id = p.id
WHERE s.is_public = true
ORDER BY s.created_at DESC;

-- Créer une fonction pour incrémenter le compteur de vues
CREATE OR REPLACE FUNCTION public.increment_view_count(script_id_param UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.scripts 
  SET view_count = view_count + 1
  WHERE id = script_id_param AND is_public = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Créer une fonction pour gérer les likes
CREATE OR REPLACE FUNCTION public.toggle_script_like(script_id_param UUID)
RETURNS BOOLEAN AS $$
DECLARE
  existing_like_id UUID;
  like_added BOOLEAN;
BEGIN
  -- Vérifier si l'utilisateur a déjà liké ce script
  SELECT id INTO existing_like_id 
  FROM public.script_likes 
  WHERE user_id = auth.uid() AND script_id = script_id_param;
  
  IF existing_like_id IS NOT NULL THEN
    -- Supprimer le like existant
    DELETE FROM public.script_likes WHERE id = existing_like_id;
    -- Décrémenter le compteur
    UPDATE public.scripts 
    SET likes_count = GREATEST(0, likes_count - 1)
    WHERE id = script_id_param;
    like_added := FALSE;
  ELSE
    -- Ajouter un nouveau like
    INSERT INTO public.script_likes (user_id, script_id) 
    VALUES (auth.uid(), script_id_param);
    -- Incrémenter le compteur
    UPDATE public.scripts 
    SET likes_count = likes_count + 1
    WHERE id = script_id_param;
    like_added := TRUE;
  END IF;
  
  RETURN like_added;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

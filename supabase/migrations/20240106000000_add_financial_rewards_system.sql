
-- Table pour les récompenses financières
CREATE TABLE IF NOT EXISTS public.financial_rewards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  month_year TEXT NOT NULL, -- Format: "2024-01"
  rank INTEGER NOT NULL CHECK (rank >= 1 AND rank <= 3),
  reward_amount INTEGER NOT NULL, -- Montant en XOF
  premium_subscribers_count INTEGER DEFAULT 0,
  base_amount INTEGER NOT NULL,
  subscriber_bonus INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, month_year)
);

-- Table pour le suivi du plagiat
CREATE TABLE IF NOT EXISTS public.plagiarism_checks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  script_id UUID REFERENCES public.scripts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  is_original BOOLEAN NOT NULL,
  similarity_score DECIMAL(5,2) DEFAULT 0,
  similar_scripts JSONB DEFAULT '[]',
  checked_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.financial_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plagiarism_checks ENABLE ROW LEVEL SECURITY;

-- Policies pour financial_rewards
CREATE POLICY "Users can view own financial rewards" ON public.financial_rewards
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage financial rewards" ON public.financial_rewards
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Policies pour plagiarism_checks
CREATE POLICY "Users can view own plagiarism checks" ON public.plagiarism_checks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own plagiarism checks" ON public.plagiarism_checks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Fonction pour vérifier le plagiat (simulation simple)
CREATE OR REPLACE FUNCTION public.check_plagiarism(
  script_content TEXT,
  exclude_script_id UUID DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  similar_scripts JSONB := '[]';
  max_similarity DECIMAL := 0;
  current_similarity DECIMAL;
  script_record RECORD;
  word_count INTEGER;
  content_words TEXT[];
  other_words TEXT[];
  common_words INTEGER;
  result JSONB;
BEGIN
  -- Nettoyer et diviser le contenu en mots
  content_words := string_to_array(lower(regexp_replace(script_content, '[^a-zA-Z0-9\s]', ' ', 'g')), ' ');
  content_words := array_remove(content_words, '');
  word_count := array_length(content_words, 1);
  
  -- Si le contenu est trop court, on considère qu'il n'est pas original
  IF word_count < 50 THEN
    RETURN jsonb_build_object(
      'is_original', false,
      'similarity_score', 100,
      'similar_scripts', '[]'::jsonb
    );
  END IF;
  
  -- Comparer avec les autres scripts publics
  FOR script_record IN
    SELECT s.id, s.title, s.content, p.full_name as author_name
    FROM public.scripts s
    JOIN public.profiles p ON s.user_id = p.id
    WHERE s.is_public = true 
    AND (exclude_script_id IS NULL OR s.id != exclude_script_id)
    AND char_length(s.content) > 100
  LOOP
    -- Diviser le contenu de l'autre script en mots
    other_words := string_to_array(lower(regexp_replace(script_record.content, '[^a-zA-Z0-9\s]', ' ', 'g')), ' ');
    other_words := array_remove(other_words, '');
    
    -- Calculer les mots communs (algorithme simple)
    SELECT COUNT(*) INTO common_words
    FROM unnest(content_words) word1
    WHERE word1 = ANY(other_words);
    
    -- Calculer le pourcentage de similarité
    current_similarity := (common_words::DECIMAL / word_count::DECIMAL) * 100;
    
    -- Si la similarité est élevée, ajouter aux scripts similaires
    IF current_similarity > 30 THEN
      similar_scripts := similar_scripts || jsonb_build_object(
        'id', script_record.id,
        'title', script_record.title,
        'author_name', script_record.author_name,
        'similarity_percentage', round(current_similarity, 1)
      );
      
      max_similarity := GREATEST(max_similarity, current_similarity);
    END IF;
  END LOOP;
  
  -- Construire le résultat
  result := jsonb_build_object(
    'is_original', max_similarity < 50,
    'similarity_score', round(max_similarity, 1),
    'similar_scripts', similar_scripts
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour calculer les récompenses financières mensuelles
CREATE OR REPLACE FUNCTION public.calculate_monthly_rewards()
RETURNS JSONB AS $$
DECLARE
  premium_count INTEGER;
  base_amounts INTEGER[] := ARRAY[50000, 30000, 20000]; -- Base pour positions 1, 2, 3
  subscriber_multiplier DECIMAL := 1000; -- 1000 XOF par abonné premium
  result JSONB;
BEGIN
  -- Compter les abonnés premium actifs
  SELECT COUNT(*) INTO premium_count
  FROM public.profiles
  WHERE subscription_type = 'premium'
  AND (subscription_expires_at IS NULL OR subscription_expires_at > NOW());
  
  -- Calculer les montants
  result := jsonb_build_object(
    'base_amount', base_amounts[1], -- Pour la 1ère place
    'subscriber_bonus', (premium_count * subscriber_multiplier)::INTEGER,
    'total_amount', (base_amounts[1] + (premium_count * subscriber_multiplier))::INTEGER,
    'premium_subscribers', premium_count
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour distribuer les récompenses financières (admin seulement)
CREATE OR REPLACE FUNCTION public.distribute_monthly_financial_rewards()
RETURNS VOID AS $$
DECLARE
  top_creators RECORD;
  current_month TEXT := TO_CHAR(NOW(), 'YYYY-MM');
  premium_count INTEGER;
  rank_counter INTEGER := 1;
  base_amounts INTEGER[] := ARRAY[50000, 30000, 20000]; -- XOF
  subscriber_bonus INTEGER;
  total_amount INTEGER;
BEGIN
  -- Vérifier que l'utilisateur est admin
  IF auth.jwt() ->> 'role' != 'admin' THEN
    RAISE EXCEPTION 'Accès refusé: fonction admin uniquement';
  END IF;
  
  -- Compter les abonnés premium
  SELECT COUNT(*) INTO premium_count
  FROM public.profiles
  WHERE subscription_type = 'premium'
  AND (subscription_expires_at IS NULL OR subscription_expires_at > NOW());
  
  subscriber_bonus := premium_count * 1000; -- 1000 XOF par abonné
  
  -- Récupérer le top 3 des créateurs éligibles
  FOR top_creators IN
    SELECT 
      cp.user_id,
      cp.total_points,
      p.full_name,
      p.subscription_type,
      COUNT(s.id) as public_scripts_count
    FROM public.creator_points cp
    JOIN public.profiles p ON cp.user_id = p.id
    LEFT JOIN public.scripts s ON cp.user_id = s.user_id AND s.is_public = true
    LEFT JOIN public.plagiarism_checks pc ON s.id = pc.script_id AND pc.is_original = true
    WHERE p.subscription_type = 'premium'
    AND (p.subscription_expires_at IS NULL OR p.subscription_expires_at > NOW())
    GROUP BY cp.user_id, cp.total_points, p.full_name, p.subscription_type
    HAVING COUNT(s.id) >= 1 -- Au moins 1 création publique
    AND COUNT(pc.id) = COUNT(s.id) -- Toutes les œuvres sont originales
    ORDER BY cp.total_points DESC
    LIMIT 3
  LOOP
    total_amount := base_amounts[rank_counter] + subscriber_bonus;
    
    -- Insérer la récompense financière
    INSERT INTO public.financial_rewards (
      user_id,
      month_year,
      rank,
      reward_amount,
      premium_subscribers_count,
      base_amount,
      subscriber_bonus
    )
    VALUES (
      top_creators.user_id,
      current_month,
      rank_counter,
      total_amount,
      premium_count,
      base_amounts[rank_counter],
      subscriber_bonus
    )
    ON CONFLICT (user_id, month_year) 
    DO UPDATE SET
      reward_amount = total_amount,
      premium_subscribers_count = premium_count,
      base_amount = base_amounts[rank_counter],
      subscriber_bonus = subscriber_bonus;
    
    rank_counter := rank_counter + 1;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Mise à jour de la vue creator_leaderboard pour inclure l'originalité
DROP VIEW IF EXISTS public.creator_leaderboard;
CREATE OR REPLACE VIEW public.creator_leaderboard AS
SELECT 
  cp.user_id,
  p.full_name,
  p.avatar_url,
  cp.total_points,
  cp.complete_reads,
  cp.comments_received,
  cp.likes_received,
  cp.last_calculated_at,
  COALESCE(script_count.count, 0) as scripts_published,
  COALESCE(original_count.count, 0) as original_scripts,
  p.subscription_type,
  CASE 
    WHEN p.subscription_type = 'premium' 
    AND COALESCE(script_count.count, 0) >= 1 
    AND COALESCE(original_count.count, 0) = COALESCE(script_count.count, 0)
    THEN true 
    ELSE false 
  END as eligible_for_rewards,
  ROW_NUMBER() OVER (ORDER BY cp.total_points DESC) as rank
FROM public.creator_points cp
JOIN public.profiles p ON cp.user_id = p.id
LEFT JOIN (
  SELECT user_id, COUNT(*) as count
  FROM public.scripts
  WHERE is_public = true
  GROUP BY user_id
) script_count ON cp.user_id = script_count.user_id
LEFT JOIN (
  SELECT s.user_id, COUNT(*) as count
  FROM public.scripts s
  JOIN public.plagiarism_checks pc ON s.id = pc.script_id
  WHERE s.is_public = true AND pc.is_original = true
  GROUP BY s.user_id
) original_count ON cp.user_id = original_count.user_id
ORDER BY cp.total_points DESC;

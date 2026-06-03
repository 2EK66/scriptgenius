
-- Table pour les points des créateurs
CREATE TABLE IF NOT EXISTS public.creator_points (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  total_points INTEGER DEFAULT 0,
  points_this_month INTEGER DEFAULT 0,
  complete_reads INTEGER DEFAULT 0,
  comments_received INTEGER DEFAULT 0,
  likes_received INTEGER DEFAULT 0,
  last_calculated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Table pour l'historique des récompenses mensuelles
CREATE TABLE IF NOT EXISTS public.monthly_rewards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  month_year TEXT NOT NULL, -- Format: "2024-01"
  rank INTEGER NOT NULL,
  total_points INTEGER NOT NULL,
  badge_earned TEXT NOT NULL,
  reward_type TEXT NOT NULL, -- 'top_visibility', 'premium_credits', 'badge'
  reward_value TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table pour les badges
CREATE TABLE IF NOT EXISTS public.user_badges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_type TEXT NOT NULL, -- 'monthly_winner', 'top_creator', 'rising_star', etc.
  badge_title TEXT NOT NULL,
  badge_description TEXT,
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  month_year TEXT -- Pour les badges mensuels
);

-- Enable RLS
ALTER TABLE public.creator_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

-- Policies pour creator_points
CREATE POLICY "Everyone can view creator points" ON public.creator_points
  FOR SELECT USING (true);

CREATE POLICY "Users can update own points" ON public.creator_points
  FOR UPDATE USING (auth.uid() = user_id);

-- Policies pour monthly_rewards
CREATE POLICY "Everyone can view monthly rewards" ON public.monthly_rewards
  FOR SELECT USING (true);

-- Policies pour user_badges
CREATE POLICY "Everyone can view badges" ON public.user_badges
  FOR SELECT USING (true);

-- Fonction pour calculer les points d'un script
CREATE OR REPLACE FUNCTION public.calculate_script_points(
  complete_reads_count INTEGER,
  comments_count INTEGER,
  likes_count INTEGER
)
RETURNS INTEGER AS $$
BEGIN
  RETURN (complete_reads_count * 10) + (comments_count * 15) + (likes_count * 5);
END;
$$ LANGUAGE plpgsql;

-- Fonction pour mettre à jour les points d'un créateur
CREATE OR REPLACE FUNCTION public.update_creator_points(creator_user_id UUID)
RETURNS VOID AS $$
DECLARE
  script_stats RECORD;
  total_complete_reads INTEGER := 0;
  total_comments INTEGER := 0;
  total_likes INTEGER := 0;
  calculated_points INTEGER := 0;
BEGIN
  -- Calculer les statistiques totales pour tous les scripts du créateur
  SELECT 
    COALESCE(SUM(view_count), 0) as total_views,
    COALESCE(SUM(likes_count), 0) as total_likes,
    COALESCE(COUNT(*), 0) as total_scripts
  INTO script_stats
  FROM public.scripts 
  WHERE user_id = creator_user_id AND is_public = true;
  
  -- Pour l'instant, on considère qu'une vue = une lecture complète
  -- Plus tard on pourra ajouter un système de tracking plus précis
  total_complete_reads := script_stats.total_views;
  total_likes := script_stats.total_likes;
  -- Les commentaires seront ajoutés plus tard
  
  -- Calculer les points totaux
  calculated_points := public.calculate_script_points(
    total_complete_reads, 
    total_comments, 
    total_likes
  );
  
  -- Insérer ou mettre à jour les points du créateur
  INSERT INTO public.creator_points (
    user_id, 
    total_points, 
    complete_reads, 
    comments_received, 
    likes_received,
    last_calculated_at
  )
  VALUES (
    creator_user_id, 
    calculated_points, 
    total_complete_reads, 
    total_comments, 
    total_likes,
    NOW()
  )
  ON CONFLICT (user_id) 
  DO UPDATE SET
    total_points = calculated_points,
    complete_reads = total_complete_reads,
    comments_received = total_comments,
    likes_received = total_likes,
    last_calculated_at = NOW(),
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour attribuer les badges mensuels
CREATE OR REPLACE FUNCTION public.award_monthly_badges()
RETURNS VOID AS $$
DECLARE
  top_creators RECORD;
  current_month TEXT := TO_CHAR(NOW(), 'YYYY-MM');
  rank_counter INTEGER := 1;
BEGIN
  -- Récupérer le top 10 des créateurs du mois
  FOR top_creators IN
    SELECT 
      cp.user_id,
      cp.total_points,
      p.full_name
    FROM public.creator_points cp
    JOIN public.profiles p ON cp.user_id = p.id
    ORDER BY cp.total_points DESC
    LIMIT 10
  LOOP
    -- Insérer dans monthly_rewards
    INSERT INTO public.monthly_rewards (
      user_id,
      month_year,
      rank,
      total_points,
      badge_earned,
      reward_type,
      reward_value
    )
    VALUES (
      top_creators.user_id,
      current_month,
      rank_counter,
      top_creators.total_points,
      CASE 
        WHEN rank_counter = 1 THEN 'Créateur du Mois'
        WHEN rank_counter <= 3 THEN 'Top 3 Créateur'
        ELSE 'Top 10 Créateur'
      END,
      CASE 
        WHEN rank_counter <= 3 THEN 'top_visibility'
        ELSE 'badge'
      END,
      CASE 
        WHEN rank_counter = 1 THEN '1000_credits'
        WHEN rank_counter = 2 THEN '500_credits'
        WHEN rank_counter = 3 THEN '250_credits'
        ELSE null
      END
    );
    
    -- Attribuer le badge
    INSERT INTO public.user_badges (
      user_id,
      badge_type,
      badge_title,
      badge_description,
      month_year
    )
    VALUES (
      top_creators.user_id,
      CASE 
        WHEN rank_counter = 1 THEN 'monthly_winner'
        WHEN rank_counter <= 3 THEN 'top_creator'
        ELSE 'rising_star'
      END,
      CASE 
        WHEN rank_counter = 1 THEN 'Créateur du Mois'
        WHEN rank_counter <= 3 THEN 'Top 3 Créateur'
        ELSE 'Top 10 Créateur'
      END,
      CASE 
        WHEN rank_counter = 1 THEN 'Félicitations ! Vous êtes le créateur du mois !'
        WHEN rank_counter <= 3 THEN 'Excellent travail ! Vous êtes dans le top 3 des créateurs'
        ELSE 'Bravo ! Vous faites partie des 10 meilleurs créateurs du mois'
      END,
      current_month
    );
    
    rank_counter := rank_counter + 1;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Vue pour le leaderboard avec informations des profils
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
  ROW_NUMBER() OVER (ORDER BY cp.total_points DESC) as rank
FROM public.creator_points cp
JOIN public.profiles p ON cp.user_id = p.id
LEFT JOIN (
  SELECT user_id, COUNT(*) as count
  FROM public.scripts
  WHERE is_public = true
  GROUP BY user_id
) script_count ON cp.user_id = script_count.user_id
ORDER BY cp.total_points DESC;

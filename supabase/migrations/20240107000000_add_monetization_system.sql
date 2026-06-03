-- Migration pour le système de monétisation
-- Table pour les ventes d'œuvres
CREATE TABLE IF NOT EXISTS public.script_sales (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  script_id UUID REFERENCES public.scripts(id) ON DELETE CASCADE,
  buyer_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  seller_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  price_paid INTEGER NOT NULL, -- En XOF (centimes)
  payment_method TEXT DEFAULT 'cinetpay',
  transaction_id TEXT,
  status TEXT DEFAULT 'pending', -- 'pending', 'completed', 'failed'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table pour les gains des auteurs
CREATE TABLE IF NOT EXISTS public.author_earnings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  total_earnings INTEGER DEFAULT 0, -- En XOF (centimes)
  pending_earnings INTEGER DEFAULT 0, -- En attente
  paid_earnings INTEGER DEFAULT 0, -- Déjà payés
  last_payment_request TIMESTAMPTZ,
  payment_threshold INTEGER DEFAULT 1000000, -- 10000 XOF en centimes
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Table pour les demandes de paiement
CREATE TABLE IF NOT EXISTS public.payment_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  amount_requested INTEGER NOT NULL, -- En XOF (centimes)
  status TEXT DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'rejected'
  payment_method TEXT, -- 'mobile_money', 'bank_transfer', etc.
  payment_details JSONB, -- Numéro de téléphone, RIB, etc.
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table pour marquer les œuvres comme premium
CREATE TABLE IF NOT EXISTS public.premium_scripts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  script_id UUID REFERENCES public.scripts(id) ON DELETE CASCADE,
  price INTEGER NOT NULL, -- En XOF (centimes)
  is_auto_promoted BOOLEAN DEFAULT false, -- Auto-promu par système Top 3
  promoted_at TIMESTAMPTZ,
  sales_count INTEGER DEFAULT 0,
  total_revenue INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(script_id)
);

-- Enable RLS
ALTER TABLE public.script_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.author_earnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.premium_scripts ENABLE ROW LEVEL SECURITY;

-- Policies pour script_sales
CREATE POLICY "Users can view their own sales" ON public.script_sales
  FOR SELECT USING (buyer_user_id = auth.uid() OR seller_user_id = auth.uid());

CREATE POLICY "Anyone can create sales" ON public.script_sales
  FOR INSERT WITH CHECK (true);

-- Policies pour author_earnings
CREATE POLICY "Users can view their own earnings" ON public.author_earnings
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update their own earnings" ON public.author_earnings
  FOR UPDATE USING (user_id = auth.uid());

-- Policies pour payment_requests
CREATE POLICY "Users can view their own payment requests" ON public.payment_requests
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create their own payment requests" ON public.payment_requests
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Policies pour premium_scripts
CREATE POLICY "Everyone can view premium scripts" ON public.premium_scripts
  FOR SELECT USING (true);

CREATE POLICY "Script owners can manage premium status" ON public.premium_scripts
  FOR ALL USING (
    script_id IN (
      SELECT id FROM public.scripts WHERE user_id = auth.uid()
    )
  );

-- Fonction pour auto-promouvoir les œuvres du Top 3
CREATE OR REPLACE FUNCTION public.auto_promote_top3_scripts()
RETURNS VOID AS $$
DECLARE
  top_creator RECORD;
  script_record RECORD;
  default_price INTEGER := 1000000; -- 10000 XOF en centimes
BEGIN
  -- Récupérer le Top 3 des créateurs
  FOR top_creator IN
    SELECT user_id, rank
    FROM public.creator_leaderboard
    WHERE rank <= 3
    ORDER BY rank
  LOOP
    -- Promouvoir toutes les œuvres publiques du créateur
    FOR script_record IN
      SELECT id
      FROM public.scripts
      WHERE user_id = top_creator.user_id 
        AND is_public = true
        AND status = 'published'
    LOOP
      -- Ajouter l'œuvre comme premium si pas déjà
      INSERT INTO public.premium_scripts (
        script_id, 
        price, 
        is_auto_promoted, 
        promoted_at
      )
      VALUES (
        script_record.id,
        default_price,
        true,
        NOW()
      )
      ON CONFLICT (script_id) 
      DO UPDATE SET
        is_auto_promoted = true,
        promoted_at = NOW()
      WHERE premium_scripts.is_auto_promoted = false;
    END LOOP;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour mettre à jour les gains d'un auteur
CREATE OR REPLACE FUNCTION public.update_author_earnings(author_id UUID)
RETURNS VOID AS $$
DECLARE
  total_sales INTEGER := 0;
  paid_amount INTEGER := 0;
BEGIN
  -- Calculer le total des ventes
  SELECT COALESCE(SUM(price_paid), 0)
  INTO total_sales
  FROM public.script_sales
  WHERE seller_user_id = author_id AND status = 'completed';
  
  -- Calculer le montant déjà payé
  SELECT COALESCE(SUM(amount_requested), 0)
  INTO paid_amount
  FROM public.payment_requests
  WHERE user_id = author_id AND status = 'completed';
  
  -- Mettre à jour ou créer l'enregistrement des gains
  INSERT INTO public.author_earnings (
    user_id,
    total_earnings,
    pending_earnings,
    paid_earnings,
    updated_at
  )
  VALUES (
    author_id,
    total_sales,
    total_sales - paid_amount,
    paid_amount,
    NOW()
  )
  ON CONFLICT (user_id)
  DO UPDATE SET
    total_earnings = total_sales,
    pending_earnings = total_sales - paid_amount,
    paid_earnings = paid_amount,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour créer une vente
CREATE OR REPLACE FUNCTION public.create_script_sale(
  p_script_id UUID,
  p_buyer_id UUID,
  p_price INTEGER,
  p_transaction_id TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  sale_id UUID;
  seller_id UUID;
BEGIN
  -- Récupérer l'ID du vendeur
  SELECT user_id INTO seller_id
  FROM public.scripts
  WHERE id = p_script_id;
  
  -- Créer la vente
  INSERT INTO public.script_sales (
    script_id,
    buyer_user_id,
    seller_user_id,
    price_paid,
    transaction_id,
    status
  )
  VALUES (
    p_script_id,
    p_buyer_id,
    seller_id,
    p_price,
    p_transaction_id,
    'completed'
  )
  RETURNING id INTO sale_id;
  
  -- Mettre à jour les statistiques du script premium
  UPDATE public.premium_scripts
  SET 
    sales_count = sales_count + 1,
    total_revenue = total_revenue + p_price
  WHERE script_id = p_script_id;
  
  -- Mettre à jour les gains de l'auteur
  PERFORM public.update_author_earnings(seller_id);
  
  RETURN sale_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Vue pour les scripts premium avec informations de vente
CREATE OR REPLACE VIEW public.premium_scripts_view AS
SELECT 
  ps.*,
  s.title,
  s.content,
  s.genre,
  s.user_id as author_id,
  p.full_name as author_name,
  p.avatar_url as author_avatar,
  s.view_count,
  s.likes_count
FROM public.premium_scripts ps
JOIN public.scripts s ON ps.script_id = s.id
JOIN public.profiles p ON s.user_id = p.id
WHERE s.is_public = true AND s.status = 'published';

-- Trigger pour auto-promouvoir après mise à jour du leaderboard
CREATE OR REPLACE FUNCTION public.trigger_auto_promote()
RETURNS TRIGGER AS $$
BEGIN
  -- Appeler la fonction d'auto-promotion
  PERFORM public.auto_promote_top3_scripts();
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Créer le trigger (à activer quand on met à jour le leaderboard)
-- CREATE TRIGGER auto_promote_top3_trigger
-- AFTER UPDATE ON public.creator_points
-- FOR EACH STATEMENT
-- EXECUTE FUNCTION public.trigger_auto_promote();
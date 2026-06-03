-- Créer la table pour les places premium achetées
CREATE TABLE IF NOT EXISTS public.premium_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  slot_type TEXT NOT NULL CHECK (slot_type IN ('script', 'comic')),
  price_paid INTEGER NOT NULL,
  purchased_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_used BOOLEAN NOT NULL DEFAULT false,
  used_for_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index pour optimiser les requêtes
CREATE INDEX idx_premium_slots_user_id ON public.premium_slots(user_id);
CREATE INDEX idx_premium_slots_expires_at ON public.premium_slots(expires_at);
CREATE INDEX idx_premium_slots_active ON public.premium_slots(is_active, is_used);

-- Activer RLS
ALTER TABLE public.premium_slots ENABLE ROW LEVEL SECURITY;

-- Policies RLS
CREATE POLICY "Users can view their own slots"
ON public.premium_slots
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own slots"
ON public.premium_slots
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own slots"
ON public.premium_slots
FOR UPDATE
USING (auth.uid() = user_id);

-- Fonction pour vérifier les slots disponibles
CREATE OR REPLACE FUNCTION public.get_available_slots(p_user_id UUID, p_slot_type TEXT)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  available_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO available_count
  FROM public.premium_slots
  WHERE user_id = p_user_id
    AND slot_type = p_slot_type
    AND is_active = true
    AND is_used = false
    AND expires_at > now();
  
  RETURN available_count;
END;
$$;

-- Fonction pour utiliser un slot
CREATE OR REPLACE FUNCTION public.use_premium_slot(p_user_id UUID, p_slot_type TEXT, p_item_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  slot_id UUID;
BEGIN
  -- Trouver un slot disponible
  SELECT id INTO slot_id
  FROM public.premium_slots
  WHERE user_id = p_user_id
    AND slot_type = p_slot_type
    AND is_active = true
    AND is_used = false
    AND expires_at > now()
  ORDER BY expires_at ASC
  LIMIT 1;
  
  IF slot_id IS NULL THEN
    RAISE EXCEPTION 'No available premium slot found';
  END IF;
  
  -- Marquer le slot comme utilisé
  UPDATE public.premium_slots
  SET is_used = true,
      used_for_id = p_item_id
  WHERE id = slot_id;
  
  RETURN slot_id;
END;
$$;

-- Fonction pour désactiver les slots expirés (à appeler périodiquement)
CREATE OR REPLACE FUNCTION public.deactivate_expired_slots()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  UPDATE public.premium_slots
  SET is_active = false
  WHERE is_active = true
    AND expires_at <= now();
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$;
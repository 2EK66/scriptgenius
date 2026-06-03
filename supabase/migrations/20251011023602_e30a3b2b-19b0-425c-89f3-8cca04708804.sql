-- Table pour stocker les BDs générées
CREATE TABLE public.comics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  genre TEXT,
  art_style TEXT,
  panels JSONB NOT NULL,
  is_public BOOLEAN DEFAULT false,
  allow_social_sharing BOOLEAN DEFAULT true,
  view_count INTEGER DEFAULT 0,
  likes_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.comics ENABLE ROW LEVEL SECURITY;

-- Policies pour les comics
CREATE POLICY "Users can view own comics"
  ON public.comics FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own comics"
  ON public.comics FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own comics"
  ON public.comics FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own comics"
  ON public.comics FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger pour updated_at
CREATE TRIGGER update_comics_updated_at
  BEFORE UPDATE ON public.comics
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Table pour les BDs premium
CREATE TABLE public.premium_comics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  comic_id UUID NOT NULL REFERENCES public.comics(id) ON DELETE CASCADE,
  price INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT true,
  sales_count INTEGER DEFAULT 0,
  total_revenue INTEGER DEFAULT 0,
  preview_panels JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(comic_id)
);

ALTER TABLE public.premium_comics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own premium comics"
  ON public.premium_comics FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view all active premium comics"
  ON public.premium_comics FOR SELECT
  USING (is_active = true);

-- Table pour les ventes de BDs
CREATE TABLE public.comic_sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id UUID NOT NULL,
  seller_id UUID NOT NULL,
  premium_comic_id UUID NOT NULL REFERENCES public.premium_comics(id),
  comic_id UUID NOT NULL REFERENCES public.comics(id),
  amount INTEGER NOT NULL,
  purchased_at TIMESTAMPTZ DEFAULT now(),
  transaction_id TEXT,
  payment_status TEXT DEFAULT 'pending'
);

ALTER TABLE public.comic_sales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create purchases"
  ON public.comic_sales FOR INSERT
  WITH CHECK (auth.uid() = buyer_id);

CREATE POLICY "Users can view their own purchases"
  ON public.comic_sales FOR SELECT
  USING (auth.uid() = buyer_id);

CREATE POLICY "Users can view their own sales"
  ON public.comic_sales FOR SELECT
  USING (auth.uid() = seller_id);

-- View pour les comics publiques
CREATE VIEW public.public_comics AS
SELECT 
  c.*,
  p.full_name as author_name,
  p.avatar_url as author_avatar
FROM public.comics c
LEFT JOIN public.profiles p ON c.user_id = p.id
WHERE c.is_public = true AND c.status = 'published';

-- Function pour incrémenter les stats des BDs premium
CREATE OR REPLACE FUNCTION public.increment_premium_comic_stats(comic_id_param UUID, revenue_increment NUMERIC)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  UPDATE public.premium_comics 
  SET 
    sales_count = sales_count + 1,
    total_revenue = total_revenue + revenue_increment,
    updated_at = now()
  WHERE comic_id = comic_id_param;
END;
$$;

-- Trigger pour mettre à jour les stats après une vente
CREATE OR REPLACE FUNCTION public.update_premium_comic_stats()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NEW.payment_status = 'completed' AND OLD.payment_status != 'completed' THEN
    UPDATE public.premium_comics 
    SET 
      sales_count = sales_count + 1,
      total_revenue = total_revenue + NEW.amount,
      updated_at = now()
    WHERE id = NEW.premium_comic_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_premium_comic_stats_trigger
  AFTER UPDATE ON public.comic_sales
  FOR EACH ROW
  EXECUTE FUNCTION public.update_premium_comic_stats();
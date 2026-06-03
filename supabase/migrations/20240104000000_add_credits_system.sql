
-- Add credits columns to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS credits_remaining INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS credits_used_total INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS credits_purchased_total INTEGER DEFAULT 0;

-- Create credit packages table
CREATE TABLE public.credit_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  credits INTEGER NOT NULL,
  price_cents INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'EUR',
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Insert credit packages with new pricing
INSERT INTO public.credit_packages (name, credits, price_cents, description) VALUES
('Pack Starter', 100, 1500, '100 crédits pour débuter'),
('Pack Standard', 300, 3500, '300 crédits - Bon rapport qualité/prix'),
('Pack Premium+', 1000, 650, '1000 crédits + fonctionnalités premium');

-- Create credit transactions table
CREATE TABLE public.credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('purchase', 'usage', 'refund')),
  credits INTEGER NOT NULL,
  description TEXT,
  payment_transaction_id UUID REFERENCES public.payment_transactions(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create image generations table
CREATE TABLE public.image_generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  prompt TEXT NOT NULL,
  image_url TEXT NOT NULL,
  model TEXT NOT NULL,
  credits_used INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.credit_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.image_generations ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "view_active_packages" ON public.credit_packages
FOR SELECT
USING (is_active = true);

CREATE POLICY "view_own_transactions" ON public.credit_transactions
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "view_own_generations" ON public.image_generations
FOR SELECT
USING (user_id = auth.uid());

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_id ON public.credit_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_image_generations_user_id ON public.image_generations(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_packages_active ON public.credit_packages(is_active);

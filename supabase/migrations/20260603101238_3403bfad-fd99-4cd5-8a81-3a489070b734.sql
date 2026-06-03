
-- Gallery features migration
ALTER TABLE public.scripts ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT FALSE;
ALTER TABLE public.scripts ADD COLUMN IF NOT EXISTS allow_social_sharing BOOLEAN DEFAULT TRUE;
ALTER TABLE public.scripts ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;
ALTER TABLE public.scripts ADD COLUMN IF NOT EXISTS likes_count INTEGER DEFAULT 0;

CREATE TABLE IF NOT EXISTS public.script_likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  script_id UUID REFERENCES public.scripts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, script_id)
);

GRANT SELECT, INSERT, DELETE ON public.script_likes TO authenticated;
GRANT ALL ON public.script_likes TO service_role;

ALTER TABLE public.script_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all likes" ON public.script_likes FOR SELECT USING (true);
CREATE POLICY "Users can insert own likes" ON public.script_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own likes" ON public.script_likes FOR DELETE USING (auth.uid() = user_id);

CREATE OR REPLACE VIEW public.public_scripts AS
SELECT s.*, p.full_name as author_name, p.avatar_url as author_avatar
FROM public.scripts s
JOIN public.profiles p ON s.user_id = p.id
WHERE s.is_public = true ORDER BY s.created_at DESC;

-- Credits system migration
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS credits_remaining INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS credits_used_total INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS credits_purchased_total INTEGER DEFAULT 0;

CREATE TABLE IF NOT EXISTS public.credit_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL, credits INTEGER NOT NULL, price_cents INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'EUR', description TEXT, is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('purchase', 'usage', 'refund')),
  credits INTEGER NOT NULL, description TEXT,
  payment_transaction_id UUID REFERENCES public.payment_transactions(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.image_generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  prompt TEXT NOT NULL, image_url TEXT NOT NULL, model TEXT NOT NULL,
  credits_used INTEGER DEFAULT 1, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.credit_packages TO anon, authenticated;
GRANT ALL ON public.credit_packages TO service_role;
GRANT SELECT, INSERT ON public.credit_transactions TO authenticated;
GRANT ALL ON public.credit_transactions TO service_role;
GRANT SELECT, INSERT ON public.image_generations TO authenticated;
GRANT ALL ON public.image_generations TO service_role;

ALTER TABLE public.credit_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.image_generations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "view_active_packages" ON public.credit_packages FOR SELECT USING (is_active = true);
CREATE POLICY "view_own_transactions" ON public.credit_transactions FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "view_own_generations" ON public.image_generations FOR SELECT USING (user_id = auth.uid());

-- Series table for gallery
CREATE TABLE IF NOT EXISTS public.series (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  cover_image_url TEXT,
  genre TEXT,
  is_public BOOLEAN DEFAULT false,
  view_count INTEGER DEFAULT 0,
  likes_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.series TO authenticated;
GRANT ALL ON public.series TO service_role;

ALTER TABLE public.series ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own series" ON public.series FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own series" ON public.series FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own series" ON public.series FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own series" ON public.series FOR DELETE USING (auth.uid() = user_id);

-- Premium slots table
CREATE TABLE IF NOT EXISTS public.premium_slots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  slot_type TEXT NOT NULL DEFAULT 'script' CHECK (slot_type IN ('script', 'comic', 'series')),
  price_paid INTEGER NOT NULL,
  purchased_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT true,
  is_used BOOLEAN DEFAULT false,
  used_for_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

GRANT SELECT, INSERT, UPDATE ON public.premium_slots TO authenticated;
GRANT ALL ON public.premium_slots TO service_role;

ALTER TABLE public.premium_slots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own slots" ON public.premium_slots FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own slots" ON public.premium_slots FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own slots" ON public.premium_slots FOR UPDATE USING (auth.uid() = user_id);

-- Comics table
CREATE TABLE IF NOT EXISTS public.comics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  script_id UUID REFERENCES public.scripts(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  cover_image_url TEXT,
  art_style TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  is_public BOOLEAN DEFAULT false,
  view_count INTEGER DEFAULT 0,
  likes_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.comics TO authenticated;
GRANT ALL ON public.comics TO service_role;

ALTER TABLE public.comics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own comics" ON public.comics FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own comics" ON public.comics FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own comics" ON public.comics FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own comics" ON public.comics FOR DELETE USING (auth.uid() = user_id);

-- RPC function for using premium slot
CREATE OR REPLACE FUNCTION public.use_premium_slot(p_slot_id UUID, p_used_for_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.premium_slots
  SET is_used = true, used_for_id = p_used_for_id, updated_at = NOW()
  WHERE id = p_slot_id AND user_id = auth.uid() AND is_active = true AND is_used = false AND expires_at > NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

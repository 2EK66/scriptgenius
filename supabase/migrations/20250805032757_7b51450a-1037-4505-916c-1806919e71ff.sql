-- Create premium_scripts table
CREATE TABLE public.premium_scripts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  script_id UUID NOT NULL REFERENCES public.scripts(id) ON DELETE CASCADE,
  price INTEGER NOT NULL, -- Price in XOF centimes
  preview_content TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sales_count INTEGER NOT NULL DEFAULT 0,
  total_revenue INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(script_id)
);

-- Enable RLS on premium_scripts
ALTER TABLE public.premium_scripts ENABLE ROW LEVEL SECURITY;

-- RLS policies for premium_scripts
CREATE POLICY "Users can view all active premium scripts" 
ON public.premium_scripts 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Users can manage their own premium scripts" 
ON public.premium_scripts 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create script_sales table for tracking purchases
CREATE TABLE public.script_sales (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  buyer_id UUID NOT NULL,
  seller_id UUID NOT NULL,
  premium_script_id UUID NOT NULL REFERENCES public.premium_scripts(id) ON DELETE CASCADE,
  script_id UUID NOT NULL REFERENCES public.scripts(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL, -- Price paid in XOF centimes
  transaction_id TEXT,
  payment_status TEXT NOT NULL DEFAULT 'pending',
  purchased_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(buyer_id, premium_script_id)
);

-- Enable RLS on script_sales
ALTER TABLE public.script_sales ENABLE ROW LEVEL SECURITY;

-- RLS policies for script_sales
CREATE POLICY "Users can view their own purchases" 
ON public.script_sales 
FOR SELECT 
USING (auth.uid() = buyer_id);

CREATE POLICY "Users can view their own sales" 
ON public.script_sales 
FOR SELECT 
USING (auth.uid() = seller_id);

CREATE POLICY "Users can create purchases" 
ON public.script_sales 
FOR INSERT 
WITH CHECK (auth.uid() = buyer_id);

-- Create payment_requests table for author payouts
CREATE TABLE public.payment_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  amount INTEGER NOT NULL, -- Amount in XOF centimes
  currency TEXT NOT NULL DEFAULT 'XOF',
  status TEXT NOT NULL DEFAULT 'pending',
  payment_method TEXT,
  payment_details JSONB,
  requested_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  processed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT
);

-- Enable RLS on payment_requests
ALTER TABLE public.payment_requests ENABLE ROW LEVEL SECURITY;

-- RLS policies for payment_requests
CREATE POLICY "Users can view their own payment requests" 
ON public.payment_requests 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own payment requests" 
ON public.payment_requests 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own payment requests" 
ON public.payment_requests 
FOR UPDATE 
USING (auth.uid() = user_id AND status = 'pending');

-- Create premium_scripts_view for easier querying
CREATE OR REPLACE VIEW public.premium_scripts_view AS
SELECT 
  ps.*,
  s.title,
  s.content,
  s.genre,
  s.age_range,
  s.theme,
  s.word_count,
  p.full_name AS author_name,
  p.avatar_url AS author_avatar,
  CASE 
    WHEN ss.buyer_id IS NOT NULL THEN true 
    ELSE false 
  END AS is_purchased
FROM public.premium_scripts ps
JOIN public.scripts s ON ps.script_id = s.id
JOIN public.profiles p ON ps.user_id = p.id
LEFT JOIN public.script_sales ss ON ps.id = ss.premium_script_id AND ss.buyer_id = auth.uid()
WHERE ps.is_active = true;

-- Create function to update premium script stats after sale
CREATE OR REPLACE FUNCTION public.update_premium_script_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.payment_status = 'completed' AND OLD.payment_status != 'completed' THEN
    UPDATE public.premium_scripts 
    SET 
      sales_count = sales_count + 1,
      total_revenue = total_revenue + NEW.amount,
      updated_at = now()
    WHERE id = NEW.premium_script_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Create trigger for updating premium script stats
CREATE TRIGGER update_premium_script_stats_trigger
  AFTER UPDATE ON public.script_sales
  FOR EACH ROW
  EXECUTE FUNCTION public.update_premium_script_stats();

-- Create function to handle updated_at timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for premium_scripts updated_at
CREATE TRIGGER update_premium_scripts_updated_at
  BEFORE UPDATE ON public.premium_scripts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
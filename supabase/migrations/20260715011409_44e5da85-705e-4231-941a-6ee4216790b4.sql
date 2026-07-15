ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS writing_style text,
  ADD COLUMN IF NOT EXISTS writing_signature text;
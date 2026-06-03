-- Fix security issues: Update functions with search_path and remove security definer view

-- Drop the insecure view
DROP VIEW IF EXISTS public.premium_scripts_view;

-- Fix function search_path issues for all existing functions
CREATE OR REPLACE FUNCTION public.increment_view_count(script_id_param uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $function$
BEGIN
  UPDATE public.scripts 
  SET view_count = view_count + 1
  WHERE id = script_id_param AND is_public = true;
END;
$function$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $function$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.increment_script_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $function$
BEGIN
  UPDATE public.profiles 
  SET 
    scripts_generated_today = CASE 
      WHEN last_generation_date = CURRENT_DATE THEN scripts_generated_today + 1
      ELSE 1
    END,
    scripts_generated_total = scripts_generated_total + 1,
    last_generation_date = CURRENT_DATE,
    updated_at = NOW()
  WHERE id = NEW.user_id;
  
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.toggle_script_like(script_id_param uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $function$
DECLARE
  existing_like_id UUID;
  like_added BOOLEAN;
BEGIN
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
    INSERT INTO public.script_likes (user_id, script_id) 
    VALUES (auth.uid(), script_id_param);
    UPDATE public.scripts 
    SET likes_count = likes_count + 1
    WHERE id = script_id_param;
    like_added := TRUE;
  END IF;
  
  RETURN like_added;
END;
$function$;

-- Fix the new functions we just created
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;
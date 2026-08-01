ALTER VIEW public.public_scripts SET (security_invoker = on);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $function$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.increment_script_count()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
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

CREATE OR REPLACE FUNCTION public.use_premium_slot(p_slot_id uuid, p_used_for_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $function$
BEGIN
  UPDATE public.premium_slots
  SET is_used = true, used_for_id = p_used_for_id, updated_at = NOW()
  WHERE id = p_slot_id AND user_id = auth.uid() AND is_active = true AND is_used = false AND expires_at > NOW();
END;
$function$;

-- Trigger-only functions must not be callable through the API
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.increment_script_count() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.sync_series_episode_count() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.update_episodes_updated_at() FROM PUBLIC, anon, authenticated;

-- Authenticated-only actions
REVOKE ALL ON FUNCTION public.use_premium_slot(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.use_premium_slot(uuid, uuid) TO authenticated;

REVOKE ALL ON FUNCTION public.toggle_public_content_like(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.toggle_public_content_like(uuid, text) TO authenticated;

-- Public view counter stays callable by visitors
GRANT EXECUTE ON FUNCTION public.increment_public_content_view(uuid, text) TO anon, authenticated;

-- Hide who liked what from anonymous visitors
DROP POLICY IF EXISTS "Users can view all likes" ON public.script_likes;
CREATE POLICY "Authenticated users can view likes"
ON public.script_likes FOR SELECT TO authenticated USING (true);
REVOKE SELECT ON public.script_likes FROM anon;
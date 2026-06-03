-- Créer une fonction RPC pour incrémenter les statistiques des scripts premium
CREATE OR REPLACE FUNCTION public.increment_premium_script_stats(
    script_id_param uuid,
    revenue_increment numeric
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
    UPDATE public.premium_scripts 
    SET 
        sales_count = sales_count + 1,
        total_revenue = total_revenue + revenue_increment,
        updated_at = now()
    WHERE script_id = script_id_param;
END;
$$;
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function logStep(step: string, details?: any) {
  console.log(`[CinetPay Webhook Purchase] ${step}`, details || '');
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  logStep("Webhook reçu");

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Récupérer les données du webhook
    const body = await req.json();
    logStep("Données reçues", body);

    const { cpm_trans_id, cpm_site_id, signature } = body;

    // Vérifier la configuration CinetPay
    const apiKey = Deno.env.get("CINETPAY_API_KEY");
    const siteId = Deno.env.get("CINETPAY_SITE_ID");

    if (!apiKey || !siteId) {
      throw new Error("Configuration CinetPay manquante");
    }

    // Vérifier le site ID
    if (cpm_site_id !== siteId) {
      throw new Error("Site ID invalide");
    }

    logStep("Vérification du paiement avec CinetPay");

    // Vérifier le statut du paiement avec CinetPay
    const verifyResponse = await fetch("https://api-checkout.cinetpay.com/v2/payment/check", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        apikey: apiKey,
        site_id: siteId,
        transaction_id: cpm_trans_id,
      }),
    });

    const verifyResult = await verifyResponse.json();
    logStep("Réponse de vérification", verifyResult);

    if (verifyResult.code !== "00") {
      throw new Error(`Vérification échouée: ${verifyResult.message}`);
    }

    // Traiter le paiement selon le statut
    if (verifyResult.data.cpm_result === "00") {
      logStep("Paiement accepté, mise à jour de la vente");

      // Récupérer la vente
      const { data: sale, error: saleError } = await supabase
        .from("script_sales")
        .select("*")
        .eq("transaction_id", cpm_trans_id)
        .single();

      if (saleError || !sale) {
        throw new Error("Vente non trouvée");
      }

      // Mettre à jour le statut de la vente
      const { error: updateError } = await supabase
        .from("script_sales")
        .update({ status: "completed" })
        .eq("id", sale.id);

      if (updateError) {
        throw new Error("Erreur lors de la mise à jour de la vente");
      }

      // Mettre à jour les statistiques du script premium via RPC
      const { error: premiumError } = await supabase.rpc('increment_premium_script_stats', {
        script_id_param: sale.script_id,
        revenue_increment: sale.price_paid
      });

      if (premiumError) {
        logStep("Erreur mise à jour premium script", premiumError);
      }

      // Mettre à jour les gains de l'auteur
      const { error: earningsError } = await supabase.rpc(
        "update_author_earnings",
        { author_id: sale.seller_user_id }
      );

      if (earningsError) {
        logStep("Erreur mise à jour gains", earningsError);
      }

      logStep("Vente complétée avec succès");
    } else {
      logStep("Paiement échoué ou en attente");
      
      // Mettre à jour le statut en cas d'échec
      const { error: failError } = await supabase
        .from("script_sales")
        .update({ status: "failed" })
        .eq("transaction_id", cpm_trans_id);

      if (failError) {
        logStep("Erreur mise à jour échec", failError);
      }
    }

    return new Response(
      JSON.stringify({ status: "success" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error) {
    logStep("Erreur webhook", error instanceof Error ? error.message : 'Erreur inconnue');
    
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erreur inconnue' }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
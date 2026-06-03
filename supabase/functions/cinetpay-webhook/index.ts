
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CINETPAY-WEBHOOK] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Webhook received");

    const cinetpayApiKey = Deno.env.get("CINETPAY_API_KEY");
    const cinetpaySiteId = Deno.env.get("CINETPAY_SITE_ID");
    
    if (!cinetpayApiKey || !cinetpaySiteId) {
      throw new Error("CinetPay credentials not configured");
    }

    const { cpm_trans_id, cpm_site_id, signature, cpm_amount, cpm_currency, cpm_payid } = await req.json();
    
    logStep("Webhook data received", { cpm_trans_id, cpm_site_id, cpm_amount });

    // Vérifier la signature (optionnel mais recommandé)
    if (cpm_site_id !== cinetpaySiteId) {
      throw new Error("Invalid site ID");
    }

    // Vérifier le statut du paiement auprès de CinetPay
    const verifyResponse = await fetch("https://api-checkout.cinetpay.com/v2/payment/check", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        apikey: cinetpayApiKey,
        site_id: cinetpaySiteId,
        transaction_id: cpm_trans_id,
      }),
    });

    const verifyResult = await verifyResponse.json();
    logStep("Payment verification", { code: verifyResult.code, status: verifyResult.data?.status });

    if (verifyResult.code !== "00") {
      throw new Error(`Payment verification failed: ${verifyResult.message}`);
    }

    const paymentStatus = verifyResult.data.status;
    
    if (paymentStatus === "ACCEPTED") {
      // Récupérer la transaction
      const { data: transaction } = await supabaseClient
        .from("payment_transactions")
        .select("*")
        .eq("transaction_id", cpm_trans_id)
        .single();

      if (!transaction) {
        throw new Error("Transaction not found");
      }

      // Mettre à jour le statut de la transaction
      await supabaseClient
        .from("payment_transactions")
        .update({ 
          status: "completed",
          payment_id: cpm_payid,
          completed_at: new Date().toISOString()
        })
        .eq("transaction_id", cpm_trans_id);

      // Mettre à jour l'abonnement de l'utilisateur
      const subscriptionEnd = new Date();
      subscriptionEnd.setMonth(subscriptionEnd.getMonth() + 1); // 1 mois d'abonnement

      await supabaseClient
        .from("profiles")
        .update({
          subscription_type: "premium",
          subscription_end: subscriptionEnd.toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq("id", transaction.user_id);

      logStep("Subscription activated", { userId: transaction.user_id, endDate: subscriptionEnd });
    }

    return new Response(JSON.stringify({ status: "success" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

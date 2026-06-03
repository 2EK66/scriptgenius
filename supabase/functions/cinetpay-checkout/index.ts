
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CINETPAY-CHECKOUT] ${step}${detailsStr}`);
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
    logStep("Function started");

    const cinetpayApiKey = Deno.env.get("CINETPAY_API_KEY");
    const cinetpaySiteId = Deno.env.get("CINETPAY_SITE_ID");
    
    if (!cinetpayApiKey || !cinetpaySiteId) {
      throw new Error("CinetPay credentials not configured");
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    const { plan } = await req.json();
    
    const plans = {
      premium: {
        amount: 3000, // 3000 XOF (environ 5€)
        currency: "XOF",
        description: "Abonnement Premium ScriptGenius (1 mois)",
      }
    };

    const selectedPlan = plans[plan as keyof typeof plans];
    if (!selectedPlan) throw new Error("Plan not found");

    const transactionId = `sg_${user.id}_${Date.now()}`;
    const origin = req.headers.get("origin") || "http://localhost:3000";

    const cinetpayData = {
      apikey: cinetpayApiKey,
      site_id: cinetpaySiteId,
      transaction_id: transactionId,
      amount: selectedPlan.amount,
      currency: selectedPlan.currency,
      description: selectedPlan.description,
      return_url: `${origin}/payment-success`,
      notify_url: `${origin}/functions/v1/cinetpay-webhook`,
      customer_name: user.user_metadata?.full_name || "Utilisateur",
      customer_email: user.email,
      customer_phone_number: user.user_metadata?.phone || "",
      customer_address: user.user_metadata?.address || "",
      customer_city: user.user_metadata?.city || "",
      customer_country: "CI", // Côte d'Ivoire par défaut
      customer_state: user.user_metadata?.state || "",
      customer_zip_code: user.user_metadata?.zip || "",
    };

    logStep("Creating CinetPay payment", { transactionId, amount: selectedPlan.amount });

    const response = await fetch("https://api-checkout.cinetpay.com/v2/payment", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(cinetpayData),
    });

    const result = await response.json();
    logStep("CinetPay API response", { code: result.code, message: result.message });

    if (result.code !== "201") {
      throw new Error(`CinetPay error: ${result.message}`);
    }

    // Enregistrer la transaction en attente
    await supabaseClient.from("payment_transactions").insert({
      user_id: user.id,
      transaction_id: transactionId,
      amount: selectedPlan.amount,
      currency: selectedPlan.currency,
      plan: plan,
      status: "pending",
      provider: "cinetpay",
    });

    return new Response(JSON.stringify({ 
      payment_url: result.data.payment_url,
      transaction_id: transactionId 
    }), {
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

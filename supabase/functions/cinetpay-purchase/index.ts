import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PurchaseRequest {
  scriptId: string;
  price: number;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    // Authentifier l'utilisateur
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data: { user } } = await supabase.auth.getUser(token);

    if (!user) {
      throw new Error("Non authentifié");
    }

    const { scriptId, price }: PurchaseRequest = await req.json();

    // Vérifier que le script existe et est premium
    const { data: premiumScript, error: scriptError } = await supabase
      .from("premium_scripts_view")
      .select("*")
      .eq("script_id", scriptId)
      .single();

    if (scriptError || !premiumScript) {
      throw new Error("Script premium non trouvé");
    }

    // Vérifier que l'utilisateur n'est pas l'auteur
    if (premiumScript.author_id === user.id) {
      throw new Error("Vous ne pouvez pas acheter votre propre œuvre");
    }

    // Vérifier si l'utilisateur a déjà acheté ce script
    const { data: existingSale } = await supabase
      .from("script_sales")
      .select("id")
      .eq("script_id", scriptId)
      .eq("buyer_user_id", user.id)
      .eq("status", "completed")
      .single();

    if (existingSale) {
      throw new Error("Vous avez déjà acheté cette œuvre");
    }

    // Récupérer les clés API CinetPay
    const apiKey = Deno.env.get("CINETPAY_API_KEY");
    const siteId = Deno.env.get("CINETPAY_SITE_ID");

    if (!apiKey || !siteId) {
      throw new Error("Configuration CinetPay manquante");
    }

    // Générer un ID de transaction unique
    const transactionId = `purchase_${scriptId}_${user.id}_${Date.now()}`;

    // Créer la demande de paiement CinetPay
    const cinetpayData = {
      apikey: apiKey,
      site_id: siteId,
      transaction_id: transactionId,
      amount: price / 100, // Convertir de centimes en XOF
      currency: "XOF",
      description: `Achat de l'œuvre: ${premiumScript.title}`,
      return_url: `${req.headers.get("origin")}/payment-success?type=purchase&script_id=${scriptId}`,
      notify_url: `${Deno.env.get("SUPABASE_URL")}/functions/v1/cinetpay-webhook`,
      customer_name: user.user_metadata?.full_name || "Client",
      customer_email: user.email,
      customer_phone_number: user.user_metadata?.phone || "",
      customer_address: "",
      customer_city: "",
      customer_country: "CI",
      customer_state: "",
      customer_zip_code: ""
    };

    // Appeler l'API CinetPay
    const cinetpayResponse = await fetch("https://api-checkout.cinetpay.com/v2/payment", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(cinetpayData),
    });

    const cinetpayResult = await cinetpayResponse.json();

    if (cinetpayResult.code !== "201") {
      throw new Error(`Erreur CinetPay: ${cinetpayResult.message}`);
    }

    // Créer l'enregistrement de vente en attente
    const { error: saleError } = await supabase
      .from("script_sales")
      .insert({
        script_id: scriptId,
        buyer_user_id: user.id,
        seller_user_id: premiumScript.author_id,
        price_paid: price,
        transaction_id: transactionId,
        status: "pending"
      });

    if (saleError) {
      throw new Error("Erreur lors de la création de la vente");
    }

    return new Response(
      JSON.stringify({
        success: true,
        payment_url: cinetpayResult.data.payment_url,
        transaction_id: transactionId,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Une erreur est survenue',
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
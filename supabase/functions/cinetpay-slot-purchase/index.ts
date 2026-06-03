import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabaseClient.auth.getUser(token);

    if (!user) {
      throw new Error('Non authentifié');
    }

    const { slotType, price } = await req.json();

    if (!slotType || !price) {
      throw new Error('Paramètres manquants');
    }

    // Vérifier que l'utilisateur peut acheter
    const { data: existingSlots } = await supabaseClient
      .from('premium_slots')
      .select('*')
      .eq('user_id', user.id)
      .eq('slot_type', slotType)
      .eq('is_active', true)
      .gte('expires_at', new Date().toISOString());

    if (existingSlots && existingSlots.length >= 3) {
      throw new Error('Maximum de 3 places atteintes');
    }

    // Créer la transaction de paiement
    const transactionId = `slot_${slotType}_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    
    const { data: transaction, error: transactionError } = await supabaseClient
      .from('payment_transactions')
      .insert({
        user_id: user.id,
        amount: price,
        currency: 'XOF',
        transaction_id: transactionId,
        plan: `premium_slot_${slotType}`,
        status: 'pending',
        provider: 'cinetpay'
      })
      .select()
      .single();

    if (transactionError) throw transactionError;

    // Appeler l'API CinetPay
    const cinetpayApiKey = Deno.env.get('Sciptgenius');
    const cinetpaySiteId = '5906889';
    
    const cinetpayResponse = await fetch('https://api-checkout.cinetpay.com/v2/payment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        apikey: cinetpayApiKey,
        site_id: cinetpaySiteId,
        transaction_id: transactionId,
        amount: price,
        currency: 'XOF',
        description: `Achat d'une place premium ${slotType === 'script' ? 'Script' : 'BD'} (2 mois)`,
        return_url: `https://jmnmlllwwowvlbpfbmqq.supabase.co/functions/v1/cinetpay-webhook`,
        notify_url: `https://jmnmlllwwowvlbpfbmqq.supabase.co/functions/v1/cinetpay-webhook`,
        metadata: JSON.stringify({
          user_id: user.id,
          type: 'premium_slot',
          slot_type: slotType
        }),
        customer_name: user.email || 'Client',
        customer_surname: user.email || 'Client',
        customer_email: user.email || 'noemail@example.com',
      }),
    });

    const cinetpayData = await cinetpayResponse.json();
    console.log('CinetPay response:', cinetpayData);

    if (cinetpayData.code === '201') {
      await supabaseClient
        .from('payment_transactions')
        .update({ payment_id: cinetpayData.data.payment_token })
        .eq('id', transaction.id);

      return new Response(
        JSON.stringify({
          success: true,
          payment_url: cinetpayData.data.payment_url,
          transaction_id: transactionId
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      throw new Error(cinetpayData.message || 'Erreur CinetPay');
    }

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

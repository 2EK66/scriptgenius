
import { supabase } from '@/integrations/supabase/client';

export interface CreatePaymentRequest {
  plan: 'premium';
}

export interface CreatePaymentResponse {
  success: boolean;
  payment_url?: string;
  transaction_id?: string;
  error?: string;
}

export interface PurchaseRequest {
  scriptId: string;
  price: number;
}

export interface PurchaseResponse {
  success: boolean;
  payment_url?: string;
  transaction_id?: string;
  error?: string;
}

export const createCinetPayPayment = async (request: CreatePaymentRequest): Promise<CreatePaymentResponse> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('User not authenticated');
    }

    const response = await fetch('/functions/v1/cinetpay-checkout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(request),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to create payment');
    }

    return {
      success: true,
      payment_url: data.payment_url,
      transaction_id: data.transaction_id,
    };
  } catch (error) {
    console.error('CinetPay payment creation error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred'
    };
  }
};

export const createScriptPurchase = async (request: PurchaseRequest): Promise<PurchaseResponse> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase.functions.invoke('cinetpay-purchase', {
      body: request,
    });

    if (error) throw error;

    return data;
  } catch (error) {
    console.error('CinetPay purchase error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred'
    };
  }
};

export const checkPaymentStatus = async (transactionId: string) => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('payment_transactions')
      .select('*')
      .eq('transaction_id', transactionId)
      .single();

    if (error) throw error;

    return data;
  } catch (error) {
    console.error('Payment status check error:', error);
    throw error;
  }
};

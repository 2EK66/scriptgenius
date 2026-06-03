-- Fix critical security issue: manage_transactions policy allows all users to access all transactions
-- Drop the insecure policy and create proper restrictive policies

DROP POLICY IF EXISTS "manage_transactions" ON public.payment_transactions;

-- Create proper policies for payment_transactions
-- Users can only insert their own transactions
CREATE POLICY "Users can insert own transactions"
ON public.payment_transactions
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can only update their own transactions
CREATE POLICY "Users can update own transactions"
ON public.payment_transactions
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Service role can manage all transactions (for webhooks)
-- This is handled by service role key, not RLS
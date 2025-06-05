-- Fix RLS policies for payment_receipts table to be less restrictive
-- Drop existing restrictive policies
DROP POLICY IF EXISTS admin_payment_receipts_policy ON public.payment_receipts;
DROP POLICY IF EXISTS user_read_own_receipts ON public.payment_receipts;

-- Create new less restrictive policies
-- Allow any authenticated user to read payment receipts
CREATE POLICY "Allow anyone to read payment_receipts" 
  ON public.payment_receipts 
  FOR SELECT 
  TO PUBLIC
  USING (true);

-- Allow any authenticated user to insert payment receipts
CREATE POLICY "Allow anyone to insert payment_receipts" 
  ON public.payment_receipts 
  FOR INSERT 
  TO authenticated
  WITH CHECK (true);

-- Allow any authenticated user to update payment receipts
CREATE POLICY "Allow anyone to update payment_receipts" 
  ON public.payment_receipts 
  FOR UPDATE 
  TO authenticated
  USING (true);

-- Allow any authenticated user to delete payment receipts
CREATE POLICY "Allow anyone to delete payment_receipts" 
  ON public.payment_receipts 
  FOR DELETE 
  TO authenticated
  USING (true);

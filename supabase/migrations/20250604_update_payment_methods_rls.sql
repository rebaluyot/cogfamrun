-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Allow admin to insert payment_methods" ON public.payment_methods;
DROP POLICY IF EXISTS "Allow admin to update payment_methods" ON public.payment_methods;
DROP POLICY IF EXISTS "Allow admin to delete payment_methods" ON public.payment_methods;

-- Create new less restrictive policies for our simple auth system
CREATE POLICY "Allow insert payment_methods" 
  ON public.payment_methods 
  FOR INSERT 
  TO authenticated 
  USING (true);

CREATE POLICY "Allow update payment_methods" 
  ON public.payment_methods 
  FOR UPDATE 
  TO authenticated 
  USING (true);

CREATE POLICY "Allow delete payment_methods" 
  ON public.payment_methods 
  FOR DELETE 
  TO authenticated 
  USING (true);

-- Update storage policies to be less restrictive as well
DROP POLICY IF EXISTS "Allow authenticated users to upload to payment-qr-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to update payment-qr-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to delete payment-qr-images" ON storage.objects;

CREATE POLICY "Allow upload to payment-qr-images" 
  ON storage.objects 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (bucket_id = 'payment-qr-images');

CREATE POLICY "Allow update payment-qr-images" 
  ON storage.objects 
  FOR UPDATE 
  TO authenticated 
  USING (bucket_id = 'payment-qr-images');

CREATE POLICY "Allow delete payment-qr-images" 
  ON storage.objects 
  FOR DELETE 
  TO authenticated 
  USING (bucket_id = 'payment-qr-images');

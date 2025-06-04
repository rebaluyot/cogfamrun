-- Drop existing policies that depend on admin_access claim in JWT token
DROP POLICY IF EXISTS "Allow admin to insert payment_methods" ON public.payment_methods;
DROP POLICY IF EXISTS "Allow admin to update payment_methods" ON public.payment_methods;
DROP POLICY IF EXISTS "Allow admin to delete payment_methods" ON public.payment_methods;

-- Create new policies for our custom authentication system
CREATE POLICY "Allow anyone to insert payment_methods" 
  ON public.payment_methods 
  FOR INSERT 
  TO PUBLIC
  USING (true);

CREATE POLICY "Allow anyone to update payment_methods" 
  ON public.payment_methods 
  FOR UPDATE 
  TO PUBLIC
  USING (true);

CREATE POLICY "Allow anyone to delete payment_methods" 
  ON public.payment_methods 
  FOR DELETE 
  TO PUBLIC
  USING (true);

-- Update storage policies to be less restrictive
DROP POLICY IF EXISTS "Allow authenticated users to upload to payment-qr-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to update payment-qr-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to delete payment-qr-images" ON storage.objects;

CREATE POLICY "Allow anyone to upload to payment-qr-images" 
  ON storage.objects 
  FOR INSERT 
  TO PUBLIC
  WITH CHECK (bucket_id = 'payment-qr-images');

CREATE POLICY "Allow anyone to update payment-qr-images" 
  ON storage.objects 
  FOR UPDATE 
  TO PUBLIC
  USING (bucket_id = 'payment-qr-images');

CREATE POLICY "Allow anyone to delete payment-qr-images" 
  ON storage.objects 
  FOR DELETE 
  TO PUBLIC
  USING (bucket_id = 'payment-qr-images');

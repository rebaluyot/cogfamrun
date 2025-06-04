-- Create payment_methods table
CREATE TABLE IF NOT EXISTS public.payment_methods (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  account_number TEXT NOT NULL,
  qr_image_url TEXT,
  account_type TEXT NOT NULL DEFAULT 'gcash',
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- Add example payment methods
INSERT INTO public.payment_methods (name, account_number, qr_image_url, account_type) VALUES
('COG FamRun Official', '0999888888', '/assets/qr-famrun.jpeg', 'gcash'),
('COG Events', '0918-234-5678', '/assets/qr-famrun.jpeg', 'gcash'),
('COG Sports Ministry', '0919-345-6789', '/assets/qr-famrun.jpeg', 'gcash')
ON CONFLICT DO NOTHING;

-- Create RLS policies for payment_methods
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read payment methods
CREATE POLICY "Allow public read access to payment_methods" 
  ON public.payment_methods 
  FOR SELECT 
  USING (true);

-- Allow only authenticated users with admin role to modify payment methods
CREATE POLICY "Allow admin to insert payment_methods" 
  ON public.payment_methods 
  FOR INSERT 
  TO authenticated 
  USING (auth.jwt() ? 'admin_access');

CREATE POLICY "Allow admin to update payment_methods" 
  ON public.payment_methods 
  FOR UPDATE 
  TO authenticated 
  USING (auth.jwt() ? 'admin_access');

CREATE POLICY "Allow admin to delete payment_methods" 
  ON public.payment_methods 
  FOR DELETE 
  TO authenticated 
  USING (auth.jwt() ? 'admin_access');

-- Create storage bucket for QR images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('payment-qr-images', 'payment-qr-images', true)
ON CONFLICT DO NOTHING;

-- Set up storage policies for QR images
CREATE POLICY "Allow public access to payment-qr-images" 
  ON storage.objects 
  FOR SELECT 
  TO public 
  USING (bucket_id = 'payment-qr-images');

CREATE POLICY "Allow authenticated users to upload to payment-qr-images" 
  ON storage.objects 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (bucket_id = 'payment-qr-images' AND auth.jwt() ? 'admin_access');

CREATE POLICY "Allow authenticated users to update payment-qr-images" 
  ON storage.objects 
  FOR UPDATE 
  TO authenticated 
  USING (bucket_id = 'payment-qr-images' AND auth.jwt() ? 'admin_access');

CREATE POLICY "Allow authenticated users to delete payment-qr-images" 
  ON storage.objects 
  FOR DELETE 
  TO authenticated 
  USING (bucket_id = 'payment-qr-images' AND auth.jwt() ? 'admin_access');

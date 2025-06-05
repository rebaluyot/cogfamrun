-- Create system_settings table to store global application settings
CREATE TABLE IF NOT EXISTS public.system_settings (
  id SERIAL PRIMARY KEY,
  setting_key TEXT NOT NULL UNIQUE,
  setting_value TEXT,
  description TEXT,
  is_secret BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read non-secret settings
CREATE POLICY "Allow public read access to non-secret system_settings" 
  ON public.system_settings 
  FOR SELECT 
  USING (NOT is_secret);

-- Allow authenticated users to read secret settings
CREATE POLICY "Allow authenticated read access to all system_settings" 
  ON public.system_settings 
  FOR SELECT 
  TO authenticated
  USING (true);

-- Allow authenticated users to manage system settings
CREATE POLICY "Allow authenticated to manage system_settings" 
  ON public.system_settings 
  FOR ALL
  TO authenticated 
  USING (true)
  WITH CHECK (true);

-- Add indexes for better performance
CREATE INDEX idx_system_settings_key ON public.system_settings(setting_key);

-- Add comment
COMMENT ON TABLE public.system_settings IS 'Stores global application settings like API keys, email settings, etc.';

-- Insert initial EmailJS settings
INSERT INTO public.system_settings (setting_key, setting_value, description, is_secret) VALUES
('emailjs_service_id', 'service_i6px4qb', 'EmailJS Service ID', false),
('emailjs_template_id', 'template_1zf9bgr', 'EmailJS Template ID for QR code emails', false),
('emailjs_public_key', 'vc8LzDacZcreqI6fN', 'EmailJS Public Key', true),
('emailjs_private_key', '', 'EmailJS Private Key (if needed)', true)
ON CONFLICT (setting_key) DO NOTHING;

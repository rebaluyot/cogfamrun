-- This migration adds kit distribution related fields to the registrations table
ALTER TABLE public.registrations 
  ADD COLUMN kit_claimed BOOLEAN DEFAULT false,
  ADD COLUMN claimed_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN claimed_by TEXT,
  ADD COLUMN claim_notes TEXT;

-- Create RLS policies for kit distribution
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;

-- Only authenticated users can update kit claim status
CREATE POLICY "Allow authenticated users to update kit claim status" 
ON public.registrations 
FOR UPDATE 
USING (auth.role() = 'authenticated') 
WITH CHECK (auth.role() = 'authenticated');

-- Create view for kit distribution monitoring
CREATE OR REPLACE VIEW public.kit_distribution_view AS
SELECT 
  id,
  registration_id,
  first_name,
  last_name,
  email,
  category,
  shirt_size,
  kit_claimed,
  claimed_at,
  claimed_by,
  claim_notes,
  created_at,
  status
FROM public.registrations;

-- Grant permissions
GRANT SELECT ON public.kit_distribution_view TO anon, authenticated, service_role;

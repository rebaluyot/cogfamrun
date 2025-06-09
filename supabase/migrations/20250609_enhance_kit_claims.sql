-- Add claim locations table and enhance registration claim tracking
-- Filename: 20250609_enhance_kit_claims.sql

-- Create claim_locations table
CREATE TABLE IF NOT EXISTS public.claim_locations (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert some default claim locations
INSERT INTO public.claim_locations (name, address) 
VALUES 
  ('Main Event Venue', 'COG Main Church, Manila'),
  ('North Satellite Office', 'COG North Campus'),
  ('South Satellite Office', 'COG South Campus'),
  ('Registration Booth', 'COG Community Center')
ON CONFLICT (id) DO NOTHING;

-- Add claim_location_id column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT column_name
    FROM information_schema.columns
    WHERE table_name = 'registrations'
    AND column_name = 'claim_location_id'
  ) THEN
    ALTER TABLE registrations
    ADD COLUMN claim_location_id INTEGER REFERENCES claim_locations(id);
  END IF;
END $$;

-- Add actual_claimer column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT column_name
    FROM information_schema.columns
    WHERE table_name = 'registrations'
    AND column_name = 'actual_claimer'
  ) THEN
    ALTER TABLE registrations
    ADD COLUMN actual_claimer TEXT;
  END IF;
END $$;

-- Rename claimed_by to processed_by to clarify it's the staff member
DO $$
BEGIN
  IF EXISTS (
    SELECT column_name
    FROM information_schema.columns
    WHERE table_name = 'registrations'
    AND column_name = 'claimed_by'
  ) AND NOT EXISTS (
    SELECT column_name
    FROM information_schema.columns
    WHERE table_name = 'registrations'
    AND column_name = 'processed_by'
  ) THEN
    ALTER TABLE registrations
    RENAME COLUMN claimed_by TO processed_by;
  END IF;
END $$;

-- Create RLS policies for claim_locations
CREATE POLICY "Allow anyone to read claim_locations" 
  ON public.claim_locations 
  FOR SELECT 
  TO PUBLIC
  USING (true);

CREATE POLICY "Allow anyone to manage claim_locations" 
  ON public.claim_locations 
  USING (true);

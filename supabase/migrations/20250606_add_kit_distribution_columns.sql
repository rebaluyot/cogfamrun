-- Add kit distribution columns to registrations table
-- Filename: 20250606_add_kit_distribution_columns.sql

-- Check if kit_claimed column exists
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'registrations'
AND column_name = 'kit_claimed';

-- Add kit_claimed column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT column_name
    FROM information_schema.columns
    WHERE table_name = 'registrations'
    AND column_name = 'kit_claimed'
  ) THEN
    ALTER TABLE registrations
    ADD COLUMN kit_claimed BOOLEAN DEFAULT FALSE;
  END IF;
END $$;

-- Check if claimed_at column exists
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'registrations'
AND column_name = 'claimed_at';

-- Add claimed_at column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT column_name
    FROM information_schema.columns
    WHERE table_name = 'registrations'
    AND column_name = 'claimed_at'
  ) THEN
    ALTER TABLE registrations
    ADD COLUMN claimed_at TIMESTAMPTZ;
  END IF;
END $$;

-- Check if claimed_by column exists
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'registrations'
AND column_name = 'claimed_by';

-- Add claimed_by column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT column_name
    FROM information_schema.columns
    WHERE table_name = 'registrations'
    AND column_name = 'claimed_by'
  ) THEN
    ALTER TABLE registrations
    ADD COLUMN claimed_by TEXT;
  END IF;
END $$;

-- Check if claim_notes column exists
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'registrations'
AND column_name = 'claim_notes';

-- Add claim_notes column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT column_name
    FROM information_schema.columns
    WHERE table_name = 'registrations'
    AND column_name = 'claim_notes'
  ) THEN
    ALTER TABLE registrations
    ADD COLUMN claim_notes TEXT;
  END IF;
END $$;

-- Update RLS policies to allow kit distribution updates
CREATE OR REPLACE FUNCTION update_kit_claim_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Allow staff to update kit claim fields
  IF OLD.id = NEW.id AND 
     (OLD.kit_claimed IS DISTINCT FROM NEW.kit_claimed OR 
      OLD.claimed_at IS DISTINCT FROM NEW.claimed_at OR
      OLD.claimed_by IS DISTINCT FROM NEW.claimed_by OR
      OLD.claim_notes IS DISTINCT FROM NEW.claim_notes) THEN
    RETURN NEW;
  END IF;
  
  -- For other fields, only allow if user is admin
  IF auth.uid() IN (SELECT id FROM admin_users) THEN
    RETURN NEW;
  END IF;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

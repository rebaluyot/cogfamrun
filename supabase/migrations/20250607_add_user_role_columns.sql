-- Add user role columns to the admin_users table
-- Filename: 20250607_add_user_role_columns.sql

-- Check if is_admin column exists
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'admin_users'
AND column_name = 'is_admin';

-- Add is_admin column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT column_name
    FROM information_schema.columns
    WHERE table_name = 'admin_users'
    AND column_name = 'is_admin'
  ) THEN
    ALTER TABLE admin_users
    ADD COLUMN is_admin BOOLEAN DEFAULT TRUE;
  END IF;
END $$;

-- Check if can_distribute_kits column exists
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'admin_users'
AND column_name = 'can_distribute_kits';

-- Add can_distribute_kits column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT column_name
    FROM information_schema.columns
    WHERE table_name = 'admin_users'
    AND column_name = 'can_distribute_kits'
  ) THEN
    ALTER TABLE admin_users
    ADD COLUMN can_distribute_kits BOOLEAN DEFAULT FALSE;
  END IF;
END $$;

-- Update existing admin users to have both permissions
UPDATE admin_users
SET is_admin = TRUE, can_distribute_kits = TRUE
WHERE is_admin IS NULL;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_admin_users_permissions ON admin_users (is_admin, can_distribute_kits);

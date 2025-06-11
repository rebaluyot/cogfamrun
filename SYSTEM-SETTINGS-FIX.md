# Fix for System Settings Table

This guide provides steps to fix the issue with the `system_settings` table in your FamRun application.

## Issue Description

The application code expects a `setting_type` column in the `system_settings` table, but this column doesn't exist in the current database schema, causing errors when saving settings.

## How to Fix

Follow these steps to add the missing column:

### Option 1: Using Supabase SQL Editor

1. Navigate to your Supabase project in the browser
2. Go to the "SQL Editor" section
3. Create a new SQL query
4. Paste the following SQL into the editor:

```sql
-- Add the missing setting_type column to system_settings table
ALTER TABLE IF EXISTS public.system_settings 
ADD COLUMN IF NOT EXISTS setting_type TEXT DEFAULT 'string';

-- Update existing records to have a setting_type
-- For numeric values
UPDATE public.system_settings
SET setting_type = 'number'
WHERE setting_value ~ '^[0-9]+(\.[0-9]+)?$' AND setting_type IS NULL;

-- For boolean values
UPDATE public.system_settings
SET setting_type = 'boolean'
WHERE setting_value IN ('true', 'false') AND setting_type IS NULL;

-- For date values (simplistic check)
UPDATE public.system_settings
SET setting_type = 'datetime'
WHERE setting_value ~ '^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}' AND setting_type IS NULL;

-- All others as string
UPDATE public.system_settings
SET setting_type = 'string'
WHERE setting_type IS NULL;

-- Add comment to explain the column
COMMENT ON COLUMN public.system_settings.setting_type IS 'Data type of the setting (string, number, boolean, datetime, json)';
```

5. Run the SQL query by clicking the "Run" button

### Option 2: Using the Supabase CLI

If you have the Supabase CLI installed and configured:

```bash
supabase db execute --file ./supabase/migrations/20250611_update_system_settings.sql
```

## Explanation

The issue occurs because there's a discrepancy between:
1. The database schema defined in the migration files
2. The schema expected by the application code

The code expects a `setting_type` column to store information about what type of data each setting contains (string, number, boolean, etc.). This column exists in the setup script but was missing from the original migration.

## Code Updates

As a fallback, the application code has been updated to work even if the column doesn't exist. This makes the application more robust by:

- First attempting to use the `setting_type` column
- If that fails, falling back to a version without the column
- Logging clear messages about which approach is being used

This ensures your application will work correctly regardless of whether you apply the database migration or not.

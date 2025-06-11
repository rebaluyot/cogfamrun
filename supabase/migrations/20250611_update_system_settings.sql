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

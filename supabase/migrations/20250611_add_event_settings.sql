-- Migration: Add event settings types to database
-- This migration adds support for JSON structured data for event categories, routes, and inclusions

-- First, ensure we have setting_type column (added in a previous migration)
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'system_settings' 
        AND column_name = 'setting_type'
    ) THEN
        ALTER TABLE public.system_settings ADD COLUMN setting_type TEXT DEFAULT 'string';
    END IF;
END $$;

-- Add comments for the new setting types
COMMENT ON COLUMN public.system_settings.setting_type IS 'Data type of the setting (string, number, boolean, datetime, json)';

-- Insert default settings for event types if they don't exist
INSERT INTO public.system_settings (setting_key, setting_value, setting_type, description, is_secret) 
VALUES 
('event_type', 'Event Registration System', 'string', 'The type of event being organized', false),
('event_description', 'Join us for our annual event with exciting activities and prizes!', 'string', 'Description of the event', false),
('event_banner_url', '/assets/routes.png', 'string', 'URL to event banner image', false)
ON CONFLICT (setting_key) DO NOTHING;

-- Insert default JSON structures for categories, routes, and inclusions
INSERT INTO public.system_settings (setting_key, setting_value, setting_type, description, is_secret)
VALUES
('event_categories', '[{"id":"category1","name":"Standard","description":"Standard event registration","price":500}]', 'json', 'Event registration categories', false),
('event_routes', '[{"id":"route1","name":"3K Run","description":"Beginner-friendly 3 kilometer route","distance":"3K","difficulty":"Easy"}]', 'json', 'Event routes information', false),
('event_inclusions', '[{"id":"inclusion1","name":"Event T-Shirt","description":"High-quality event t-shirt with logo"}]', 'json', 'Items included with registration', false)
ON CONFLICT (setting_key) DO NOTHING;

-- Add a function to validate JSON format of certain settings
CREATE OR REPLACE FUNCTION validate_setting_json()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.setting_type = 'json' THEN
        -- Make sure the value is valid JSON
        IF NEW.setting_value IS NOT NULL THEN
            PERFORM NEW.setting_value::json;
        END IF;
    END IF;
    RETURN NEW;
EXCEPTION WHEN others THEN
    RAISE EXCEPTION 'Invalid JSON format for %', NEW.setting_key;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to validate JSON settings
DROP TRIGGER IF EXISTS validate_json_setting ON public.system_settings;
CREATE TRIGGER validate_json_setting
BEFORE INSERT OR UPDATE ON public.system_settings
FOR EACH ROW
WHEN (NEW.setting_type = 'json')
EXECUTE FUNCTION validate_setting_json();

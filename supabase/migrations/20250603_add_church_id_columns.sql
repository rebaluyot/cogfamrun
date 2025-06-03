-- Migration: Add department_id, ministry_id, and cluster_id columns to registrations table
-- This allows us to store both the name and ID for better querying and relationships

-- Add department_id column if it doesn't exist
ALTER TABLE public.registrations 
ADD COLUMN IF NOT EXISTS department_id text;

-- Add ministry_id column if it doesn't exist
ALTER TABLE public.registrations 
ADD COLUMN IF NOT EXISTS ministry_id text;

-- Add cluster_id column if it doesn't exist
ALTER TABLE public.registrations 
ADD COLUMN IF NOT EXISTS cluster_id text;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_registrations_department_id ON public.registrations (department_id);
CREATE INDEX IF NOT EXISTS idx_registrations_ministry_id ON public.registrations (ministry_id);
CREATE INDEX IF NOT EXISTS idx_registrations_cluster_id ON public.registrations (cluster_id);

-- Comment on columns for documentation
COMMENT ON COLUMN public.registrations.department_id IS 'Reference to department ID';
COMMENT ON COLUMN public.registrations.ministry_id IS 'Reference to ministry ID';
COMMENT ON COLUMN public.registrations.cluster_id IS 'Reference to cluster ID';

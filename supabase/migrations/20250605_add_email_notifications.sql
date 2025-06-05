-- filepath: /Users/robertbaluyot/Desktop/famrun-main/supabase/migrations/20250605_add_email_notifications.sql
-- Create email notifications table
CREATE TABLE IF NOT EXISTS public.email_notifications (
  id SERIAL PRIMARY KEY,
  email TEXT NOT NULL,
  recipient_name TEXT,
  registration_id TEXT,
  email_type TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE public.email_notifications ENABLE ROW LEVEL SECURITY;

-- Only admins can view all email notifications
CREATE POLICY "Allow authenticated users to view their own email notifications" ON public.email_notifications
  FOR SELECT
  USING (
    auth.role() = 'authenticated' AND 
    email = auth.email()
  );

-- Only admins can insert/update/delete email notifications
CREATE POLICY "Only admins can insert email notifications" ON public.email_notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.jwt() ->> 'app_metadata' ? 'is_admin'
  );

CREATE POLICY "Only admins can update email notifications" ON public.email_notifications
  FOR UPDATE
  TO authenticated
  USING (
    auth.jwt() ->> 'app_metadata' ? 'is_admin'
  );

-- Create index on email and registration_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_email_notifications_email ON public.email_notifications (email);
CREATE INDEX IF NOT EXISTS idx_email_notifications_registration_id ON public.email_notifications (registration_id);

-- Add comment to explain table
COMMENT ON TABLE public.email_notifications IS 'Stores email notifications sent to users';

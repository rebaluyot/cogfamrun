-- Add payment tracking columns to registrations table
ALTER TABLE public.registrations 
ADD COLUMN IF NOT EXISTS payment_reference_number TEXT,
ADD COLUMN IF NOT EXISTS payment_method_id INTEGER,
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS payment_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS payment_confirmed_by TEXT,
ADD COLUMN IF NOT EXISTS payment_notes TEXT;

-- Add comment to explain columns
COMMENT ON COLUMN public.registrations.payment_reference_number IS 'Reference or transaction number for the payment';
COMMENT ON COLUMN public.registrations.payment_method_id IS 'Foreign key to payment_methods table';
COMMENT ON COLUMN public.registrations.payment_status IS 'Status of payment (pending, confirmed, rejected, etc.)';
COMMENT ON COLUMN public.registrations.payment_date IS 'Date when payment was made';
COMMENT ON COLUMN public.registrations.payment_confirmed_by IS 'Admin who confirmed the payment';
COMMENT ON COLUMN public.registrations.payment_notes IS 'Additional notes about the payment';

-- Create index on payment_method_id for better query performance
CREATE INDEX IF NOT EXISTS idx_registrations_payment_method_id ON public.registrations (payment_method_id);

-- Create index on payment_status for faster filtering
CREATE INDEX IF NOT EXISTS idx_registrations_payment_status ON public.registrations (payment_status);

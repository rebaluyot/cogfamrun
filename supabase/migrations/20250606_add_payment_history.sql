-- Payment history table to track changes in payment status
CREATE TABLE IF NOT EXISTS public.payment_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  registration_id UUID NOT NULL,
  payment_status TEXT NOT NULL,
  previous_status TEXT,
  changed_by TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Foreign key reference to registrations
  CONSTRAINT fk_payment_history_registration FOREIGN KEY (registration_id) 
  REFERENCES public.registrations(id) ON DELETE CASCADE
);

-- Add RLS policies for payment_history
ALTER TABLE public.payment_history ENABLE ROW LEVEL SECURITY;

-- Create policy: Admins can read and write payment history
CREATE POLICY admin_payment_history_policy ON payment_history
  USING (auth.jwt() ->> 'role' = 'admin')
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- Add index on registration_id for faster querying
CREATE INDEX idx_payment_history_registration_id ON payment_history(registration_id);
CREATE INDEX idx_payment_history_created_at ON payment_history(created_at);

-- Create table for payment receipts
CREATE TABLE IF NOT EXISTS public.payment_receipts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  registration_id UUID NOT NULL UNIQUE,
  receipt_number TEXT NOT NULL UNIQUE,
  receipt_url TEXT,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  generated_by TEXT,
  
  -- Foreign key reference to registrations
  CONSTRAINT fk_payment_receipt_registration FOREIGN KEY (registration_id) 
  REFERENCES public.registrations(id) ON DELETE CASCADE
);

-- Add RLS policies for payment_receipts
ALTER TABLE public.payment_receipts ENABLE ROW LEVEL SECURITY;

-- Create policy: Admins can read and write payment receipts
CREATE POLICY admin_payment_receipts_policy ON payment_receipts
  USING (auth.jwt() ->> 'role' = 'admin')
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- Create policy: Users can read their own payment receipts
CREATE POLICY user_read_own_receipts ON payment_receipts
  FOR SELECT USING (
    registration_id IN (
      SELECT id FROM registrations 
      WHERE user_id = auth.uid()
    )
  );

-- Add index for faster receipt lookup
CREATE INDEX idx_payment_receipts_registration_id ON payment_receipts(registration_id);
CREATE INDEX idx_payment_receipts_receipt_number ON payment_receipts(receipt_number);

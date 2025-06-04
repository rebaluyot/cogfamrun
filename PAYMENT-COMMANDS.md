# Payment System Command Reference

This reference sheet lists all available commands for working with the COG FamRun Payment System.

## Setup Commands

| Command | Description |
|---------|-------------|
| `npm run payment:setup` | Run the complete setup process for the payment system |
| `npm run payment:fix-storage` | Fix storage bucket configuration issues |

## Testing Commands

| Command | Description |
|---------|-------------|
| `npm run payment:test` | Run end-to-end tests for the payment system |
| `npm run payment:diagnose` | Diagnose issues with the payment system configuration |

## Raw Script Commands

| Command | Description |
|---------|-------------|
| `node scripts/setup-payment-system.mjs` | Run the setup script directly |
| `node scripts/payment-system-diagnostic.mjs` | Run the diagnostic script directly |
| `node scripts/e2e-payment-test.mjs` | Run the end-to-end test script directly |
| `node scripts/fix-payment-storage.mjs` | Run the storage bucket fix script directly |

## Database SQL Commands

These commands need to be executed in the Supabase SQL Editor:

### Create Payment Methods Table
```sql
-- Create payment_methods table
CREATE TABLE IF NOT EXISTS public.payment_methods (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  account_number TEXT NOT NULL,
  qr_image_url TEXT,
  account_type TEXT NOT NULL DEFAULT 'gcash',
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### Fix RLS Policies
```sql
-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Allow admin to insert payment_methods" ON public.payment_methods;
DROP POLICY IF EXISTS "Allow admin to update payment_methods" ON public.payment_methods;
DROP POLICY IF EXISTS "Allow admin to delete payment_methods" ON public.payment_methods;

-- Create new less restrictive policies
CREATE POLICY "Allow anyone to insert payment_methods" 
  ON public.payment_methods 
  FOR INSERT 
  TO PUBLIC
  USING (true);

CREATE POLICY "Allow anyone to update payment_methods" 
  ON public.payment_methods 
  FOR UPDATE 
  TO PUBLIC
  USING (true);

CREATE POLICY "Allow anyone to delete payment_methods" 
  ON public.payment_methods 
  FOR DELETE 
  TO PUBLIC
  USING (true);
```

### Create Storage Bucket
```sql
-- Create storage bucket for QR images if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'payment-qr-images',
  'payment-qr-images',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/jpg']::text[]
)
ON CONFLICT (id) DO UPDATE
SET 
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/jpg']::text[];
```

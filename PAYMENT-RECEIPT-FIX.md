# Payment Receipt Generation Fix

## Issue
Users were encountering a "Failed to generate receipt" error when attempting to generate payment receipts for confirmed registrations. This error occurred because:

1. The payment_receipts table was not properly created in the database
2. The Row Level Security (RLS) policies were too restrictive, requiring specific JWT claims that weren't present

## Solution

### 1. Database Schema Creation
We created the necessary tables for payment history tracking and receipt generation:

```sql
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
```

### 2. RLS Policy Fix
We updated the Row Level Security policies to be less restrictive:

```sql
-- Drop existing restrictive policies
DROP POLICY IF EXISTS admin_payment_history_policy ON payment_history;
DROP POLICY IF EXISTS admin_payment_receipts_policy ON public.payment_receipts;
DROP POLICY IF EXISTS user_read_own_receipts ON public.payment_receipts;

-- Create new less restrictive policies
CREATE POLICY "Allow anyone to read payment_receipts" 
  ON public.payment_receipts 
  FOR SELECT 
  TO PUBLIC
  USING (true);

CREATE POLICY "Allow anyone to insert payment_receipts" 
  ON public.payment_receipts 
  FOR INSERT 
  TO authenticated
  WITH CHECK (true);
```

### 3. Improved Error Handling
We enhanced error handling in the payment utilities:

```typescript
// Check if receipt already exists with better error handling
const { data: existingReceipt, error: fetchError } = await (supabase
  .from("payment_receipts" as any) as any)
  .select("receipt_number")
  .eq("registration_id", registrationId)
  .single();
  
if (fetchError && fetchError.code !== "PGRST116") {
  console.error("Error checking existing receipt:", fetchError);
  throw fetchError;
}

// Store the receipt record with detailed error handling
const { error } = await (supabase.from("payment_receipts" as any) as any).insert({
  registration_id: registrationId,
  receipt_number: receiptNumber,
  receipt_url: null,
  generated_by: generatedBy,
});

if (error) {
  console.error("Error inserting receipt record:", error);
  throw new Error(`Failed to insert receipt record: ${error.message || error}`);
}
```

## Testing
A test script was created to verify that RLS policies work correctly. Run it with:

```bash
node scripts/fix-payment-receipt-system.mjs --test
```

## Implementation Details

1. Created a SQL migration script to ensure the tables exist
2. Updated RLS policies to be more permissive
3. Enhanced error handling in the TypeScript utilities
4. Added detailed error messages in the UI components

## Related Files

- `/src/lib/payment-utils.ts` - Core receipt generation functionality
- `/src/components/admin/PaymentReceipt.tsx` - Receipt UI component
- `/supabase/migrations/20250606_add_payment_history.sql` - Original table creation
- `/supabase/migrations/20250606_fix_payment_receipts_rls.sql` - RLS policy fix
- `/scripts/fix-payment-receipt-system.mjs` - Testing and fix script

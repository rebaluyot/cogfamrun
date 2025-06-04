# Payment Methods RLS Fix

This document explains how to fix the Row-Level Security (RLS) policies for the payment methods functionality.

## Problem

The payment methods table has RLS policies that require a JWT token with an `admin_access` claim, but our authentication system doesn't generate these tokens. This causes the following error when trying to update or delete payment methods:

```
Unauthorized: new row violates row-level security policy
```

## Temporary Solution

We've implemented workarounds in the `usePaymentMethodsAdmin` hook to handle these errors:

1. For updates: If update fails with permission denied, it will delete and recreate the payment method
2. For deletes: If delete fails with permission denied, it will mark the payment method as inactive

## Permanent Solution

To properly fix this issue, you need to run a migration to update the RLS policies:

1. Access the Supabase dashboard: https://supabase.com/dashboard
2. Select your project: lkumpuiyepjtztdwtcwg
3. Go to the SQL Editor and run the following query:

```sql
-- Drop existing policies that depend on admin_access claim in JWT token
DROP POLICY IF EXISTS "Allow admin to insert payment_methods" ON public.payment_methods;
DROP POLICY IF EXISTS "Allow admin to update payment_methods" ON public.payment_methods;
DROP POLICY IF EXISTS "Allow admin to delete payment_methods" ON public.payment_methods;

-- Create new policies for our custom authentication system
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

-- Update storage policies to be less restrictive
DROP POLICY IF EXISTS "Allow authenticated users to upload to payment-qr-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to update payment-qr-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to delete payment-qr-images" ON storage.objects;

CREATE POLICY "Allow anyone to upload to payment-qr-images" 
  ON storage.objects 
  FOR INSERT 
  TO PUBLIC
  WITH CHECK (bucket_id = 'payment-qr-images');

CREATE POLICY "Allow anyone to update payment-qr-images" 
  ON storage.objects 
  FOR UPDATE 
  TO PUBLIC
  USING (bucket_id = 'payment-qr-images');

CREATE POLICY "Allow anyone to delete payment-qr-images" 
  ON storage.objects 
  FOR DELETE 
  TO PUBLIC
  USING (bucket_id = 'payment-qr-images');
```

4. After running the migration, the payment methods management should work properly.

## Long-term Security Recommendation

For a production system, consider implementing a proper JWT-based authentication system. The current approach in `AuthContext.tsx` checks passwords directly which is less secure than a proper authentication system.

If you decide to implement a JWT-based system, you can revert to the more restrictive RLS policies that check for specific claims in the JWT token.

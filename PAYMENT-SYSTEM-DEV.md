# Payment System Developer Guide

This guide provides technical information for developers working on the COG FamRun payment system.

## Architecture Overview

The payment system consists of the following components:

### 1. Database Layer
- Table structure: `public.payment_methods`
- Storage: `payment-qr-images` bucket for QR code storage
- Security: Row-level security (RLS) policies for access control

### 2. Backend Services
- Supabase client for database operations
- Storage service for QR code image management
- Row-level security policies for access control

### 3. React Components
- Admin interface: `PaymentMethodManagement.tsx`
- User-facing component: `PaymentMethod.tsx`
- Troubleshooting: `QRImageTester.tsx`

### 4. React Hooks
- `usePaymentMethods.ts`: Public hook for read access
- `usePaymentMethodsAdmin.ts`: Admin hook for CRUD operations

### 5. Utility Scripts
- `payment-system-diagnostic.mjs`: Diagnose system issues
- `fix-payment-storage.mjs`: Fix storage bucket issues
- `setup-payment-system.mjs`: Setup the complete payment system
- `e2e-payment-test.mjs`: End-to-end testing

## Implementation Details

### Database Schema

```sql
CREATE TABLE public.payment_methods (
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

### API Integration

The payment methods system uses Supabase's JavaScript client to interact with the database:

```typescript
// Example: Fetching payment methods
const { data, error } = await supabase
  .from('payment_methods')
  .select('*')
  .eq('active', true);
```

### QR Code Image Management

QR code images are stored in a dedicated Supabase storage bucket, with the following workflow:

1. User uploads an image in the admin interface
2. Image is stored in the `payment-qr-images` bucket
3. Public URL is generated and stored in the payment method record
4. User-facing component displays the QR code for scanning

### Row-Level Security (RLS)

The system uses RLS policies to control access to payment methods:

- Public read access for active payment methods
- Authenticated access for CRUD operations
- Special policies for storage bucket access

## Development Workflow

### Local Development

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Run the setup script:
   ```bash
   node scripts/setup-payment-system.mjs
   ```

4. Run tests:
   ```bash
   node scripts/e2e-payment-test.mjs
   ```

### Making Changes

When making changes to the payment system:

1. Update database schema if necessary (create migration scripts)
2. Update React components and hooks
3. Run tests to verify functionality
4. Update documentation

### Common Tasks

#### Adding a New Payment Method Type
1. Add the new type in the `SelectItem` components in `PaymentMethodManagement.tsx`
2. Update validation logic if necessary
3. Add appropriate icons or styling for the new type

#### Modifying QR Code Logic
1. Update the `uploadQRImage` function in `usePaymentMethodsAdmin.ts`
2. Update the QR display logic in `PaymentMethod.tsx`

#### Fixing RLS Issues
1. Run the diagnostic script to identify the issue
2. Follow the instructions in `PAYMENT-METHODS-RLS-FIX.md`
3. Apply the necessary SQL fixes in the Supabase dashboard

## Troubleshooting

### Common Errors

1. **"Permission denied" error when updating payment methods**
   - Cause: RLS policies are too restrictive
   - Solution: Follow the RLS fix instructions

2. **"Bucket not found" error when uploading QR codes**
   - Cause: Storage bucket not properly configured
   - Solution: Run the storage bucket fix script

3. **Payment methods not appearing in user interface**
   - Cause: Methods may be marked as inactive
   - Solution: Check the `active` status in the admin interface

## Resources

- [Supabase Documentation](https://supabase.io/docs)
- [React Query Documentation](https://react-query.tanstack.com/docs/overview)
- [Complete Payment System Documentation](./PAYMENT-SYSTEM.md)
- [RLS Fix Instructions](./PAYMENT-METHODS-RLS-FIX.md)

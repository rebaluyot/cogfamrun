# Payment System Documentation

## Overview
The payment system for COG FamRun registration provides a way to maintain payment methods through an admin interface. It includes a CRUD system for managing payment details (account name, QR image, account number) and implements a proper database structure to store this information.

## Components

### Database Structure
The payment methods are stored in a database table with the following structure:
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

### Storage Bucket
QR code images are stored in a dedicated storage bucket:
- Bucket ID: `payment-qr-images`
- Public access: Enabled for reading
- Security: Managed through RLS policies

### React Components

#### Admin Interface
The `PaymentMethodManagement` component provides an admin interface for managing payment methods with the following features:
- List existing payment methods
- Create new payment methods
- Edit existing payment methods
- Delete payment methods 
- Toggle active status of payment methods
- Upload QR code images

#### User-Facing Component
The `PaymentMethod` component displays payment methods to users during the registration process, including:
- Display of active payment methods
- Selection of payment method
- Display of QR codes for scanning
- Instructions for payment

### React Hooks

#### usePaymentMethods Hook
This hook is used to fetch payment methods for the user-facing component:
```typescript
const { data: paymentMethods, isLoading, error } = usePaymentMethods();
```

#### usePaymentMethodsAdmin Hook
This hook provides CRUD operations for managing payment methods in the admin interface:
```typescript
const { 
  getPaymentMethods, 
  createPaymentMethod, 
  updatePaymentMethod,
  deletePaymentMethod,
  togglePaymentMethodActive,
  uploadQRImage
} = usePaymentMethodsAdmin();
```

## Row Level Security (RLS)
The system uses Supabase's Row Level Security to control access to payment methods:

### Read Access
- Public can read active payment methods
- Admin can read all payment methods

### Write Access
- Admin can create, update, and delete payment methods
- RLS policies ensure proper access control

## Usage Instructions

### For Administrators
1. Log in to the admin panel
2. Navigate to the "Payment Methods" tab
3. Add, edit, or delete payment methods as needed
4. Upload QR codes for payment methods
5. Toggle active status to show/hide payment methods for users

### For Users
1. During registration, select a payment method
2. Scan the QR code or note the account number
3. Complete payment using the selected method
4. Upload proof of payment

## Setup and Testing

### Quick Setup
1. Run the setup script to configure the database and storage:
   ```bash
   node scripts/setup-payment-system.mjs
   ```
2. Follow the instructions provided by the script to run the necessary SQL commands in the Supabase dashboard
3. Run the diagnostic script to verify everything is set up correctly:
   ```bash
   node scripts/payment-system-diagnostic.mjs
   ```

### End-to-End Testing
1. Run the end-to-end test script to verify all components work together:
   ```bash
   node scripts/e2e-payment-test.mjs
   ```
2. If all tests pass, the payment system is ready to use
3. If any tests fail, follow the troubleshooting instructions provided by the script

### Troubleshooting Tools
The payment method management interface includes a "Troubleshooting Tools" tab that provides:
- Storage bucket connectivity testing
- QR image upload testing
- Direct verification of system configuration

## Troubleshooting

### Common Issues
1. **Missing QR Codes**: Upload a new QR image in the admin panel
2. **Payment Method Not Showing**: Check if the payment method is marked as active
3. **Permission Denied Errors**: See PAYMENT-METHODS-RLS-FIX.md for RLS policy fixes
4. **Storage Bucket Issues**: Run the fix script:
   ```bash
   node scripts/fix-payment-storage.mjs
   ```
5. **Database Connection Issues**: Verify Supabase connection settings in `usePaymentMethods.ts`

## Future Enhancements
1. Implement automatic verification of payments
2. Add support for online payment gateways
3. Integrate receipt generation
4. Implement email notifications for payment confirmation
5. Add detailed transaction logging
6. Implement payment reconciliation reporting
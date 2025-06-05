# COG FamRun 2025 Application

## Enhanced Payment System

The COG FamRun application now includes a comprehensive payment tracking system with the following features:

### Core Payment Features
- Payment status tracking (pending, confirmed, rejected)
- Payment method selection and management
- Reference number tracking
- Payment verification for administrators
- Email notifications for payment status changes

### Advanced Payment Features
- **Payment History Tracking**: Complete audit trail of all payment status changes
- **Payment Receipt Generation**: Professional receipts for confirmed payments
- **Batch Payment Processing**: Efficiently verify multiple payments at once
- **Payment Analytics**: Dashboard with insights on payment data

## Documentation

The following documentation is available for the payment system:

- [Payment System Implementation](./PAYMENT-SYSTEM-IMPLEMENTATION.md): Overview of the payment tracking system
- [Email Notification System](./EMAIL-NOTIFICATION-SYSTEM.md): Details about the email notification feature
- [Payment Receipt & History](./PAYMENT-RECEIPT-HISTORY.md): Information on the receipt and history tracking features

## Getting Started

### Prerequisites
- Node.js (v16+)
- npm or yarn
- Supabase account

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/famrun-main.git
cd famrun-main
```

2. Install dependencies
```bash
npm install
# or
yarn
```

3. Set up environment variables
```bash
cp .env.example .env
```
Then edit the `.env` file with your Supabase credentials and other configuration.

4. Run the database migrations
```bash
node scripts/run-migration.js
```

5. Start the development server
```bash
npm run dev
# or
yarn dev
```

### Testing Payment Features

To test the payment receipt and history tracking functionality:

```bash
node scripts/test-receipt-history.mjs
```

## Project Structure

- `/src/components/admin`: Admin dashboard components
  - `PaymentVerification.tsx`: Payment verification interface
  - `PaymentAnalytics.tsx`: Payment analytics dashboard
  - `PaymentHistory.tsx`: Payment history component
  - `PaymentReceipt.tsx`: Receipt generation component
  - `BatchPaymentVerification.tsx`: Batch processing interface
  
- `/src/lib`: Utility functions
  - `payment-utils.ts`: Payment status and receipt utilities
  - `email-notification.ts`: Email sending functions
  - `payment-styles.ts`: Shared styling for payment components

- `/supabase/migrations`: Database migrations
  - `20250606_add_payment_history.sql`: Migration for payment history and receipts
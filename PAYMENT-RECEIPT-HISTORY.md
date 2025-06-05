# Payment Receipt & History Tracking System

## Overview
This document provides an overview of the payment receipt generation and history tracking features implemented for the COG FamRun payment system. These features enhance the payment verification process by providing detailed audit trails and professional receipts for participants.

## Features

### 1. Payment History Tracking
The system now tracks all changes to payment status, providing a full audit trail of payment verifications.

#### Key Components:
- **Database Table**: `payment_history` stores all status changes
- **Tracked Information**:
  - Previous and new payment status
  - User who made the change
  - Timestamp of change
  - Notes associated with the change
- **History Viewing**: Available in the payment verification dialog

### 2. Payment Receipt Generation
When a payment is confirmed, the system can generate a professional receipt that can be viewed, printed, or downloaded.

#### Key Components:
- **Database Table**: `payment_receipts` stores receipt information
- **Receipt Features**:
  - Unique receipt numbers (format: FR-YYYY-XXXXXXXX)
  - Participant information
  - Payment details (amount, category, payment method)
  - Official COG FamRun branding
  - Printable format
- **Receipt Access**: Available in the payment verification dialog

### 3. Integrated Payment Utility Functions
A comprehensive set of utility functions has been implemented to handle payment operations consistently:

- `updatePaymentStatus`: Updates status with history tracking and optional receipt generation
- `logPaymentHistory`: Records payment status changes to the history table
- `generatePaymentReceipt`: Creates payment receipts with unique reference numbers
- `getPaymentHistory`: Retrieves history for a specific registration
- `getPaymentReceipt`: Retrieves receipt information

### 4. Enhanced UI Components
The payment verification UI has been enhanced with:

- Tabbed interface for accessing verification, history, and receipt sections
- Interactive receipt viewer with print and download capabilities
- History timeline showing all payment status changes
- Receipt generation controls for confirmed payments

### 5. Batch Processing Improvements
The batch verification process now includes:

- Tracking history for all batch-processed payments
- Generating receipts for confirmed payments in batch
- Improved progress tracking during batch operations

## Implementation Details

### Database Schema
```sql
-- Payment history table
CREATE TABLE payment_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  registration_id UUID NOT NULL,
  payment_status TEXT NOT NULL,
  previous_status TEXT,
  changed_by TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_payment_history_registration FOREIGN KEY (registration_id) 
  REFERENCES registrations(id) ON DELETE CASCADE
);

-- Payment receipts table
CREATE TABLE payment_receipts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  registration_id UUID NOT NULL UNIQUE,
  receipt_number TEXT NOT NULL UNIQUE,
  receipt_url TEXT,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  generated_by TEXT,
  CONSTRAINT fk_payment_receipt_registration FOREIGN KEY (registration_id) 
  REFERENCES registrations(id) ON DELETE CASCADE
);
```

### Key Components

#### 1. PaymentHistoryComponent
Displays a chronological list of all status changes for a registration, including:
- Date and time of change
- Previous and new status
- Who made the change
- Notes associated with the change

#### 2. PaymentReceiptComponent
Manages receipt generation and viewing:
- Displays receipt information if already generated
- Provides controls to generate new receipts
- Offers a print-friendly receipt view
- Includes visual receipt download and printing options

#### 3. Payment Utils
Centralizes payment logic:
- Consistent status updating with history tracking
- Receipt generation with unique numbering
- Email notification integration

## Usage Guidelines

### Viewing Payment History
1. Open the payment verification dialog for a registration
2. Click the "History" tab
3. View all status changes in chronological order

### Generating & Viewing Receipts
1. Confirm a payment (status = "confirmed")
2. Navigate to the "Receipt" tab
3. If no receipt exists, click "Generate Receipt"
4. Once generated, use "View Receipt" to see the formatted receipt
5. Use the Print or Download buttons as needed

### Batch Processing with History
The batch verification process automatically:
1. Updates status for all selected registrations
2. Records history entries for each change
3. Generates receipts for confirmed payments
4. Sends email notifications if enabled

## Future Enhancements
1. PDF export functionality for receipts
2. Digital signature integration for receipts
3. Enhanced receipt templates with customizable branding
4. Receipt delivery via email attachments
5. Payment analytics based on history data

## Conclusion
The payment receipt and history tracking system enhances the COG FamRun payment process with better record-keeping, professional documentation for participants, and improved administrative oversight through comprehensive audit trails.

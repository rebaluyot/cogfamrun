# Email Notification System Documentation

## Overview
The Email Notification System for COG FamRun provides automated communication with participants regarding their payment status. This system helps keep participants informed about their registration and payment status without requiring manual communication from administrators.

## Features

### 1. Automated Notifications
- **Payment Confirmed**: Sent when an admin confirms a participant's payment
- **Payment Rejected**: Sent when a payment is rejected, including notes about why it was rejected
- **Payment Pending**: Sent when a payment status is updated to pending (awaiting verification)

### 2. Notification Management
- Administrators can view all sent email notifications
- Search and filter notifications by recipient, type, or status
- View the full content of sent emails
- Track notification delivery status

### 3. Optional Notifications
- Toggle email notifications on/off during the payment verification process
- Customize notification content with payment-specific notes

## Technical Implementation

### Database Structure
The system uses a dedicated `email_notifications` table with the following structure:

```sql
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
```

### Email Templates
Email templates are defined in the `email-notification.ts` file and include:

1. **Confirmed Payment Template**:
   - Subject: "COG FamRun 2025: Payment Confirmed"
   - Content: Confirmation details and next steps

2. **Rejected Payment Template**:
   - Subject: "COG FamRun 2025: Payment Issue - Action Required"
   - Content: Rejection reason and instructions for resolution

3. **Pending Payment Template**:
   - Subject: "COG FamRun 2025: Payment Received - Under Review"
   - Content: Information about the review process and timeline

### Integration Points
The email notification system integrates with:

1. **Payment Verification Component**: Sends emails when payment status changes
2. **Admin Panel**: Displays email history and notification details
3. **Database**: Stores notification records for tracking and auditing

## Usage Guide

### Sending Notifications

1. Navigate to the Payment Verification section in the admin panel
2. Select a registration to verify
3. Update the payment status
4. Ensure the "Send email notification" checkbox is checked
5. Add notes if necessary (these will be included in rejection emails)
6. Click "Confirm & Notify" or "Reject & Notify"

### Viewing Notification History

1. Navigate to the Payment Verification section in the admin panel
2. Click on the "Notifications" tab
3. View the list of all sent notifications
4. Use the search box to filter notifications
5. Click "View" on any notification to see its full details

## Future Enhancements

1. **Rich HTML Templates**: Enhance email templates with HTML formatting and branding
2. **Scheduled Notifications**: Send reminder emails for pending payments
3. **Bulk Notifications**: Send notifications to multiple participants at once
4. **Custom Templates**: Allow administrators to create custom email templates
5. **External Email Service**: Integrate with SendGrid or Mailgun for reliable delivery

## Troubleshooting

### Common Issues
- **Emails Not Sending**: Check that the email service is properly configured
- **Missing Notifications**: Verify that the email notification checkbox was enabled during verification
- **Incorrect Content**: Review and update the email templates in the code

### Support
For technical support with the email notification system, contact the development team at dev@cogfamrun.org.

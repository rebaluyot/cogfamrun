import { supabase } from "@/integrations/supabase/client";

// Email templates for different payment statuses
const emailTemplates = {
  confirmed: {
    subject: "COG FamRun 2025: Payment Confirmed",
    body: (firstName: string, registrationId: string) => `
Dear ${firstName},

Good news! Your payment for COG FamRun 2025 has been confirmed. Your registration is now complete.

Registration Details:
- Registration ID: ${registrationId}
- Status: Confirmed

You can log in to your account to view your registration details and download your race kit information.

Thank you for your participation in COG FamRun 2025!

Best regards,
COG FamRun Team
    `
  },
  rejected: {
    subject: "COG FamRun 2025: Payment Issue - Action Required",
    body: (firstName: string, registrationId: string, notes?: string) => `
Dear ${firstName},

We regret to inform you that we could not verify your payment for COG FamRun 2025.

Registration Details:
- Registration ID: ${registrationId}
- Status: Payment Rejected

${notes ? `Note from our team: ${notes}` : ""}

Please log in to your account to update your payment information or contact our support team for assistance.

Thank you for your understanding.

Best regards,
COG FamRun Team
    `
  },
  pending: {
    subject: "COG FamRun 2025: Payment Received - Under Review",
    body: (firstName: string, registrationId: string) => `
Dear ${firstName},

Thank you for your payment for COG FamRun 2025. Your payment is currently under review.

Registration Details:
- Registration ID: ${registrationId}
- Status: Payment Under Review

We will notify you once your payment has been confirmed. This usually takes 24-48 hours.

Thank you for your patience.

Best regards,
COG FamRun Team
    `
  }
};

// Send email notification based on payment status
export const sendPaymentStatusEmail = async (
  email: string, 
  firstName: string, 
  registrationId: string, 
  status: 'confirmed' | 'rejected' | 'pending',
  notes?: string
) => {
  try {
    const template = emailTemplates[status];
    
    if (!template) {
      console.error(`No email template found for status: ${status}`);
      return { success: false, message: 'Invalid status' };
    }

    // In a real implementation, this would use a proper email service
    // For this implementation, we'll use a placeholder function
    // that simulates sending an email and logs the information
    
    console.log(`Sending ${status} email to ${email}`);
    console.log(`Subject: ${template.subject}`);
    console.log(`Body: ${template.body(firstName, registrationId, notes)}`);
    
    // Record this email in the database for tracking
    const { error } = await supabase
      .from('email_notifications' as any)
      .insert({
        email,
        recipient_name: firstName,
        registration_id: registrationId,
        email_type: `payment_${status}`,
        subject: template.subject,
        body: template.body(firstName, registrationId, notes),
        status: 'sent',
        sent_at: new Date().toISOString()
      });
    
    if (error) {
      console.error('Error logging email notification:', error);
      return { success: false, message: 'Failed to log email notification' };
    }
    
    return { success: true, message: 'Email notification sent' };
  } catch (error) {
    console.error('Error sending email notification:', error);
    return { success: false, message: 'Failed to send email notification' };
  }
};

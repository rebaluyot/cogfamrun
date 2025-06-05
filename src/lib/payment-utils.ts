/**
 * Utils for payment history tracking and receipt generation
 */
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "./format-utils";
import { sendPaymentStatusEmail } from "./email-notification";
import { v4 as uuidv4 } from "uuid";

/**
 * Interface for payment history entry
 */
export interface PaymentHistory {
  id: string;
  registration_id: string;
  payment_status: string;
  previous_status: string | null;
  changed_by: string | null;
  notes: string | null;
  created_at: string;
}

/**
 * Interface for payment receipt
 */
export interface PaymentReceipt {
  id: string;
  registration_id: string;
  receipt_number: string;
  receipt_url: string | null;
  generated_at: string;
  generated_by: string | null;
}

/**
 * Interface for registration with payment fields
 */
interface RegistrationWithPayment {
  id: string;
  registration_id: string;
  email: string;
  first_name: string;
  payment_status: string | null;
  payment_date?: string | null;
}

/**
 * Log payment status change to history
 */
export const logPaymentHistory = async (
  registrationId: string,
  newStatus: string,
  previousStatus: string | null,
  changedBy: string | null = "admin",
  notes: string | null = null
): Promise<{ success: boolean; error?: any }> => {
  try {
    // Use 'as any' type assertion to bypass TypeScript table checking
    const { error } = await (supabase.from("payment_history" as any) as any).insert({
      registration_id: registrationId,
      payment_status: newStatus,
      previous_status: previousStatus,
      changed_by: changedBy,
      notes: notes,
    });

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error("Error logging payment history:", error);
    return { success: false, error };
  }
};

/**
 * Get payment history for a registration
 */
export const getPaymentHistory = async (
  registrationId: string
): Promise<{ data: PaymentHistory[] | null; error: any }> => {
  try {
    // Use 'as any' type assertion to bypass TypeScript table checking
    const { data, error } = await (supabase
      .from("payment_history" as any) as any)
      .select("*")
      .eq("registration_id", registrationId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return { data: data as PaymentHistory[], error: null };
  } catch (error) {
    console.error("Error fetching payment history:", error);
    return { data: null, error };
  }
};

/**
 * Generate a unique receipt number
 */
export const generateReceiptNumber = (): string => {
  // Format: FR-YYYY-RANDOMID
  const year = new Date().getFullYear();
  const randomPart = uuidv4().substring(0, 8).toUpperCase();
  return `FR-${year}-${randomPart}`;
};

/**
 * Generate payment receipt for a confirmed payment
 */
export const generatePaymentReceipt = async (
  registrationId: string,
  generatedBy: string | null = "system"
): Promise<{ success: boolean; receiptNumber?: string; error?: any }> => {
  try {
    // Check if receipt already exists
    const { data: existingReceipt } = await (supabase
      .from("payment_receipts" as any) as any)
      .select("receipt_number")
      .eq("registration_id", registrationId)
      .single();

    if (existingReceipt && existingReceipt.receipt_number) {
      return { 
        success: true, 
        receiptNumber: existingReceipt.receipt_number 
      };
    }

    // Generate a new receipt number
    const receiptNumber = generateReceiptNumber();

    // Get registration details to generate a receipt URL
    // In a real system, this would generate a PDF
    // For this implementation, we'll just store the receipt number
    const { data: registration } = await supabase
      .from("registrations")
      .select("*")
      .eq("id", registrationId)
      .single();

    if (!registration) {
      throw new Error("Registration not found");
    }

    // Store the receipt record
    const { error } = await (supabase.from("payment_receipts" as any) as any).insert({
      registration_id: registrationId,
      receipt_number: receiptNumber,
      receipt_url: null, // Would contain a URL to a generated PDF in a real system
      generated_by: generatedBy,
    });

    if (error) throw error;

    return {
      success: true,
      receiptNumber,
    };
  } catch (error) {
    console.error("Error generating payment receipt:", error);
    return { success: false, error };
  }
};

/**
 * Get payment receipt for a registration
 */
export const getPaymentReceipt = async (
  registrationId: string
): Promise<{ data: PaymentReceipt | null; error: any }> => {
  try {
    const { data, error } = await (supabase
      .from("payment_receipts" as any) as any)
      .select("*")
      .eq("registration_id", registrationId)
      .single();

    if (error && error.code !== "PGRST116") throw error; // PGRST116 is "no rows returned"
    return { data: data as PaymentReceipt, error: null };
  } catch (error) {
    console.error("Error fetching payment receipt:", error);
    return { data: null, error };
  }
};

/**
 * Update payment status with history tracking and optional receipt generation
 */
export const updatePaymentStatus = async (
  registration: RegistrationWithPayment,
  newStatus: "confirmed" | "rejected" | "pending",
  notes: string | null = null,
  changedBy: string = "admin",
  sendEmail: boolean = true
): Promise<{ success: boolean; error?: any; receiptNumber?: string }> => {
  try {
    const previousStatus = registration.payment_status || "pending";
    
    // Only proceed if status is actually changing
    if (previousStatus === newStatus && !notes) {
      return { success: true };
    }
    
    // Update registration
    const updates = {
      payment_status: newStatus,
      payment_notes: notes,
      payment_confirmed_by: changedBy,
      status: newStatus === "confirmed" ? "confirmed" : "pending",
      payment_date: newStatus === "confirmed" ? new Date().toISOString() : registration.payment_date
    };
    
    const { error: updateError } = await supabase
      .from('registrations')
      .update(updates)
      .eq('id', registration.id);
      
    if (updateError) throw updateError;
    
    // Log history
    await logPaymentHistory(
      registration.id,
      newStatus,
      previousStatus,
      changedBy,
      notes
    );
    
    let receiptNumber: string | undefined;
    
    // Generate receipt if payment is confirmed
    if (newStatus === "confirmed") {
      const { success, receiptNumber: number, error: receiptError } = await generatePaymentReceipt(
        registration.id,
        changedBy
      );
      
      if (!success) {
        console.error("Failed to generate receipt:", receiptError);
      } else {
        receiptNumber = number;
      }
    }
    
    // Send email if enabled
    if (sendEmail) {
      await sendPaymentStatusEmail(
        registration.email,
        registration.first_name,
        registration.registration_id,
        newStatus,
        newStatus === 'rejected' ? notes : undefined
      );
    }
    
    return { 
      success: true,
      receiptNumber
    };
  } catch (error) {
    console.error("Error updating payment status:", error);
    return { success: false, error };
  }
};

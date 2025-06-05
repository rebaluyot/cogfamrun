/**
 * Complete Payment Receipt System Fix Script
 * 
 * This script will:
 * 1. Create the payment_history and payment_receipts tables if they don't exist
 * 2. Fix the RLS policies to be less restrictive
 * 3. Test the functionality
 */
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

// Supabase connection details
const SUPABASE_URL = "https://lkumpuiyepjtztdwtcwg.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxrdW1wdWl5ZXBqdHp0ZHd0Y3dnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg4NDcyNzEsImV4cCI6MjA2NDQyMzI3MX0.1oa22qd-aPgAzz602J112n_Gnv3nr3d8TULXcACp8mk";

console.log("Payment Receipt System Complete Fix");
console.log("=================================\n");

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

// Generate a unique receipt number for testing
const generateReceiptNumber = () => {
  const year = new Date().getFullYear();
  const randomPart = uuidv4().substring(0, 8).toUpperCase();
  return `FR-${year}-${randomPart}`;
};

// SQL for creating payment tables
const CREATE_TABLES_SQL = `
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

-- Add index on registration_id for faster querying
CREATE INDEX IF NOT EXISTS idx_payment_history_registration_id ON payment_history(registration_id);
CREATE INDEX IF NOT EXISTS idx_payment_history_created_at ON payment_history(created_at);

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

-- Add index for faster receipt lookup
CREATE INDEX IF NOT EXISTS idx_payment_receipts_registration_id ON payment_receipts(registration_id);
CREATE INDEX IF NOT EXISTS idx_payment_receipts_receipt_number ON payment_receipts(receipt_number);

-- Enable RLS on both tables
ALTER TABLE public.payment_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_receipts ENABLE ROW LEVEL SECURITY;
`;

// SQL for fixing RLS policies
const FIX_RLS_SQL = `
-- Drop existing restrictive policies
DROP POLICY IF EXISTS admin_payment_history_policy ON payment_history;
DROP POLICY IF EXISTS admin_payment_receipts_policy ON public.payment_receipts;
DROP POLICY IF EXISTS user_read_own_receipts ON public.payment_receipts;

-- Create new less restrictive policies for payment_history
CREATE POLICY "Allow anyone to read payment_history" 
  ON payment_history 
  FOR SELECT 
  TO PUBLIC
  USING (true);

CREATE POLICY "Allow anyone to insert payment_history" 
  ON payment_history 
  FOR INSERT 
  TO authenticated
  WITH CHECK (true);

-- Create new less restrictive policies for payment_receipts
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

CREATE POLICY "Allow anyone to update payment_receipts" 
  ON public.payment_receipts 
  FOR UPDATE 
  TO authenticated
  USING (true);

CREATE POLICY "Allow anyone to delete payment_receipts" 
  ON public.payment_receipts 
  FOR DELETE 
  TO authenticated
  USING (true);
`;

// Display SQL for table creation
function displayCreateTablesSQL() {
  console.log("Step 1: Run this SQL to create the payment tables:");
  console.log("-----------------------------------------------\n");
  console.log(CREATE_TABLES_SQL);
  console.log("\n-----------------------------------------------");
}

// Display SQL for fixing RLS
function displayFixRLSSQL() {
  console.log("\nStep 2: Run this SQL to fix the RLS policies:");
  console.log("-----------------------------------------------\n");
  console.log(FIX_RLS_SQL);
  console.log("\n-----------------------------------------------");
  console.log("Please run both SQL scripts in the Supabase Dashboard SQL Editor at:");
  console.log("https://supabase.com/dashboard/project/lkumpuiyepjtztdwtcwg/sql\n");
}

// Test receipt operations
async function testReceiptOperations() {
  console.log("\nTesting payment receipt operations...\n");
  
  try {
    // Get a test registration
    const { data: registrations, error: regError } = await supabase
      .from('registrations')
      .select('id, registration_id, payment_status')
      .eq('payment_status', 'confirmed')
      .limit(1);
      
    if (regError) {
      console.error("Error fetching test registration:", regError);
      return;
    }
    
    if (!registrations || registrations.length === 0) {
      console.log("No confirmed registrations found for testing");
      return;
    }
    
    const testReg = registrations[0];
    console.log(`Using registration ID: ${testReg.registration_id}`);
    
    // Generate a receipt number
    const receiptNumber = generateReceiptNumber();
    
    // Test INSERT operation
    console.log("Testing INSERT operation...");
    const { data: insertData, error: insertError } = await supabase
      .from('payment_receipts')
      .insert({
        registration_id: testReg.id,
        receipt_number: receiptNumber,
        generated_by: 'test-script'
      })
      .select();
      
    if (insertError) {
      console.error("❌ INSERT operation failed:", insertError);
    } else {
      console.log("✅ INSERT operation successful");
    }
    
    // Test SELECT operation
    console.log("\nTesting SELECT operation...");
    const { data: selectData, error: selectError } = await supabase
      .from('payment_receipts')
      .select('*')
      .eq('registration_id', testReg.id);
      
    if (selectError) {
      console.error("❌ SELECT operation failed:", selectError);
    } else if (selectData && selectData.length > 0) {
      console.log("✅ SELECT operation successful");
      console.log(`   Found receipt #${selectData[0].receipt_number}`);
    } else {
      console.log("❓ SELECT operation didn't find any receipts");
    }
    
    // Test UPDATE operation if receipt was inserted
    if (insertData && insertData.length > 0) {
      console.log("\nTesting UPDATE operation...");
      const receiptId = insertData[0].id;
      const { error: updateError } = await supabase
        .from('payment_receipts')
        .update({ receipt_url: 'https://example.com/test-receipt.pdf' })
        .eq('id', receiptId);
        
      if (updateError) {
        console.error("❌ UPDATE operation failed:", updateError);
      } else {
        console.log("✅ UPDATE operation successful");
      }
      
      // Test DELETE operation
      console.log("\nTesting DELETE operation...");
      const { error: deleteError } = await supabase
        .from('payment_receipts')
        .delete()
        .eq('id', receiptId);
        
      if (deleteError) {
        console.error("❌ DELETE operation failed:", deleteError);
      } else {
        console.log("✅ DELETE operation successful");
      }
    }
  } catch (error) {
    console.error("Error during test:", error);
  }
}

// Run the program
async function run() {
  displayCreateTablesSQL();
  displayFixRLSSQL();
  
  const runTests = process.argv.includes('--test');
  if (runTests) {
    console.log("\nRunning tests after applying SQL fix...");
    await testReceiptOperations();
  } else {
    console.log("\nTo test after applying both SQL scripts, run:");
    console.log("node scripts/fix-payment-receipt-system.mjs --test");
  }
}

run().catch(err => {
  console.error("Script error:", err);
});

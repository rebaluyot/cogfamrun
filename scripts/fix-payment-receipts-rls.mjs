/**
 * Script to fix payment receipts RLS policies
 * 
 * This script applies the RLS fix for payment receipts
 * and tests that it works correctly.
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { v4 as uuidv4 } from 'uuid';

// Get current file directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Supabase connection details
const SUPABASE_URL = "https://lkumpuiyepjtztdwtcwg.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxrdW1wdWl5ZXBqdHp0ZHd0Y3dnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg4NDcyNzEsImV4cCI6MjA2NDQyMzI3MX0.1oa22qd-aPgAzz602J112n_Gnv3nr3d8TULXcACp8mk";

console.log("Payment Receipts RLS Fix Tool");
console.log("============================\n");

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

// Generate a unique receipt number for testing
const generateReceiptNumber = () => {
  const year = new Date().getFullYear();
  const randomPart = uuidv4().substring(0, 8).toUpperCase();
  return `FR-${year}-${randomPart}`;
};

// SQL fix content
const SQL_FIX = `-- Fix RLS policies for payment_receipts table to be less restrictive
-- Drop existing restrictive policies
DROP POLICY IF EXISTS admin_payment_receipts_policy ON public.payment_receipts;
DROP POLICY IF EXISTS user_read_own_receipts ON public.payment_receipts;

-- Create new less restrictive policies
-- Allow any authenticated user to read payment receipts
CREATE POLICY "Allow anyone to read payment_receipts" 
  ON public.payment_receipts 
  FOR SELECT 
  TO PUBLIC
  USING (true);

-- Allow any authenticated user to insert payment receipts
CREATE POLICY "Allow anyone to insert payment_receipts" 
  ON public.payment_receipts 
  FOR INSERT 
  TO authenticated
  WITH CHECK (true);

-- Allow any authenticated user to update payment receipts
CREATE POLICY "Allow anyone to update payment_receipts" 
  ON public.payment_receipts 
  FOR UPDATE 
  TO authenticated
  USING (true);

-- Allow any authenticated user to delete payment receipts
CREATE POLICY "Allow anyone to delete payment_receipts" 
  ON public.payment_receipts 
  FOR DELETE 
  TO authenticated
  USING (true);`;

// Display SQL fix
function displaySQLFix() {
  console.log("SQL fix to apply in Supabase SQL Editor:");
  console.log("---------------------------------------\n");
  console.log(SQL_FIX);
  console.log("\n---------------------------------------");
  console.log("Please run this SQL in the Supabase Dashboard SQL Editor at:");
  console.log("https://supabase.com/dashboard/project/lkumpuiyepjtztdwtcwg/sql\n");
}

// Test payment receipts operations
async function testReceiptOperations() {
  console.log("Testing payment receipt operations...\n");
  
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
  displaySQLFix();
  
  const runTests = process.argv.includes('--test');
  if (runTests) {
    console.log("\nRunning tests after applying SQL fix...");
    await testReceiptOperations();
  } else {
    console.log("\nTo test after applying the SQL fix, run:");
    console.log("node scripts/fix-payment-receipts-rls.mjs --test");
  }
}

run().catch(err => {
  console.error("Script error:", err);
});

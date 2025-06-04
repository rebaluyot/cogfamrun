#!/usr/bin/env node

// This script tests payment method operations to diagnose RLS issues
// and provides the SQL fix needed to resolve them

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get current file directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Supabase connection details
const SUPABASE_URL = "https://lkumpuiyepjtztdwtcwg.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxrdW1wdWl5ZXBqdHp0ZHd0Y3dnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg4NDcyNzEsImV4cCI6MjA2NDQyMzI3MX0.1oa22qd-aPgAzz602J112n_Gnv3nr3d8TULXcACp8mk";

console.log("Payment Methods RLS Fix Tool");
console.log("===========================\n");

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

// Display SQL fix
async function displaySQLFix() {
  try {
    // Read the RLS fix SQL file
    const sqlFilePath = path.join(__dirname, '../supabase/migrations/20250605_fix_payment_methods_rls.sql');
    const sqlContent = readFileSync(sqlFilePath, 'utf8');
    
    console.log("STEP 1: Apply this SQL fix in Supabase SQL Editor:");
    console.log("-------------------------------------------\n");
    console.log(sqlContent);
    console.log("\n-------------------------------------------");
  } catch (error) {
    console.error("Error reading SQL file:", error);
  }
}

// Test payment method operations
async function testOperations() {
  console.log("\nSTEP 2: Testing current payment method operations:");
  console.log("-------------------------------------------\n");
  
  try {
    // Test SELECT
    console.log("Testing SELECT operation...");
    const { error: getError } = await supabase
      .from('payment_methods')
      .select('*')
      .limit(1);
      
    console.log(getError ? "❌ SELECT failed: " + getError.message : "✅ SELECT works");
    
    // Test INSERT
    console.log("\nTesting INSERT operation...");
    const testData = { 
      name: 'Test ' + Date.now(),
      account_number: '0000000000',
      account_type: 'test'
    };
    
    const { data: insertData, error: insertError } = await supabase
      .from('payment_methods')
      .insert([testData])
      .select();
      
    console.log(insertError ? "❌ INSERT failed: " + insertError.message : "✅ INSERT works");
    
    // If insert worked, test update and delete
    if (insertData && insertData.length > 0) {
      const id = insertData[0].id;
      
      // Test UPDATE
      console.log("\nTesting UPDATE operation...");
      const { error: updateError } = await supabase
        .from('payment_methods')
        .update({ name: 'Updated ' + Date.now() })
        .eq('id', id);
        
      console.log(updateError ? "❌ UPDATE failed: " + updateError.message : "✅ UPDATE works");
      
      // Test DELETE
      console.log("\nTesting DELETE operation...");
      const { error: deleteError } = await supabase
        .from('payment_methods')
        .delete()
        .eq('id', id);
        
      console.log(deleteError ? "❌ DELETE failed: " + deleteError.message : "✅ DELETE works");
    }
    
    console.log("\n-------------------------------------------");
    console.log("If any operation failed with 'permission denied' or 'row-level security' errors,");
    console.log("then you need to apply the SQL fix shown above.");
    console.log("\nTo apply the fix, copy the SQL and run it in your Supabase SQL Editor at:");
    console.log("https://supabase.com/dashboard/project/lkumpuiyepjtztdwtcwg/sql");

  } catch (error) {
    console.error("Error testing operations:", error);
  }
}

// Run the script
async function run() {
  await displaySQLFix();
  await testOperations();
}

run();

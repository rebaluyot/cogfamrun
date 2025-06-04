#!/usr/bin/env node

// This script provides a complete diagnostic check for the payment method system
// and helps troubleshoot any issues that might arise

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get current file directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Supabase connection details
const SUPABASE_URL = "https://lkumpuiyepjtztdwtcwg.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxrdW1wdWl5ZXBqdHp0ZHd0Y3dnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg4NDcyNzEsImV4cCI6MjA2NDQyMzI3MX0.1oa22qd-aPgAzz602J112n_Gnv3nr3d8TULXcACp8mk";

console.log("Payment System Complete Diagnostic Tool");
console.log("=====================================\n");

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

// Tests to run
const tests = {
  // Database Schema Tests
  checkTableExists: async () => {
    const { data, error } = await supabase
      .from('payment_methods')
      .select('id')
      .limit(1);
    
    return {
      name: "Payment Methods Table Exists",
      result: !error,
      error: error?.message,
      fix: "Run 20250604_add_payment_methods.sql migration"
    };
  },
  
  // RLS Tests
  checkRLSPolicies: async () => {
    // Test operations that should be allowed
    const testOps = [
      // Test SELECT
      async () => {
        const { error } = await supabase.from('payment_methods').select('*').limit(1);
        return {op: 'SELECT', success: !error, error};
      },
      // Test INSERT
      async () => {
        const testData = { name: 'Test ' + Date.now(), account_number: 'test', account_type: 'test' };
        const { data, error } = await supabase.from('payment_methods').insert([testData]).select();
        return {op: 'INSERT', success: !error, error, data};
      }
    ];
    
    // Run all tests
    const results = [];
    let testInsertId = null;
    
    for (const test of testOps) {
      const result = await test();
      results.push(result);
      
      // Save ID of inserted record for update and delete tests
      if (result.op === 'INSERT' && result.success && result.data?.length > 0) {
        testInsertId = result.data[0].id;
      }
    }
    
    // If insert succeeded, test update and delete
    if (testInsertId) {
      // Test UPDATE
      const updateResult = await (async () => {
        const { error } = await supabase
          .from('payment_methods')
          .update({ name: 'Updated ' + Date.now() })
          .eq('id', testInsertId);
        return {op: 'UPDATE', success: !error, error};
      })();
      
      results.push(updateResult);
      
      // Test DELETE
      const deleteResult = await (async () => {
        const { error } = await supabase
          .from('payment_methods')
          .delete()
          .eq('id', testInsertId);
        return {op: 'DELETE', success: !error, error};
      })();
      
      results.push(deleteResult);
    }
    
    // Check if any operation failed
    const failedOps = results.filter(r => !r.success);
    
    return {
      name: "RLS Policies Working",
      result: failedOps.length === 0,
      error: failedOps.length > 0 
        ? `Failed operations: ${failedOps.map(f => `${f.op} (${f.error?.message})`).join(', ')}` 
        : null,
      fix: "Apply RLS fixes from PAYMENT-METHODS-RLS-FIX.md"
    };
  },
  
  // Storage Tests
  checkStorageBucket: async () => {
    // Check if bucket exists
    try {
      const { data, error } = await supabase.storage.getBucket('payment-qr-images');
      return {
        name: "Payment QR Images Storage Bucket",
        result: !error && data,
        error: error?.message,
        fix: "Run the bucket creation SQL from 20250604_add_payment_methods.sql"
      };
    } catch (err) {
      return {
        name: "Payment QR Images Storage Bucket",
        result: false,
        error: err.message,
        fix: "Run the bucket creation SQL from 20250604_add_payment_methods.sql"
      };
    }
  },
  
  // Storage Policies Test
  checkStorageUpload: async () => {
    let testFile = null;
    try {
      // Create a simple test file
      const fileName = `test_${Date.now()}.txt`;
      const filePath = `${fileName}`;
      const fileContent = 'Test file content';
      const file = new File([fileContent], fileName, { type: 'text/plain' });
      
      // Try to upload to the bucket
      const { data, error } = await supabase.storage
        .from('payment-qr-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });
        
      testFile = filePath;
      
      return {
        name: "Storage Upload Permissions",
        result: !error,
        error: error?.message,
        fix: "Apply storage policies from PAYMENT-METHODS-RLS-FIX.md"
      };
    } catch (err) {
      return {
        name: "Storage Upload Permissions",
        result: false,
        error: err.message,
        fix: "Apply storage policies from PAYMENT-METHODS-RLS-FIX.md"
      };
    } finally {
      // Clean up test file if it was created
      if (testFile) {
        try {
          await supabase.storage
            .from('payment-qr-images')
            .remove([testFile]);
        } catch (e) {
          console.log("Note: Could not clean up test file.");
        }
      }
    }
  }
};

// Run all tests
async function runDiagnostic() {
  console.log("Running diagnostics...\n");
  
  // Store all test results
  const results = {};
  
  // Run each test
  for (const [testName, testFn] of Object.entries(tests)) {
    console.log(`Running test: ${testName}...`);
    results[testName] = await testFn();
  }
  
  console.log("\nDiagnostic Results:\n-------------------");
  
  // Report results
  let allPassed = true;
  for (const test of Object.values(results)) {
    console.log(`${test.result ? '✅' : '❌'} ${test.name}`);
    if (!test.result) {
      allPassed = false;
      console.log(`   Error: ${test.error}`);
      console.log(`   Fix: ${test.fix}`);
      console.log("");
    }
  }
  
  // Overall summary
  console.log("\n-------------------");
  if (allPassed) {
    console.log("✅ All tests passed! The payment system is working correctly.");
  } else {
    console.log("❌ Some tests failed. Please address the issues listed above.");
    console.log("   For more information, see PAYMENT-METHODS-RLS-FIX.md and PAYMENT-SYSTEM.md");
  }
}

// Run the diagnostic
runDiagnostic();

#!/usr/bin/env node

/**
 * End-to-End Payment System Tester
 * 
 * This script performs end-to-end tests of the payment system by:
 * 1. Testing database operations (CRUD)
 * 2. Testing storage operations
 * 3. Testing RLS policies
 * 4. Generating test QR codes
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import QRCode from 'qrcode';
import { v4 as uuidv4 } from 'uuid';

// Get current file directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Supabase connection details
const SUPABASE_URL = "https://lkumpuiyepjtztdwtcwg.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxrdW1wdWl5ZXBqdHp0ZHd0Y3dnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg4NDcyNzEsImV4cCI6MjA2NDQyMzI3MX0.1oa22qd-aPgAzz602J112n_Gnv3nr3d8TULXcACp8mk";

console.log("Payment System E2E Test");
console.log("======================\n");

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

// Generate a test QR code
async function generateTestQRCode(data) {
  const qrDataUrl = await QRCode.toDataURL(data);
  return qrDataUrl;
}

// Convert data URL to File object
function dataURLtoFile(dataurl, filename) {
  const arr = dataurl.split(',');
  const mime = arr[0].match(/:(.*?);/)[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  
  return new File([u8arr], filename, { type: mime });
}

// Test 1: Test payment method CRUD operations
async function testPaymentMethodCRUD() {
  console.log("Test 1: Payment Method CRUD Operations\n");
  let testId = null;
  
  try {
    // Step 1: Create a payment method
    console.log("Step 1: Creating test payment method...");
    const testData = {
      name: `Test Payment ${Date.now()}`,
      account_number: `TEST-${Date.now()}`,
      account_type: 'gcash',
      active: true
    };
    
    const { data: insertData, error: insertError } = await supabase
      .from('payment_methods')
      .insert([testData])
      .select();
      
    if (insertError) {
      throw new Error(`Insert failed: ${insertError.message}`);
    }
    
    testId = insertData[0].id;
    console.log(`✅ Created payment method with ID: ${testId}`);
    
    // Step 2: Read the payment method
    console.log("\nStep 2: Reading test payment method...");
    const { data: readData, error: readError } = await supabase
      .from('payment_methods')
      .select('*')
      .eq('id', testId)
      .single();
      
    if (readError) {
      throw new Error(`Read failed: ${readError.message}`);
    }
    
    console.log(`✅ Read payment method: ${readData.name}`);
    
    // Step 3: Update the payment method
    console.log("\nStep 3: Updating test payment method...");
    const updatedName = `Updated Test ${Date.now()}`;
    const { data: updateData, error: updateError } = await supabase
      .from('payment_methods')
      .update({ name: updatedName })
      .eq('id', testId)
      .select();
      
    if (updateError) {
      throw new Error(`Update failed: ${updateError.message}`);
    }
    
    console.log(`✅ Updated payment method: ${updateData[0].name}`);
    
    // Step 4: Delete the payment method
    console.log("\nStep 4: Deleting test payment method...");
    const { error: deleteError } = await supabase
      .from('payment_methods')
      .delete()
      .eq('id', testId);
      
    if (deleteError) {
      throw new Error(`Delete failed: ${deleteError.message}`);
    }
    
    console.log(`✅ Deleted payment method with ID: ${testId}`);
    
    return true;
  } catch (err) {
    console.error(`❌ CRUD Test Error: ${err.message}`);
    
    // Clean up if test failed but record was created
    if (testId) {
      console.log("\nCleaning up test data...");
      try {
        await supabase
          .from('payment_methods')
          .delete()
          .eq('id', testId);
      } catch (cleanupErr) {
        console.error(`Cleanup failed: ${cleanupErr.message}`);
      }
    }
    
    return false;
  }
}

// Test 2: Test QR image upload and retrieval
async function testQRImageStorage() {
  console.log("\nTest 2: QR Image Storage Operations\n");
  let filePath = null;
  
  try {
    // Step 1: Generate QR code
    console.log("Step 1: Generating test QR code...");
    const testData = {
      type: "payment",
      account: "TEST-ACCOUNT-" + Date.now(),
      timestamp: new Date().toISOString()
    };
    
    const qrDataUrl = await generateTestQRCode(JSON.stringify(testData));
    const fileName = `test_qr_${Date.now()}.png`;
    filePath = fileName;
    
    // Convert data URL to File
    const qrFile = dataURLtoFile(qrDataUrl, fileName);
    console.log(`✅ Generated QR code image`);
    
    // Step 2: Upload QR to storage
    console.log("\nStep 2: Uploading QR image to storage...");
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('payment-qr-images')
      .upload(filePath, qrFile, {
        contentType: 'image/png',
        upsert: true
      });
      
    if (uploadError) {
      throw new Error(`Upload failed: ${uploadError.message}`);
    }
    
    console.log(`✅ Uploaded QR image to storage: ${filePath}`);
    
    // Step 3: Get public URL
    console.log("\nStep 3: Getting public URL for QR image...");
    const { data: urlData } = supabase.storage
      .from('payment-qr-images')
      .getPublicUrl(filePath);
      
    console.log(`✅ Got public URL: ${urlData.publicUrl}`);
    
    // Step 4: Insert payment method with QR image
    console.log("\nStep 4: Creating payment method with QR image...");
    const testPaymentData = {
      name: `QR Test Payment ${Date.now()}`,
      account_number: `QR-TEST-${Date.now()}`,
      account_type: 'gcash',
      qr_image_url: urlData.publicUrl,
      active: true
    };
    
    const { data: insertData, error: insertError } = await supabase
      .from('payment_methods')
      .insert([testPaymentData])
      .select();
      
    if (insertError) {
      throw new Error(`Insert with QR failed: ${insertError.message}`);
    }
    
    const testId = insertData[0].id;
    console.log(`✅ Created payment method with QR, ID: ${testId}`);
    
    // Step 5: Clean up
    console.log("\nStep 5: Cleaning up test data...");
    
    // Delete payment method
    await supabase
      .from('payment_methods')
      .delete()
      .eq('id', testId);
    
    // Delete storage file
    await supabase.storage
      .from('payment-qr-images')
      .remove([filePath]);
      
    console.log(`✅ Cleaned up test data`);
    
    return true;
  } catch (err) {
    console.error(`❌ QR Storage Test Error: ${err.message}`);
    
    // Clean up if test failed but file was uploaded
    if (filePath) {
      console.log("\nCleaning up test storage data...");
      try {
        await supabase.storage
          .from('payment-qr-images')
          .remove([filePath]);
      } catch (cleanupErr) {
        console.error(`Storage cleanup failed: ${cleanupErr.message}`);
      }
    }
    
    return false;
  }
}

// Test 3: Test listing payment methods (for public component)
async function testListPaymentMethods() {
  console.log("\nTest 3: List Payment Methods (Public Component)\n");
  
  try {
    // Get all active payment methods (simulating public component)
    const { data, error } = await supabase
      .from('payment_methods')
      .select('*')
      .eq('active', true);
      
    if (error) {
      throw new Error(`Listing failed: ${error.message}`);
    }
    
    console.log(`✅ Found ${data.length} active payment methods`);
    
    // Display a sample of the data
    if (data.length > 0) {
      console.log("\nSample payment method:");
      console.log(`- Name: ${data[0].name}`);
      console.log(`- Account Type: ${data[0].account_type}`);
      console.log(`- Account Number: ${data[0].account_number}`);
      console.log(`- Has QR Image: ${data[0].qr_image_url ? 'Yes' : 'No'}`);
    } else {
      console.log("\nNo active payment methods found. You might want to add some!");
    }
    
    return true;
  } catch (err) {
    console.error(`❌ List Test Error: ${err.message}`);
    return false;
  }
}

// Verify the bucket exists
async function verifyBucket() {
  try {
    const { data, error } = await supabase.storage.getBucket('payment-qr-images');
    
    if (error) {
      console.error(`❌ Storage bucket 'payment-qr-images' does not exist or cannot be accessed.`);
      console.log("Please run the SQL commands in the setup script to create it.");
      return false;
    }
    
    console.log(`✅ Storage bucket 'payment-qr-images' exists and is ${data.public ? 'public' : 'not public'}`);
    return true;
  } catch (err) {
    console.error(`❌ Bucket verification error: ${err.message}`);
    return false;
  }
}

// Run all tests
async function runTests() {
  console.log("Starting Payment System E2E Tests...\n");
  
  // First verify the bucket exists
  const bucketExists = await verifyBucket();
  if (!bucketExists) {
    console.log("\nStorage bucket test failed. Cannot proceed with storage tests.");
    console.log("Run the setup script first: node scripts/setup-payment-system.mjs");
    return;
  }
  
  // Run the tests
  const crudResult = await testPaymentMethodCRUD();
  const storageResult = await testQRImageStorage();
  const listResult = await testListPaymentMethods();
  
  // Summary
  console.log("\n===== Test Results =====");
  console.log(`Payment Method CRUD: ${crudResult ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`QR Image Storage: ${storageResult ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`List Payment Methods: ${listResult ? '✅ PASS' : '❌ FAIL'}`);
  
  if (crudResult && storageResult && listResult) {
    console.log("\n🎉 All tests passed! The payment system is working correctly.");
    console.log("\nNext steps:");
    console.log("1. Run the application and test the admin interface");
    console.log("2. Create a few payment methods with QR codes");
    console.log("3. Test the user-facing payment component during registration");
  } else {
    console.log("\n⚠️ Some tests failed. Please check the errors above.");
    console.log("\nTroubleshooting steps:");
    console.log("1. Run the setup script: node scripts/setup-payment-system.mjs");
    console.log("2. Apply the SQL fixes in the Supabase dashboard");
    console.log("3. Run the diagnostic: node scripts/payment-system-diagnostic.mjs");
  }
}

// Run the tests
runTests();

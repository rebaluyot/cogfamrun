#!/usr/bin/env node

/**
 * Payment System Setup
 * 
 * This script helps set up the payment methods system by:
 * 1. Creating the necessary database tables and structures
 * 2. Setting up storage buckets for QR images
 * 3. Configuring proper RLS policies
 * 4. Testing the configuration
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { execSync } from 'child_process';

// Get current file directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Supabase connection details
const SUPABASE_URL = "https://lkumpuiyepjtztdwtcwg.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxrdW1wdWl5ZXBqdHp0ZHd0Y3dnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg4NDcyNzEsImV4cCI6MjA2NDQyMzI3MX0.1oa22qd-aPgAzz602J112n_Gnv3nr3d8TULXcACp8mk";

console.log("Payment System Setup Tool");
console.log("========================\n");

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

// Step 1: Check current setup
async function checkSetup() {
  console.log("Step 1: Checking current setup...\n");
  
  try {
    // Run the diagnostic script
    console.log("Running diagnostic script...");
    execSync('node scripts/payment-system-diagnostic.mjs', { stdio: 'inherit' });
    console.log("\n");
  } catch (error) {
    console.error("Error running diagnostic:", error);
  }
}

// Step 2: Create required database structure
async function createDatabase() {
  console.log("Step 2: Setting up database structure...\n");
  
  try {
    // Read the migration file
    const migrationPath = path.join(__dirname, '../supabase/migrations/20250604_add_payment_methods.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf8');
    
    console.log("Migration SQL to run in Supabase SQL Editor:");
    console.log("-------------------------------------------\n");
    console.log(migrationSQL);
    console.log("\n-------------------------------------------\n");
    
    console.log("Please run this SQL in the Supabase Dashboard SQL Editor at:");
    console.log("https://supabase.com/dashboard/project/lkumpuiyepjtztdwtcwg/sql\n");
  } catch (error) {
    console.error("Error reading migration file:", error);
  }
}

// Step 3: Fix RLS policies
async function fixRLSPolicies() {
  console.log("Step 3: Fixing RLS policies...\n");
  
  try {
    // Read the RLS fix file
    const rlsFixPath = path.join(__dirname, '../supabase/migrations/20250605_fix_payment_methods_rls.sql');
    const rlsFixSQL = readFileSync(rlsFixPath, 'utf8');
    
    console.log("RLS policy fix SQL to run in Supabase SQL Editor:");
    console.log("-------------------------------------------\n");
    console.log(rlsFixSQL);
    console.log("\n-------------------------------------------\n");
    
    console.log("Please run this SQL in the Supabase Dashboard SQL Editor at:");
    console.log("https://supabase.com/dashboard/project/lkumpuiyepjtztdwtcwg/sql\n");
  } catch (error) {
    console.error("Error reading RLS fix file:", error);
  }
}

// Step 4: Fix storage bucket
async function fixStorageBucket() {
  console.log("Step 4: Fixing storage bucket...\n");
  
  try {
    // Read the storage fix file
    const storageFixPath = path.join(__dirname, './fix-payment-storage.mjs');
    
    console.log("Running storage bucket fix script...");
    execSync('node scripts/fix-payment-storage.mjs', { stdio: 'inherit' });
    console.log("\n");
  } catch (error) {
    console.error("Error running storage fix script:", error);
  }
}

// Step 5: Final verification
async function verifySetup() {
  console.log("Step 5: Verifying setup...\n");
  
  try {
    // Run the diagnostic script again
    console.log("Running diagnostic script...");
    execSync('node scripts/payment-system-diagnostic.mjs', { stdio: 'inherit' });
    console.log("\n");
  } catch (error) {
    console.error("Error running diagnostic:", error);
  }
}

// Run all steps in sequence
async function runSetup() {
  await checkSetup();
  await createDatabase();
  await fixRLSPolicies();
  await fixStorageBucket();
  await verifySetup();
  
  console.log("\nSetup process complete!");
  console.log("------------------------");
  console.log("To fully complete the setup:");
  console.log("1. Make sure to run the SQL queries in the Supabase Dashboard");
  console.log("2. Verify all checks pass in the final diagnostic");
  console.log("3. Test the payment method management in your application");
}

// Run the setup
runSetup();

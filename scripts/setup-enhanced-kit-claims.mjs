#!/usr/bin/env node

/**
 * Enhanced Kit Distribution System Migration Script
 * 
 * This script helps set up the enhanced kit distribution system by:
 * 1. Creating the claim_locations table
 * 2. Adding necessary columns to the registrations table
 * 3. Displaying instructions for manual migration if needed
 */

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

console.log("Enhanced Kit Distribution System Setup");
console.log("======================================\n");

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

// Main function
async function setup() {
  try {
    // Read the migration file
    const migrationPath = path.join(__dirname, '../supabase/migrations/20250609_enhance_kit_claims.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf8');
    
    console.log("Migration SQL to run in Supabase SQL Editor:");
    console.log("-------------------------------------------\n");
    console.log(migrationSQL);
    console.log("\n-------------------------------------------\n");
    
    console.log("Please run this SQL in the Supabase Dashboard SQL Editor at:");
    console.log("https://supabase.com/dashboard/project/lkumpuiyepjtztdwtcwg/sql\n");
    
    // Check if claim_locations table exists
    const { data: locationCheck, error: locationError } = await supabase
      .from('claim_locations')
      .select('id')
      .limit(1);
    
    if (locationError) {
      console.log("✖ claim_locations table not found or not accessible.");
      console.log("  Please run the migration SQL first.\n");
    } else {
      console.log("✓ claim_locations table exists.");
      
      // Fetch locations
      const { data: locations, error: locationsError } = await supabase
        .from('claim_locations')
        .select('*')
        .order('name');
        
      if (!locationsError && locations.length > 0) {
        console.log("Found claim locations:");
        locations.forEach(loc => {
          console.log(`- ${loc.name} (${loc.active ? 'active' : 'inactive'})`);
        });
      }
      console.log();
    }
    
    // Check for enhanced columns
    const { data: registrations, error: registrationsError } = await supabase
      .from('registrations')
      .select('claim_location_id, actual_claimer, processed_by')
      .limit(1);
    
    if (registrationsError) {
      const missingColumns = [];
      if (registrationsError.message.includes('claim_location_id')) missingColumns.push('claim_location_id');
      if (registrationsError.message.includes('actual_claimer')) missingColumns.push('actual_claimer');
      if (registrationsError.message.includes('processed_by')) missingColumns.push('processed_by');
      
      if (missingColumns.length > 0) {
        console.log(`✖ Missing columns in registrations table: ${missingColumns.join(', ')}`);
        console.log("  Please run the migration SQL first.\n");
      }
    } else {
      console.log("✓ Enhanced kit claim columns are present in the registrations table.\n");
    }
    
    console.log("Next steps after running the migration:");
    console.log("1. Update the KitDistribution.tsx component to use the new fields");
    console.log("2. Add a claim location dropdown in the distribution form");
    console.log("3. Add an actual claimer field in the distribution form");
    console.log("4. Update the useKitDistribution.ts hook to handle the new fields");
    
  } catch (error) {
    console.error("Error:", error);
  }
}

// Run the setup function
setup();

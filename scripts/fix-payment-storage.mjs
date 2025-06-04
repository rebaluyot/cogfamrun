#!/usr/bin/env node

// This script applies fixes for the storage bucket issues with payment methods

import { createClient } from '@supabase/supabase-js';

// Supabase connection details
const SUPABASE_URL = "https://lkumpuiyepjtztdwtcwg.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxrdW1wdWl5ZXBqdHp0ZHd0Y3dnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg4NDcyNzEsImV4cCI6MjA2NDQyMzI3MX0.1oa22qd-aPgAzz602J112n_Gnv3nr3d8TULXcACp8mk";

console.log("Payment Storage Bucket Fix Tool");
console.log("=============================\n");

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

// SQL statements to fix the payment-qr-images bucket and policies
const FIX_SQL = `
-- Recreate storage bucket for QR images
-- First check if the bucket exists and if not, create it
BEGIN;
  INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  VALUES (
    'payment-qr-images',
    'payment-qr-images',
    true,
    5242880, -- 5MB limit
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/jpg']::text[]
  )
  ON CONFLICT (id) DO UPDATE
  SET 
    public = true,
    file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/jpg']::text[];
COMMIT;

-- Drop existing restrictive policies for storage
DROP POLICY IF EXISTS "Allow authenticated users to upload to payment-qr-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to update payment-qr-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to delete payment-qr-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow upload to payment-qr-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow update payment-qr-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow delete payment-qr-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow anyone to upload to payment-qr-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow anyone to update payment-qr-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow anyone to delete payment-qr-images" ON storage.objects;

-- Ensure public read access for QR images
DROP POLICY IF EXISTS "Allow public access to payment-qr-images" ON storage.objects;
CREATE POLICY "Allow public access to payment-qr-images" 
  ON storage.objects 
  FOR SELECT 
  TO PUBLIC
  USING (bucket_id = 'payment-qr-images');

-- Create maximally permissive policies for the payment-qr-images bucket
CREATE POLICY "Allow anyone to upload to payment-qr-images" 
  ON storage.objects 
  FOR INSERT 
  TO PUBLIC
  WITH CHECK (bucket_id = 'payment-qr-images');

CREATE POLICY "Allow anyone to update payment-qr-images" 
  ON storage.objects 
  FOR UPDATE 
  TO PUBLIC
  USING (bucket_id = 'payment-qr-images');

CREATE POLICY "Allow anyone to delete payment-qr-images" 
  ON storage.objects 
  FOR DELETE 
  TO PUBLIC
  USING (bucket_id = 'payment-qr-images');
`;

async function applyFix() {
  console.log("Checking storage bucket status...");
  
  // Check if bucket exists
  try {
    const { data: bucketData, error: bucketError } = await supabase.storage.getBucket('payment-qr-images');
    
    if (bucketError) {
      console.log("❌ Payment QR Images bucket does not exist or cannot be accessed.");
      console.log(`   Error: ${bucketError.message}`);
    } else {
      console.log("✅ Payment QR Images bucket exists.");
      console.log(`   Public access: ${bucketData.public ? 'Enabled' : 'Disabled'}`);
    }
  } catch (err) {
    console.log("❌ Error checking bucket:", err.message);
  }
  
  // Apply fixes via SQL
  console.log("\nApplying fixes...");
  console.log("This SQL fix needs to be run in the Supabase Dashboard SQL Editor:");
  console.log("\n-------------------------------------------\n");
  console.log(FIX_SQL);
  console.log("\n-------------------------------------------\n");
  
  console.log("Instructions:");
  console.log("1. Copy the SQL above");
  console.log("2. Go to https://supabase.com/dashboard/project/lkumpuiyepjtztdwtcwg/sql");
  console.log("3. Paste the SQL into a new query");
  console.log("4. Run the query");
  console.log("5. Run the diagnostic script again to verify the fix");
}

applyFix();

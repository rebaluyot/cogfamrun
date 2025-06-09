// Test script for kit distribution feature
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || 'http://localhost:54321';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSJ9.vI9obAHOGyVVKa3pD--kJlyxp-Z2zV9UUMAhKpNLAcU';

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Function to generate a test QR code
function generateTestQRCode(registration) {
  return `CogFamRun2025|${registration.registration_id}|${registration.first_name} ${registration.last_name}|${registration.category}|${registration.amount_paid || 0}|${registration.shirt_size}`;
}

async function testKitDistribution() {
  try {
    console.log('Testing Kit Distribution Feature...');
    
    // 1. Check if table has required columns
    console.log('Checking schema...');
    const { data: columns, error: schemaError } = await supabase
      .from('registrations')
      .select('kit_claimed, claimed_at, processed_by, actual_claimer, claim_location_id, claim_notes')
      .limit(1);
    
    if (schemaError) {
      console.error('Schema error:', schemaError);
      console.log('You need to run the migration first: npm run kit:setup');
      return;
    }
    
    console.log('Schema looks good! Kit distribution columns are present.');
    
    // 2. Get a random registration for testing
    console.log('Getting a test registration...');
    const { data: registrations, error: registrationError } = await supabase
      .from('registrations')
      .select('*')
      .eq('payment_status', 'confirmed')
      .eq('kit_claimed', false)
      .limit(1);
    
    if (registrationError || !registrations || registrations.length === 0) {
      console.error('No suitable registration found for testing:', registrationError);
      return;
    }
    
    const testRegistration = registrations[0];
    console.log('Test registration:', {
      id: testRegistration.id,
      name: `${testRegistration.first_name} ${testRegistration.last_name}`,
      registration_id: testRegistration.registration_id
    });
    
    // 3. Generate QR code data
    const qrCodeData = generateTestQRCode(testRegistration);
    console.log('Generated QR code data:', qrCodeData);
    
    // 4. Test updating kit claim status
    console.log('Testing kit claim update...');
    const { data: updateResult, error: updateError } = await supabase
      .from('registrations')
      .update({
        kit_claimed: true,
        claimed_at: new Date().toISOString(),
        processed_by: 'TEST_SCRIPT',
        actual_claimer: 'TEST_CLAIMER',
        claim_location_id: 1,
        claim_notes: `Test claim at ${new Date().toISOString()}`
      })
      .eq('id', testRegistration.id)
      .select();
    
    if (updateError) {
      console.error('Error updating kit claim status:', updateError);
      return;
    }
    
    console.log('Kit claim updated successfully!');
    console.log('Updated registration:', updateResult[0]);
    
    // 5. Reset the test registration
    console.log('Resetting test registration...');
    const { error: resetError } = await supabase
      .from('registrations')
      .update({
        kit_claimed: false,
        claimed_at: null,
        processed_by: null,
        actual_claimer: null,
        claim_location_id: null,
        claim_notes: null
      })
      .eq('id', testRegistration.id);
    
    if (resetError) {
      console.error('Error resetting test registration:', resetError);
      return;
    }
    
    console.log('Test registration reset successfully.');
    console.log('');
    console.log('========================================');
    console.log('🎉 Kit Distribution Feature Test Passed! 🎉');
    console.log('========================================');
    console.log('');
    console.log('QR code format for scanning/testing:');
    console.log(qrCodeData);
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

testKitDistribution();

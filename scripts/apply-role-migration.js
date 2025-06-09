// apply-role-migration.js
// This script runs the migration to add is_admin and can_distribute_kits columns
// to the admin_users table

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

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

async function runMigration() {
  try {
    console.log('Running migration to add user role columns...');
    
    // Read the migration SQL file
    const migrationPath = path.join(__dirname, '../supabase/migrations/20250607_add_user_role_columns.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('Migration SQL to run in Supabase SQL Editor:');
    console.log('--------------------------------------------');
    console.log(migrationSQL);
    console.log('--------------------------------------------');
    console.log('Please run this SQL in the Supabase Dashboard SQL Editor at:');
    console.log('https://supabase.com/dashboard/project/lkumpuiyepjtztdwtcwg/sql');
    
    console.log('\nStep-by-step Instructions:');
    console.log('1. Log in to your Supabase dashboard');
    console.log('2. Navigate to your project: lkumpuiyepjtztdwtcwg');
    console.log('3. Go to the SQL Editor');
    console.log('4. Create a new query and paste the SQL shown above');
    console.log('5. Click "Run" to execute the SQL query');
    console.log('6. Verify the columns were added by running:');
    console.log('\n   SELECT column_name FROM information_schema.columns WHERE table_name = \'admin_users\';');
    
  } catch (error) {
    console.error('Failed to run migration:', error);
  }
}

runMigration();

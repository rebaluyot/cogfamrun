/**
 * Simple script to apply a migration file
 * Usage: node apply-migration.mjs <migration-file-path>
 */
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

// Load environment variables
dotenv.config();

// Get current directory
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials. Set SUPABASE_URL and SUPABASE_SERVICE_KEY in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Get migration file path from command line
const migrationFile = process.argv[2];

if (!migrationFile) {
  console.error('Migration file path is required.');
  console.error('Usage: node apply-migration.mjs <migration-file-path>');
  process.exit(1);
}

const filePath = path.resolve(process.cwd(), migrationFile);

if (!fs.existsSync(filePath)) {
  console.error(`Migration file not found: ${filePath}`);
  process.exit(1);
}

// Read migration SQL
const sql = fs.readFileSync(filePath, 'utf8');

// Apply migration
async function applyMigration() {
  console.log(`Applying migration from ${migrationFile}...`);
  
  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql });
    
    if (error) {
      throw error;
    }
    
    console.log('Migration applied successfully!');
    console.log(`SQL Result:`, data);
    
  } catch (error) {
    console.error('Error applying migration:', error);
    process.exit(1);
  }
}

applyMigration();

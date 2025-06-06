// Apply kit distribution migration
import { join } from 'path';
import { readFile } from 'fs/promises';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || 'http://localhost:54321';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSJ9.vI9obAHOGyVVKa3pD--kJlyxp-Z2zV9UUMAhKpNLAcU';

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function applyMigration() {
  try {
    console.log('Applying kit distribution migration...');
    
    // Path to migration file
    const filePath = join(process.cwd(), 'supabase', 'migrations', '20250606_add_kit_distribution_columns.sql');
    
    // Read migration SQL
    const sql = await readFile(filePath, 'utf8');
    
    // Execute SQL
    const { error } = await supabase.rpc('pgmigrate', { sql });
    
    if (error) {
      throw error;
    }
    
    console.log('Migration applied successfully!');
  } catch (error) {
    console.error('Error applying migration:', error);
    process.exit(1);
  }
}

applyMigration();

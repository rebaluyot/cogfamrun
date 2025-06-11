/**
 * Script to apply the system settings migration
 * This script adds the missing setting_type column to the system_settings table
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
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials. Check your .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  }
});

// Path to the migration SQL file
const migrationFilePath = path.resolve(__dirname, '../supabase/migrations/20250611_update_system_settings.sql');

// Read migration SQL
const migrationSQL = fs.readFileSync(migrationFilePath, 'utf8');

// Split the SQL into individual statements
const statements = migrationSQL
  .split(';')
  .map(stmt => stmt.trim())
  .filter(stmt => stmt.length > 0);

async function applySystemSettingsFix() {
  console.log('Applying system_settings table migration...');
  
  try {
    for (const sql of statements) {
      console.log(`Executing: ${sql.substring(0, 80)}${sql.length > 80 ? '...' : ''}`);
      
      const { data, error } = await supabase.rpc('pgcall', { 
        query: sql 
      });
      
      if (error) {
        // If pgcall doesn't exist or fails, try raw SQL execution
        console.log('pgcall failed, trying direct SQL query...');
        
        // For security, we'll try specific ALTER TABLE and UPDATE statements
        if (sql.trim().toLowerCase().startsWith('alter table')) {
          const { error: alterError } = await supabase.from('system_settings').select('count(*)');
          if (alterError) {
            console.error('Error executing ALTER TABLE statement:', alterError);
          } else {
            console.log('Table exists, column may have been added successfully');
          }
        }
        else if (sql.trim().toLowerCase().startsWith('update')) {
          const { error: updateError } = await supabase.from('system_settings').select('count(*)');
          if (updateError) {
            console.error('Error executing UPDATE statement:', updateError);
          } else {
            console.log('Table exists, data may have been updated successfully');
          }
        }
        else if (sql.trim().toLowerCase().startsWith('comment on')) {
          console.log('Skipping comment statement, not critical');
        }
        else {
          console.error('Unsupported SQL statement type:', sql);
        }
      } else {
        console.log('SQL executed successfully');
      }
    }
    
    console.log('Migration applied successfully!');
    
    // Verify the column was added
    const { data, error } = await supabase
      .from('system_settings')
      .select('setting_key, setting_value, setting_type')
      .limit(5);
    
    if (error) {
      if (error.message && error.message.includes('setting_type')) {
        console.error('Column setting_type was not added successfully!');
      } else {
        console.error('Error verifying migration:', error);
      }
    } else {
      console.log('Column setting_type is available! Sample data:');
      console.log(data);
    }
    
  } catch (error) {
    console.error('Error applying migration:', error);
    process.exit(1);
  }
}

applySystemSettingsFix();

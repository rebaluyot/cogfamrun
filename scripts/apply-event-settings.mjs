// Script to apply event settings migration
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve } from 'path';

async function applyEventSettingsMigration() {
  console.log('Starting migration for event settings...');
  
  // Load Supabase URL and key from environment or .env file
  let supabaseUrl = process.env.VITE_SUPABASE_URL;
  let supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    try {
      console.log('Looking for env variables in .env file...');
      const envFile = readFileSync('.env', 'utf8');
      const envVars = envFile.split('\n').reduce((acc, line) => {
        const [key, value] = line.split('=');
        if (key && value) acc[key.trim()] = value.trim();
        return acc;
      }, {});
      
      supabaseUrl = supabaseUrl || envVars.VITE_SUPABASE_URL;
      supabaseKey = supabaseKey || envVars.VITE_SUPABASE_ANON_KEY || envVars.VITE_SUPABASE_PUBLISHABLE_KEY;
    } catch (e) {
      console.warn('Could not read .env file', e);
    }
  }
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('Supabase URL or key not found. Please provide them as environment variables or in .env file.');
    return;
  }
  
  // Initialize Supabase client
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  try {
    // Load the SQL file
    const migrationPath = resolve('./supabase/migrations/20250611_add_event_settings.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf8');
    
    console.log('Migration file loaded successfully');
    console.log('Applying migration...');
    
    // Execute the SQL directly via rpc
    const { error } = await supabase.rpc('exec_sql', { sql_query: migrationSQL });
    
    if (error) {
      console.error('Migration failed:', error.message);
      
      // Try with simpler approach
      console.log('Attempting alternative migration approach...');
      const statements = migrationSQL.split(';').filter(stmt => stmt.trim());
      
      for (let i = 0; i < statements.length; i++) {
        const sql = statements[i].trim();
        if (!sql) continue;
        
        console.log(`Executing statement ${i+1}/${statements.length}...`);
        const { error } = await supabase.rpc('exec_sql', { sql_query: sql });
        if (error) {
          console.error(`Error executing statement ${i+1}:`, error.message);
          console.log('Statement:', sql);
        }
      }
    } else {
      console.log('Migration applied successfully!');
    }
    
    // Verify the new settings
    const { data: settings, error: settingsError } = await supabase
      .from('system_settings')
      .select('setting_key, setting_type')
      .in('setting_key', ['event_type', 'event_description', 'event_banner_url', 
                          'event_categories', 'event_routes', 'event_inclusions']);
      
    if (settingsError) {
      console.error('Failed to verify settings:', settingsError.message);
    } else {
      console.log('Verified settings:', settings);
    }
  } catch (e) {
    console.error('Unexpected error during migration:', e);
  }
}

// Run the migration
applyEventSettingsMigration().catch(console.error);

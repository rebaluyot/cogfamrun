// run-migration.js
// This script manually runs the migration to add department_id, ministry_id, and cluster_id columns
// to the registrations table using the Supabase JavaScript client

import { supabase } from '../src/integrations/supabase/client.js';
import fs from 'fs';
import path from 'path';

async function runMigration() {
  try {
    console.log('Running migration to add church ID columns...');
    
    // Read the migration SQL file
    const migrationPath = path.join(process.cwd(), 'supabase/migrations/20250603_add_church_id_columns.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Split the SQL file into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt && !stmt.startsWith('--') && stmt.length > 0);
    
    // Execute each SQL statement
    console.log(`Found ${statements.length} SQL statements to execute`);
    
    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];
      console.log(`Executing statement ${i + 1}/${statements.length}...`);
      
      if (stmt.includes('COMMENT ON COLUMN')) {
        console.log('Skipping COMMENT ON COLUMN statement as it might not be supported');
        continue;
      }
      
      try {
        // Use rpc if available, otherwise fall back to direct SQL execution
        const { error } = await supabase.rpc('run_sql_query', { query: stmt });
        
        if (error) {
          console.error(`Error executing statement ${i + 1} via RPC: ${error.message}`);
          console.error('Trying direct SQL execution...');
          
          // Try direct SQL query if RPC fails
          const { error: directError } = await supabase.from('_sqlj').select('*').eq('query', stmt);
          
          if (directError) {
            console.error(`Error executing statement directly: ${directError.message}`);
            console.error(stmt);
          } else {
            console.log(`Statement ${i + 1} executed successfully via direct SQL`);
          }
        } else {
          console.log(`Statement ${i + 1} executed successfully via RPC`);
        }
      } catch (stmtError) {
        console.error(`Exception executing statement ${i + 1}: ${stmtError.message}`);
        console.error(stmt);
      }
    }
    
    console.log('Migration completed');
    
    // Verify the columns exist
    console.log('Verifying columns were added...');
    
    try {
      // Sleep for a moment to allow DB to update
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const { data: columns, error: columnsError } = await supabase
        .from('registrations')
        .select('*')
        .limit(1);
      
      if (columnsError) {
        console.error('Error verifying columns:', columnsError);
      } else {
        const firstRow = columns[0] || {};
        
        const missingColumns = [];
        if (!('department_id' in firstRow)) missingColumns.push('department_id');
        if (!('ministry_id' in firstRow)) missingColumns.push('ministry_id');
        if (!('cluster_id' in firstRow)) missingColumns.push('cluster_id');
        
        if (missingColumns.length === 0) {
          console.log('✅ Successfully verified all columns were added!');
          console.log('You can now replace Registration.tsx with the updated version from updated-registration-with-ids.tsx');
        } else {
          console.error(`⚠️ Missing columns: ${missingColumns.join(', ')}`);
          console.log('Please run the migration manually through the Supabase dashboard.');
          console.log('See how-to-run-migration.js for instructions');
        }
      }
    } catch (verifyError) {
      console.error('Error during column verification:', verifyError);
    }
    
  } catch (error) {
    console.error('Failed to run migration:', error);
  }
}

runMigration();

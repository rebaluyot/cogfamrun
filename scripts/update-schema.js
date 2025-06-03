// update-schema.js
// This script adds the missing columns to the registrations table

import { createClient } from '@supabase/supabase-js';

// Fetch your supabase URL and key from environment variables or config files
const SUPABASE_URL = "https://lkumpuiyepjtztdwtcwg.supabase.co";
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || "";

if (!SUPABASE_SERVICE_KEY) {
  console.error('Error: SUPABASE_SERVICE_KEY environment variable is required');
  console.error('Please run this script with the service key:');
  console.error('SUPABASE_SERVICE_KEY=your_service_key node scripts/update-schema.js');
  process.exit(1);
}

// Create a Supabase client with the service key
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function updateSchema() {
  try {
    console.log('Checking if department_id column exists...');
    
    // Check if department_id column exists
    const { data: columnInfo, error: checkError } = await supabase
      .from('registrations')
      .select('department_id')
      .limit(1);
    
    if (checkError && checkError.message.includes('does not exist')) {
      console.log('Adding missing columns to registrations table...');
      
      // Add department_id column
      const { error: deptError } = await supabase.rpc('add_column', { 
        table_name: 'registrations',
        column_name: 'department_id',
        column_type: 'text'
      });
      
      if (deptError) {
        console.error('Error adding department_id column:', deptError);
      } else {
        console.log('Added department_id column');
      }
      
      // Add ministry_id column
      const { error: ministryError } = await supabase.rpc('add_column', { 
        table_name: 'registrations',
        column_name: 'ministry_id',
        column_type: 'text'
      });
      
      if (ministryError) {
        console.error('Error adding ministry_id column:', ministryError);
      } else {
        console.log('Added ministry_id column');
      }
      
      // Add cluster_id column
      const { error: clusterError } = await supabase.rpc('add_column', { 
        table_name: 'registrations',
        column_name: 'cluster_id',
        column_type: 'text'
      });
      
      if (clusterError) {
        console.error('Error adding cluster_id column:', clusterError);
      } else {
        console.log('Added cluster_id column');
      }
      
      console.log('Schema update completed');
    } else if (checkError) {
      console.error('Error checking column existence:', checkError);
    } else {
      console.log('The department_id column already exists. No changes needed.');
    }
  } catch (error) {
    console.error('Failed to update schema:', error);
  }
}

updateSchema();

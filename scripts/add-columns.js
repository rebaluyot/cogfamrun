// add-columns.js
// This script will add the missing columns to the registrations table
// using the Supabase client

import { supabase } from '../src/integrations/supabase/client.js';

async function addColumns() {
  try {
    console.log('Checking for missing columns in registrations table...');
    
    // Get the current structure of the registrations table
    const { data: registrations, error } = await supabase
      .from('registrations')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('Error fetching registrations:', error);
      return;
    }
    
    // Check if we need to add department_id
    if (registrations[0] && !('department_id' in registrations[0])) {
      console.log('department_id column is missing. Need to run migration.');
      
      console.log('\nTo apply the migration, you need to:');
      console.log('1. Log in to your Supabase dashboard at https://supabase.com/dashboard');
      console.log('2. Navigate to your project: lkumpuiyepjtztdwtcwg');
      console.log('3. Go to the SQL Editor');
      console.log('4. Create a new query and paste the following SQL:');
      
      console.log('\n-- Add department_id column if it doesn\'t exist');
      console.log('ALTER TABLE public.registrations ADD COLUMN IF NOT EXISTS department_id text;');
      console.log('\n-- Add ministry_id column if it doesn\'t exist');
      console.log('ALTER TABLE public.registrations ADD COLUMN IF NOT EXISTS ministry_id text;');
      console.log('\n-- Add cluster_id column if it doesn\'t exist');
      console.log('ALTER TABLE public.registrations ADD COLUMN IF NOT EXISTS cluster_id text;');
      console.log('\n-- Create indexes for better performance');
      console.log('CREATE INDEX IF NOT EXISTS idx_registrations_department_id ON public.registrations (department_id);');
      console.log('CREATE INDEX IF NOT EXISTS idx_registrations_ministry_id ON public.registrations (ministry_id);');
      console.log('CREATE INDEX IF NOT EXISTS idx_registrations_cluster_id ON public.registrations (cluster_id);');
      
      console.log('\n5. Run the SQL query');
      console.log('6. After the migration is successful, update your Registration.tsx file to use the new columns');
    } else {
      console.log('All required columns exist. No migration needed.');
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

addColumns();

# Fix Registration Errors - Implementation Steps

## Step 1: Check for Missing Columns

First, let's check if the database still needs the migration. Run the column check script:

```bash
node scripts/add-columns.js
```

This script will tell you if the columns are missing and need to be added.

## Step 2: Apply the Migration

### Option A: Automated Migration (Using run-migration.js)

```bash
# Make sure you have the supabase-js client installed
npm install @supabase/supabase-js

# Run the migration script
node scripts/run-migration.js
```

### Option B: Manual Migration (Through Supabase Dashboard)

1. Log in to your Supabase dashboard at https://supabase.com/dashboard
2. Navigate to your project: `lkumpuiyepjtztdwtcwg`
3. Go to the SQL Editor
4. Create a new query and paste the following SQL:

```sql
-- Add department_id column if it doesn't exist
ALTER TABLE public.registrations 
ADD COLUMN IF NOT EXISTS department_id text;

-- Add ministry_id column if it doesn't exist
ALTER TABLE public.registrations 
ADD COLUMN IF NOT EXISTS ministry_id text;

-- Add cluster_id column if it doesn't exist
ALTER TABLE public.registrations 
ADD COLUMN IF NOT EXISTS cluster_id text;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_registrations_department_id ON public.registrations (department_id);
CREATE INDEX IF NOT EXISTS idx_registrations_ministry_id ON public.registrations (ministry_id);
CREATE INDEX IF NOT EXISTS idx_registrations_cluster_id ON public.registrations (cluster_id);
```

5. Click "Run" to execute the SQL query

## Step 3: Verify the Columns Were Added

Run the following query in the Supabase SQL Editor:

```sql
SELECT column_name 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'registrations';
```

Verify that `department_id`, `ministry_id`, and `cluster_id` appear in the results.

## Step 4: Update Registration.tsx

Once you've confirmed the columns exist, replace your current Registration.tsx with the updated version:

```bash
cp updated-registration-with-ids.tsx src/pages/Registration.tsx
```

## Step 5: Test the Registration Flow

1. Run your application:
   ```bash
   npm run dev
   ```

2. Navigate to the registration page
3. Complete a test registration with church attendee details
4. Verify that the registration is successful and stored in the database with the ID columns

## Step 6: Update useRegistrations.ts to Use IDs

If everything works correctly, you may want to update the useRegistrations.ts hook to use the IDs for better querying capabilities.

## Troubleshooting

If you encounter any issues during this process:

1. Check browser console for detailed error messages
2. Verify Supabase connection is working
3. Check if the registration has department, ministry, and cluster names stored without IDs
4. If you get schema errors, run the migration again or check if there are any other schema issues

## Rollback Plan

If needed, the original Registration.tsx is already set up with a fallback mechanism that can work without the ID columns. The application will continue to function using just the name fields for departments, ministries, and clusters.

// Instructions for adding the missing columns to the registrations table

/*
Step 1: Log in to the Supabase dashboard
- Go to https://supabase.com/dashboard
- Select your project: lkumpuiyepjtztdwtcwg

Step 2: Navigate to the SQL Editor
- Click on "SQL Editor" in the left sidebar

Step 3: Create a new query
- Click on "New Query"
- Paste the following SQL:

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

Step 4: Run the SQL Query
- Click the "Run" button

Step 5: Verify the columns were added
- Run the following query to check:

```sql
SELECT column_name 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'registrations';
```

Step 6: Update Registration.tsx
- After confirming the columns exist, update Registration.tsx to include department_id, ministry_id, and cluster_id in the registration data
*/

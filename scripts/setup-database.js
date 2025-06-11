// setup-database.js
// This script creates the necessary database structure for a fresh installation of FamRun

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { promisify } from 'util';
import readline from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration - this will be loaded from .env.local in production
const config = {
  SUPABASE_URL: process.env.SUPABASE_URL || "https://lkumpuiyepjtztdwtcwg.supabase.co",
  SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_KEY || ""
};

if (!config.SUPABASE_SERVICE_KEY) {
  console.error("Error: SUPABASE_SERVICE_KEY environment variable is required");
  console.error("Please run this script with the service key:");
  console.error("SUPABASE_SERVICE_KEY=your_service_key node scripts/setup-database.js");
  process.exit(1);
}

const supabase = createClient(config.SUPABASE_URL, config.SUPABASE_SERVICE_KEY);

// Helper function to create a console interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

// Database migration SQL - core tables creation
const createCoreTables = `
-- Create admin_users table
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  is_admin BOOLEAN DEFAULT FALSE,
  can_distribute_kits BOOLEAN DEFAULT FALSE
);

-- Create departments table
CREATE TABLE IF NOT EXISTS departments (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create ministries table
CREATE TABLE IF NOT EXISTS ministries (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  department_id INTEGER REFERENCES departments(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create clusters table
CREATE TABLE IF NOT EXISTS clusters (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  ministry_id INTEGER REFERENCES ministries(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  price NUMERIC NOT NULL,
  inclusions TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create registrations table
CREATE TABLE IF NOT EXISTS registrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  registration_id TEXT UNIQUE NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  age INTEGER,
  gender TEXT,
  category TEXT NOT NULL,
  price NUMERIC NOT NULL,
  status TEXT DEFAULT 'pending',
  is_church_attendee BOOLEAN DEFAULT FALSE,
  department TEXT,
  ministry TEXT,
  cluster TEXT,
  emergency_contact TEXT,
  emergency_phone TEXT,
  medical_conditions TEXT,
  shirt_size TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- ID columns for relationships
  department_id TEXT,
  ministry_id TEXT,
  cluster_id TEXT,
  
  -- Payment fields
  payment_method_id INTEGER,
  payment_reference_number TEXT,
  payment_proof_url TEXT,
  payment_status TEXT DEFAULT 'pending',
  payment_confirmed_by TEXT,
  payment_date TIMESTAMPTZ,
  payment_notes TEXT,
  amount_paid NUMERIC DEFAULT 0,
  
  -- Kit distribution fields
  kit_claimed BOOLEAN DEFAULT FALSE,
  claimed_at TIMESTAMPTZ,
  processed_by TEXT,
  actual_claimer TEXT,
  claim_location_id INTEGER,
  claim_notes TEXT
);

-- Create email_notifications table
CREATE TABLE IF NOT EXISTS email_notifications (
  id SERIAL PRIMARY KEY,
  email TEXT NOT NULL,
  recipient_name TEXT,
  registration_id TEXT,
  email_type TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create system_settings table for app configuration
CREATE TABLE IF NOT EXISTS system_settings (
  id SERIAL PRIMARY KEY,
  setting_key TEXT NOT NULL UNIQUE,
  setting_value TEXT,
  setting_type TEXT DEFAULT 'string',
  description TEXT,
  is_secret BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_registrations_status ON registrations(status);
CREATE INDEX IF NOT EXISTS idx_registrations_payment_status ON registrations(payment_status);
CREATE INDEX IF NOT EXISTS idx_registrations_department_id ON registrations(department_id);
CREATE INDEX IF NOT EXISTS idx_registrations_ministry_id ON registrations(ministry_id);
CREATE INDEX IF NOT EXISTS idx_registrations_cluster_id ON registrations(cluster_id);
CREATE INDEX IF NOT EXISTS idx_registrations_kit_claimed ON registrations(kit_claimed);
CREATE INDEX IF NOT EXISTS idx_email_notifications_status ON email_notifications(status);
`;

// Payment system tables
const createPaymentTables = `
-- Create payment_methods table
CREATE TABLE IF NOT EXISTS payment_methods (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  account_number TEXT NOT NULL,
  qr_image_url TEXT,
  account_type TEXT NOT NULL DEFAULT 'gcash',
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create payment_history table
CREATE TABLE IF NOT EXISTS payment_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  registration_id UUID NOT NULL,
  payment_status TEXT NOT NULL,
  previous_status TEXT,
  changed_by TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Foreign key reference to registrations
  CONSTRAINT fk_payment_history_registration FOREIGN KEY (registration_id) 
  REFERENCES registrations(id) ON DELETE CASCADE
);

-- Create payment_receipts table
CREATE TABLE IF NOT EXISTS payment_receipts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  registration_id UUID NOT NULL UNIQUE,
  receipt_number TEXT NOT NULL UNIQUE,
  receipt_url TEXT,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  generated_by TEXT,
  
  -- Foreign key reference to registrations
  CONSTRAINT fk_payment_receipt_registration FOREIGN KEY (registration_id) 
  REFERENCES registrations(id) ON DELETE CASCADE
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_payment_methods_active ON payment_methods(active);
CREATE INDEX IF NOT EXISTS idx_payment_history_registration_id ON payment_history(registration_id);
CREATE INDEX IF NOT EXISTS idx_payment_history_created_at ON payment_history(created_at);
CREATE INDEX IF NOT EXISTS idx_payment_receipts_registration_id ON payment_receipts(registration_id);
CREATE INDEX IF NOT EXISTS idx_payment_receipts_receipt_number ON payment_receipts(receipt_number);

-- Enable RLS on payment tables
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_receipts ENABLE ROW LEVEL SECURITY;
`;

// Kit distribution tables
const createKitDistributionTables = `
-- Create claim_locations table
CREATE TABLE IF NOT EXISTS claim_locations (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
`;

// RLS policies
const createRLSPolicies = `
-- Create RLS policies for payment_methods
CREATE POLICY "Allow public read of payment_methods" 
  ON public.payment_methods 
  FOR SELECT 
  TO PUBLIC
  USING (true);

CREATE POLICY "Allow anyone to insert payment_methods" 
  ON public.payment_methods 
  FOR INSERT 
  TO PUBLIC
  USING (true);

CREATE POLICY "Allow anyone to update payment_methods" 
  ON public.payment_methods 
  FOR UPDATE 
  TO PUBLIC
  USING (true);

CREATE POLICY "Allow anyone to delete payment_methods" 
  ON public.payment_methods 
  FOR DELETE 
  TO PUBLIC
  USING (true);

-- Create RLS policies for payment_history
CREATE POLICY "Allow anyone to read payment_history" 
  ON payment_history 
  FOR SELECT 
  TO PUBLIC
  USING (true);

CREATE POLICY "Allow anyone to insert payment_history" 
  ON payment_history 
  FOR INSERT 
  TO authenticated
  WITH CHECK (true);

-- Create RLS policies for payment_receipts
CREATE POLICY "Allow anyone to read payment_receipts" 
  ON public.payment_receipts 
  FOR SELECT 
  TO PUBLIC
  USING (true);

CREATE POLICY "Allow anyone to insert payment_receipts" 
  ON public.payment_receipts 
  FOR INSERT 
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow anyone to update payment_receipts" 
  ON public.payment_receipts 
  FOR UPDATE 
  TO authenticated
  USING (true);

CREATE POLICY "Allow anyone to delete payment_receipts" 
  ON public.payment_receipts 
  FOR DELETE 
  TO authenticated
  USING (true);
`;

// Storage bucket setup
const createStorageBuckets = `
-- Create storage bucket for QR images if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'payment-qr-images',
  'payment-qr-images',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/jpg']::text[]
)
ON CONFLICT (id) DO UPDATE
SET 
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/jpg']::text[];

-- Create storage bucket for payment proofs
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'payment-proofs',
  'payment-proofs',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/jpg']::text[]
)
ON CONFLICT (id) DO UPDATE
SET 
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/jpg']::text[];
`;

// Default system settings
const getDefaultSettings = () => `
-- Insert default system settings
INSERT INTO system_settings (setting_key, setting_value, setting_type, description, is_secret) 
VALUES 
('app_title', 'COG FamRun 2025', 'string', 'The title of the application shown in various places', false),
('app_logo_url', '/assets/solid-fam-run-logo.png', 'string', 'URL to the application logo image', false),
('primary_color', '#2563eb', 'string', 'Primary theme color (hex)', false),
('secondary_color', '#f59e0b', 'string', 'Secondary theme color (hex)', false),
('emailjs_service_id', '', 'string', 'EmailJS Service ID', false),
('emailjs_template_id', '', 'string', 'EmailJS Template ID for registration confirmations', false),
('emailjs_public_key', '', 'string', 'EmailJS Public Key', false),
('emailjs_private_key', '', 'string', 'EmailJS Private Key (optional)', true),
('registration_deadline', '2025-08-01T00:00:00Z', 'datetime', 'Deadline for event registrations', false),
('event_date', '2025-08-22T05:00:00Z', 'datetime', 'Date and time of the main event', false),
('supabase_url', '${config.SUPABASE_URL}', 'string', 'Supabase project URL', false),
('supabase_publishable_key', '', 'string', 'Supabase anon/publishable key', true)
ON CONFLICT (setting_key) DO NOTHING;
`;

// Default admin user
const createDefaultAdmin = `
-- Insert default admin user (password: admin123)
INSERT INTO admin_users (username, password_hash, is_admin, can_distribute_kits)
VALUES ('admin', '$2a$10$hACwQ5/HQI6FhbIIK5C5IOocXDsjOYuokuCJUgzouIm7QFn1R5HEa', true, true)
ON CONFLICT (username) DO NOTHING;
`;

// Default race categories
const createDefaultCategories = `
-- Insert default race categories
INSERT INTO categories (name, price, inclusions)
VALUES
('3K', 1500, ARRAY['Race bib', 'Finisher medal', 'Water bottle']),
('6K', 2500, ARRAY['Race bib', 'Finisher medal', 'Water bottle', 'T-shirt']),
('10K', 3500, ARRAY['Race bib', 'Finisher medal', 'Water bottle', 'T-shirt', 'Cap'])
ON CONFLICT (name) DO NOTHING;
`;

// Execute SQL for database setup
async function executeSql(sql, description) {
  console.log(`Executing SQL: ${description}...`);
  try {
    const { error } = await supabase.rpc('exec_sql', { sql_query: sql });
    
    if (error) {
      console.error(`Error executing ${description}:`, error);
      return false;
    }
    
    console.log(`Successfully executed ${description}`);
    return true;
  } catch (err) {
    console.error(`Exception executing ${description}:`, err);
    return false;
  }
}

// Main function to run the database setup
async function setupDatabase() {
  console.log("FamRun Database Setup Utility");
  console.log("------------------------------\n");
  
  console.log("This utility will set up the database structure for a fresh installation of FamRun.\n");
  
  const confirmation = await question("This will create all required tables and may overwrite existing data. Continue? (y/n): ");
  
  if (confirmation.toLowerCase() !== 'y') {
    console.log("Operation cancelled.");
    rl.close();
    return;
  }
  
  console.log("\nSetting up database. Please wait...\n");
  
  // Execute all SQL scripts
  try {
    // 1. Create core tables
    await executeSql(createCoreTables, "Core Tables Creation");
    
    // 2. Create payment system tables
    await executeSql(createPaymentTables, "Payment System Tables");
    
    // 3. Create kit distribution tables
    await executeSql(createKitDistributionTables, "Kit Distribution Tables");
    
    // 4. Create RLS policies
    await executeSql(createRLSPolicies, "RLS Policies");
    
    // 5. Create storage buckets
    await executeSql(createStorageBuckets, "Storage Buckets");
    
    // 6. Insert default settings
    await executeSql(getDefaultSettings(), "Default System Settings");
    
    // 7. Create default admin user
    await executeSql(createDefaultAdmin, "Default Admin User");
    
    // 8. Create default race categories
    await executeSql(createDefaultCategories, "Default Race Categories");
    
    console.log("\n✅ Database setup completed successfully!\n");
    console.log("Default admin credentials:");
    console.log("  Username: admin");
    console.log("  Password: admin123\n");
    console.log("Please remember to change the default password after first login.");
    
  } catch (error) {
    console.error("An error occurred during database setup:", error);
  } finally {
    rl.close();
  }
}

// Run the setup
setupDatabase();

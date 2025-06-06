// Types for database schema

export interface Registration {
  id: string | number;
  registration_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  age: number;
  gender: string;
  address?: string;
  emergency_contact?: string;
  emergency_phone?: string;
  shirt_size: string;
  category: string;
  department?: string;
  ministry?: string;
  cluster?: string;
  payment_status?: string;
  payment_method?: number;
  payment_reference_number?: string;
  payment_proof_url?: string;
  payment_confirmed_by?: string;
  payment_confirmed_at?: string;
  payment_notes?: string;
  status?: string;
  amount_paid?: number;
  created_at: string;
  updated_at?: string;
  disclaimer_accepted?: string;
  kit_claimed?: boolean;
  claimed_at?: string | null;
  claimed_by?: string | null;
  claim_notes?: string | null;
}

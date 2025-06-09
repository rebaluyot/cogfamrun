export interface Registration {
  id: string | number;
  registration_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  category: string;
  shirt_size: string;
  created_at: string;
  status?: string;
  price?: number;
  amount_paid?: number;
  kit_claimed?: boolean;
  claimed_at?: string | null;
  processed_by?: string | null;
  actual_claimer?: string | null;
  claim_location_id?: number | null;
  claim_location_name?: string | null;
  claim_notes?: string | null;
  [key: string]: any; // For any other properties
}

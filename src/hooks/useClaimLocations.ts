import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

// Use the proper type from the Database type definition
export type ClaimLocation = Database['public']['Tables']['claim_locations']['Row'];

export const useClaimLocations = () => {
  // Fetch all active claim locations
  const { data: locations, isLoading, error, refetch } = useQuery({
    queryKey: ['claimLocations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('claim_locations')
        .select('*')
        .eq('active', true)
        .order('name');

      if (error) {
        throw error;
      }

      return data as ClaimLocation[];
    },
  });

  // Add a new claim location
  const addLocation = async (location: Database['public']['Tables']['claim_locations']['Insert']) => {
    const { data, error } = await supabase
      .from('claim_locations')
      .insert([location])
      .select();

    if (error) {
      throw error;
    }

    // Refetch the locations after adding
    refetch();
    return data;
  };

  // Update a claim location
  const updateLocation = async (id: number, updates: Database['public']['Tables']['claim_locations']['Update']) => {
    const { data, error } = await supabase
      .from('claim_locations')
      .update(updates)
      .eq('id', id)
      .select();

    if (error) {
      throw error;
    }

    // Refetch the locations after updating
    refetch();
    return data;
  };

  // Delete a claim location (or deactivate it)
  const deactivateLocation = async (id: number) => {
    const { data, error } = await supabase
      .from('claim_locations')
      .update({ active: false })
      .eq('id', id)
      .select();

    if (error) {
      throw error;
    }

    // Refetch the locations after deactivating
    refetch();
    return data;
  };

  return {
    locations: locations || [],
    isLoading,
    error,
    addLocation,
    updateLocation,
    deactivateLocation,
  };
};

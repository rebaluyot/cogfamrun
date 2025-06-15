import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Registration } from '@/types/database';

export interface KitClaimData {
  id: string | number;
  kit_claimed: boolean;
  claimed_at?: string | null;
  processed_by?: string | null; // The staff user who processed the claim
  actual_claimer?: string | null; // Person who actually claimed the kit
  claim_location_id?: number | null; // Location where the kit was claimed
  claim_notes?: string | null;
}

export const useKitDistribution = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Parse QR code data into structured format
  const parseQRCode = (qrData: string): { 
    registrationId: string;
    participantName: string;
    category: string;
    price: number;
    shirtSize: string;
  } | null => {
    try {
      console.warn(qrData);
        // QR data format: CogFamRun2025|registration_id|participant_name|category|price|shirt_size
      const [prefix, registrationId, participantName, category, price, shirtSize] = qrData.split('|');
      
      if (prefix !== 'CogFamRun2025') {
        console.error('Invalid QR code prefix');
        return null;
      }
      
      return {
        registrationId,
        participantName,
        category,
        price: parseFloat(price),
        shirtSize
      };
    } catch (error) {
      console.error('Error parsing QR code:', error);
      return null;
    }
  };

  // Lookup registration by QR code data
  const lookupRegistration = async (qrData: string): Promise<Registration & { qrData: ReturnType<typeof parseQRCode> }> => {
    const parsedData = parseQRCode(qrData);
    
    if (!parsedData) {
      throw new Error('Invalid QR code format');
    }
    
    const { data, error } = await supabase
      .from('registrations')
      .select('*')
      .eq('registration_id', parsedData.registrationId)
      .single();
    
    if (error) {
      throw new Error(`Error looking up registration: ${error.message}`);
    }
    
    if (!data) {
      throw new Error('Registration not found');
    }

    // Create a properly typed Registration object with QR data
    // Use a type assertion to handle potentially missing fields
    const anyData = data as any;
    const result: Registration & { qrData: ReturnType<typeof parseQRCode> } = {
      ...anyData,
      amount_paid: anyData.price || 0,
      qrData: parsedData,
      // Add default values for kit claim fields to ensure they always exist
      kit_claimed: anyData.kit_claimed === undefined ? false : anyData.kit_claimed,
      claimed_at: anyData.claimed_at === undefined ? null : anyData.claimed_at,
      processed_by: anyData.processed_by === undefined ? null : anyData.processed_by,
      actual_claimer: anyData.actual_claimer === undefined ? null : anyData.actual_claimer,
      claim_location_id: anyData.claim_location_id === undefined ? null : anyData.claim_location_id,
      claim_notes: anyData.claim_notes === undefined ? null : anyData.claim_notes
    };

    console.warn(result);
    
    return result;
  };
  
  // Update kit claim status
  const updateKitClaimStatus = useMutation({
    mutationFn: async (claimData: KitClaimData) => {
      // Convert ID to string if it's a number
      const id = typeof claimData.id === 'number' ? claimData.id.toString() : claimData.id;
      
      // Use a type assertion with Record to satisfy TypeScript
      const updateData = {
        kit_claimed: claimData.kit_claimed,
        claimed_at: claimData.claimed_at,
        processed_by: claimData.processed_by, // Staff who processed the claim
        actual_claimer: claimData.actual_claimer, // Person who claimed the kit
        claim_location_id: claimData.claim_location_id, // Location where claimed
        claim_notes: claimData.claim_notes
      };
      
      const { data, error } = await supabase
        .from('registrations')
        .update(updateData as Record<string, any>)
        .eq('id', id)
        .select();
      
      if (error) {
        throw new Error(`Error updating kit claim status: ${error.message}`);
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['registrations'] });
      toast({
        title: "Success",
        description: "Kit claim status updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  
  return {
    parseQRCode,
    lookupRegistration,
    updateKitClaimStatus
  };
};

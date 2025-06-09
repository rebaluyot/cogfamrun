import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Registration } from '@/types/database';

export interface KitClaimData {
  id: string | number;
  kit_claimed: boolean;
  claimed_at?: string | null;
  claimed_by?: string | null;
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
    const result = {
      ...(data as unknown as Registration),
      amount_paid: data.price,
      qrData: parsedData
    };

    console.warn(result);
    
    // Add kit claim fields if they don't exist
    if (result.kit_claimed === undefined) result.kit_claimed = false;
    if (result.claimed_at === undefined) result.claimed_at = null;
    if (result.claimed_by === undefined) result.claimed_by = null;
    if (result.claim_notes === undefined) result.claim_notes = null;
    
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
        claimed_by: claimData.claimed_by,
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

  // Add debug log
  console.log("useKitDistribution hook initialized");
  
  return {
    parseQRCode,
    lookupRegistration,
    updateKitClaimStatus
  };
};

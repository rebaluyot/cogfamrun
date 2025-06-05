import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useDepartments } from './useDepartments';
import { useMinistries } from './useMinistries';
import { useClusters } from './useClusters';
import { usePaymentMethods } from './usePaymentMethods';

export const useRegistrations = () => {
  const { data: departments } = useDepartments();
  const { data: ministries } = useMinistries();
  const { data: clusters } = useClusters();
  const { data: paymentMethods } = usePaymentMethods();

  return useQuery({
    queryKey: ['registrations'],
    queryFn: async () => {
      // First get all registrations
      const { data, error } = await supabase
        .from('registrations')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        throw new Error(`Error fetching registrations: ${error.message}`);
      }
      
      // Create maps for efficient lookups
      const departmentMap = new Map(departments?.map(d => [d.id.toString(), d.name]) || []);
      const ministryMap = new Map(ministries?.map(m => [m.id.toString(), m.name]) || []);
      const clusterMap = new Map(clusters?.map(c => [c.id.toString(), c.name]) || []);
      const paymentMethodMap = new Map(paymentMethods?.map(p => [p.id.toString(), p.name]) || []);

      // Transform registrations to show names instead of IDs
      const enhancedRegistrations = data?.map((registration: any) => {
        // For department, just use what's in the database (which is currently just name)
        const departmentName = registration.department;
        
        // For ministry, just use what's in the database (which is currently just name)
        const ministryName = registration.ministry;
        
        // For cluster, just use what's in the database (which is currently just name)
        const clusterName = registration.cluster;

        // Get payment method name if available
        const paymentMethodName = registration.payment_method_id ? 
          paymentMethodMap.get(registration.payment_method_id.toString()) : undefined;
        
        return {
          ...registration,
          // Add payment method name for display
          payment_method_name: paymentMethodName
        };
      });
      
      return enhancedRegistrations;
    },
    enabled: !!departments && !!ministries && !!clusters && !!paymentMethods,
  });
};

export const useRegistrationStats = () => {
  return useQuery({
    queryKey: ['registrations-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('registrations')
        .select('*');
      
      if (error) {
        throw new Error(`Error fetching registration stats: ${error.message}`);
      }
      
      const stats = {
        total: data.length,
        threek: data.filter(r => r.category === '3K').length,
        sixk: data.filter(r => r.category === '6K').length,
        tenk: data.filter(r => r.category === '10K').length,
        confirmed: data.filter(r => r.status === 'confirmed').length,
        pending: data.filter(r => r.status === 'pending').length,
        cancelled: data.filter(r => r.status === 'cancelled').length,
        revenue: data.reduce((sum, registration) => sum + (registration.price || 0), 0),
      };
      
      return stats;
    },
  });
};

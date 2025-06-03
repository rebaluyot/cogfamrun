import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useRegistrations = () => {
  return useQuery({
    queryKey: ['registrations'],
    queryFn: async () => {
      // First get all registrations
      const { data: registrations, error } = await supabase
        .from('registrations')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;

      // Get all departments, ministries, and clusters for lookup
      const [departmentsRes, ministriesRes, clustersRes] = await Promise.all([
        supabase.from('departments').select('id, name'),
        supabase.from('ministries').select('id, name'),
        supabase.from('clusters').select('id, name')
      ]);

      const departments = departmentsRes.data || [];
      const ministries = ministriesRes.data || [];
      const clusters = clustersRes.data || [];

      // Create lookup maps
      const departmentMap = new Map(departments.map(d => [d.id.toString(), d.name]));
      const ministryMap = new Map(ministries.map(m => [m.id.toString(), m.name]));
      const clusterMap = new Map(clusters.map(c => [c.id.toString(), c.name]));

      // Transform registrations to show names instead of IDs
      const enhancedRegistrations = registrations?.map((registration: any) => {
        // If department, ministry, cluster are already set as names (which is the case until migration is run), use them directly
        // After migration is run, we'll use the department_id, ministry_id, and cluster_id columns
        
        // For department, just use what's in the database (which is currently just name)
        const departmentName = registration.department;
        
        // For ministry, just use what's in the database (which is currently just name)
        const ministryName = registration.ministry;
        
        // For cluster, just use what's in the database (which is currently just name)
        const clusterName = registration.cluster;
        
        return {
          ...registration,
          department: departmentName,
          ministry: ministryName,
          cluster: clusterName,
        };
      }) || [];

      return enhancedRegistrations;
    },
  });
};

export const useRegistrationStats = () => {
  return useQuery({
    queryKey: ['registration-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('registrations')
        .select('category, price, status');
      
      if (error) throw error;
      
      const stats = {
        total: data.length,
        threek: data.filter(r => r.category === '3K').length,
        sixk: data.filter(r => r.category === '6K').length,
        tenk: data.filter(r => r.category === '10K').length,
        revenue: data.filter(r => r.status === 'confirmed').reduce((sum, r) => sum + r.price, 0),
        confirmed: data.filter(r => r.status === 'confirmed').length,
        pending: data.filter(r => r.status === 'pending').length,
        cancelled: data.filter(r => r.status === 'cancelled').length,
      };
      
      return stats;
    },
  });
};

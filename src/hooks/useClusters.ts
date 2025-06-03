import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useClusters = () => {
  return useQuery({
    queryKey: ['clusters'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clusters')
        .select(`
          *,
          ministry:ministries(
            id, 
            name, 
            department:departments(id, name)
          )
        `)
        .order('name');
      
      if (error) throw error;
      return data;
    },
  });
};

export const useAddCluster = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (cluster: { name: string; ministry_id: number }) => {
      const { data, error } = await supabase
        .from('clusters')
        .insert([cluster])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clusters'] });
    },
  });
};

export const useDeleteCluster = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase
        .from('clusters')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clusters'] });
    },
  });
};

export const useUpdateCluster = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({
      id,
      cluster
    }: {
      id: number;
      cluster: { name: string; ministry_id: number }
    }) => {
      const { data, error } = await supabase
        .from('clusters')
        .update(cluster)
        .eq('id', id)
        .select();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clusters'] });
    },
  });
};

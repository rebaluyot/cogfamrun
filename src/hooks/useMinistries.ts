import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useMinistries = () => {
  return useQuery({
    queryKey: ['ministries'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ministries')
        .select(`
          *,
          department:departments(id, name)
        `)
        .order('name');
      
      if (error) throw error;
      return data;
    },
  });
};

export const useAddMinistry = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (ministry: { name: string; department_id: number }) => {
      const { data, error } = await supabase
        .from('ministries')
        .insert([ministry])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ministries'] });
    },
  });
};

export const useDeleteMinistry = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase
        .from('ministries')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ministries'] });
      queryClient.invalidateQueries({ queryKey: ['clusters'] });
    },
  });
};

export const useUpdateMinistry = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({
      id,
      ministry
    }: {
      id: number;
      ministry: { name: string; department_id: number }
    }) => {
      const { data, error } = await supabase
        .from('ministries')
        .update(ministry)
        .eq('id', id)
        .select();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ministries'] });
    },
  });
};

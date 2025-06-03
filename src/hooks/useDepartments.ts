import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useDepartments = () => {
  return useQuery({
    queryKey: ['departments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('departments')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data;
    },
  });
};

export const useAddDepartment = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (department: { name: string; description?: string }) => {
      const { data, error } = await supabase
        .from('departments')
        .insert([department])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
    },
  });
};

export const useDeleteDepartment = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase
        .from('departments')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      queryClient.invalidateQueries({ queryKey: ['ministries'] });
      queryClient.invalidateQueries({ queryKey: ['clusters'] });
    },
  });
};

export const useUpdateDepartment = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({
      id,
      department
    }: {
      id: number;
      department: { name: string; description?: string }
    }) => {
      const { data, error } = await supabase
        .from('departments')
        .update(department)
        .eq('id', id)
        .select();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
    },
  });
};

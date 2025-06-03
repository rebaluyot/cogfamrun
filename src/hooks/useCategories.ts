
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useCategories = () => {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('price');
      
      if (error) throw error;
      return data;
    },
  });
};

export const useAddCategory = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (category: { name: string; price: number; inclusions: string[] }) => {
      const { data, error } = await supabase
        .from('categories')
        .insert([category])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
};

export const useDeleteCategory = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
};

export const useUpdateCategory = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({
      id,
      category
    }: {
      id: number;
      category: { name: string; price: number; inclusions: string[] }
    }) => {
      const { data, error } = await supabase
        .from('categories')
        .update(category)
        .eq('id', id)
        .select();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
};

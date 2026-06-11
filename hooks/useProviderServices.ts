import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export function useProviderServices(providerId?: string) {
  return useQuery({
    queryKey: ['provider_services', providerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('provider_services')
        .select('*')
        .eq('provider_id', providerId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!providerId,
    staleTime: 1000 * 60 * 5,
  });
}

export function useToggleServiceStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'active' | 'inactive' }) => {
      const { error } = await supabase
        .from('provider_services')
        .update({ status })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['provider_services'] });
    },
  });
}

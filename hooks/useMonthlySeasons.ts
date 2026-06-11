import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export function useMonthlySeasons(month: number) {
  return useQuery({
    queryKey: ['monthly_seasons', month],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('monthly_seasons')
        .select(`
          *,
          species ( name, local_name, image_url )
        `)
        .eq('month', month);
      if (error) throw error;
      return data;
    },
    staleTime: 1000 * 60 * 60 * 24, // 24 hours
    gcTime: 1000 * 60 * 60 * 48,
    retry: 2,
    enabled: month >= 1 && month <= 12,
  });
}

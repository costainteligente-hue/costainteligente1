import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

interface ZoneFilters {
  level?: 'principiante' | 'intermedio' | 'avanzado';
  speciesId?: string;
}

export function useFishingZones(filters: ZoneFilters = {}) {
  return useQuery({
    queryKey: ['fishing_zones', filters],
    queryFn: async () => {
      let query = supabase
        .from('fishing_zones')
        .select(`
          *,
          zone_fish (
            species_id,
            probability,
            species ( name, local_name )
          )
        `)
        .eq('is_active', true);

      if (filters.level) {
        query = query.eq('level', filters.level);
      }

      const { data, error } = await query.order('name');
      if (error) throw error;
      return data;
    },
    staleTime: 1000 * 60 * 60 * 24, // 24 hours
    gcTime: 1000 * 60 * 60 * 48,
    retry: 2,
  });
}

export function useZoneDetail(zoneId: string) {
  return useQuery({
    queryKey: ['fishing_zone', zoneId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fishing_zones')
        .select(`
          *,
          zone_fish (
            species_id,
            probability,
            species ( name, local_name, image_url )
          ),
          zone_reviews (
            id, rating, comment, created_at,
            profiles ( full_name )
          )
        `)
        .eq('id', zoneId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!zoneId,
    staleTime: 1000 * 60 * 30,
  });
}

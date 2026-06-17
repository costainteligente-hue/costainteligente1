/**
 * useFishingZones — Costa Inteligente
 */

import { useQuery } from '@tanstack/react-query';
import { fishingZonesRepository } from '@/lib/repositories/fishing-zones.repository';

interface ZoneFilters {
  level?: 'principiante' | 'intermedio' | 'avanzado';
}

export function useFishingZones(filters: ZoneFilters = {}) {
  return useQuery({
    queryKey: ['fishing_zones', filters],
    queryFn: () => fishingZonesRepository.findAllActive(filters.level),
    staleTime: 1000 * 60 * 60 * 24,
    gcTime: 1000 * 60 * 60 * 48,
    retry: 2,
  });
}

export function useZoneDetail(zoneId: string) {
  return useQuery({
    queryKey: ['fishing_zone', zoneId],
    queryFn: () => fishingZonesRepository.findById(zoneId),
    enabled: !!zoneId,
    staleTime: 1000 * 60 * 30,
  });
}

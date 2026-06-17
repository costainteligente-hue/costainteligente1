/**
 * useMonthlySeasons — Costa Inteligente
 */

import { useQuery } from '@tanstack/react-query';
import { seasonsRepository } from '@/lib/repositories/seasons.repository';

export function useMonthlySeasons(month: number) {
  return useQuery({
    queryKey: ['monthly_seasons', month],
    queryFn: () => seasonsRepository.findByMonth(month),
    staleTime: 1000 * 60 * 60 * 24,
    gcTime: 1000 * 60 * 60 * 48,
    retry: 2,
    enabled: month >= 1 && month <= 12,
  });
}

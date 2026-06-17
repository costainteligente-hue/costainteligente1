/**
 * useReservations — Costa Inteligente
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reservationsRepository } from '@/lib/repositories/reservations.repository';
import { useAuthStore } from '@/stores/authStore';

export function useClientReservations() {
  const { user } = useAuthStore();
  return useQuery({
    queryKey: ['reservations', 'client', user?.id],
    queryFn: () => reservationsRepository.findByClientId(user!.id),
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5,
  });
}

export function useProviderReservations(providerId?: string) {
  return useQuery({
    queryKey: ['reservations', 'provider', providerId],
    queryFn: () => reservationsRepository.findByProviderId(providerId!),
    enabled: !!providerId,
    staleTime: 1000 * 60 * 2,
  });
}

export function useCreateReservation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      clientId: string;
      serviceId: string;
      providerId: string;
      reservationDate: string;
      partySize: number;
      amount: number;
    }) => reservationsRepository.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
    },
  });
}

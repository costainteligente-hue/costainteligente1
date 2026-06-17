/**
 * useProviderServices — Costa Inteligente
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { providerServicesRepository } from '@/lib/repositories/provider-services.repository';

export function useProviderServices(providerId?: string) {
  return useQuery({
    queryKey: ['provider_services', providerId],
    queryFn: () => providerServicesRepository.findByProviderId(providerId!),
    enabled: !!providerId,
    staleTime: 1000 * 60 * 5,
  });
}

export function useToggleServiceStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'active' | 'inactive' }) =>
      providerServicesRepository.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['provider_services'] });
    },
  });
}

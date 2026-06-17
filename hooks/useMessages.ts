/**
 * useMessages — Costa Inteligente
 * Mensajes de chat con polling cada 5 segundos via React Query.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { messagesRepository } from '@/lib/repositories/messages.repository';

export function useMessages(reservationId: string) {
  const query = useQuery({
    queryKey: ['messages', reservationId],
    queryFn: () => messagesRepository.findByReservationId(reservationId),
    enabled: !!reservationId,
    staleTime: 0,
    refetchInterval: 5000, // polling cada 5 segundos
  });

  // Mantenido por compatibilidad con código existente
  const subscribeToMessages = () => () => {};

  return { ...query, subscribeToMessages };
}

export function useSendMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      reservationId,
      senderId,
      content,
    }: {
      reservationId: string;
      senderId: string;
      content: string;
    }) => {
      if (!content.trim() || content.trim().length > 500) {
        throw new Error('El mensaje debe tener entre 1 y 500 caracteres.');
      }
      return messagesRepository.create({ reservationId, senderId, content });
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['messages', variables.reservationId] });
    },
  });
}

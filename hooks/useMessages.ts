import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export function useMessages(reservationId: string) {
  const queryClient = useQueryClient();

  // Initial fetch
  const query = useQuery({
    queryKey: ['messages', reservationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('messages')
        .select(`*, profiles!sender_id ( full_name, avatar_url )`)
        .eq('reservation_id', reservationId)
        .order('sent_at', { ascending: true })
        .limit(50);
      if (error) throw error;
      return data;
    },
    enabled: !!reservationId,
    staleTime: 0,
  });

  // Realtime subscription
  const subscribeToMessages = () => {
    const channel = supabase
      .channel(`messages:${reservationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `reservation_id=eq.${reservationId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['messages', reservationId] });
        },
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  };

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
      const { data, error } = await supabase
        .from('messages')
        .insert({ reservation_id: reservationId, sender_id: senderId, content: content.trim() })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['messages', variables.reservationId] });
    },
  });
}

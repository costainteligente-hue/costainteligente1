import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';

export function useClientReservations() {
  const { user } = useAuthStore();

  return useQuery({
    queryKey: ['reservations', 'client', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reservations')
        .select(`
          *,
          provider_services ( name, module_type ),
          providers ( business_name )
        `)
        .eq('client_id', user!.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5,
  });
}

export function useProviderReservations(providerId?: string) {
  return useQuery({
    queryKey: ['reservations', 'provider', providerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reservations')
        .select(`
          *,
          provider_services ( name ),
          profiles!client_id ( full_name )
        `)
        .eq('provider_id', providerId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!providerId,
    staleTime: 1000 * 60 * 2,
  });
}

export function useCreateReservation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      clientId: string;
      serviceId: string;
      providerId: string;
      reservationDate: string;
      partySize: number;
      amount: number;
    }) => {
      const { data, error } = await supabase
        .from('reservations')
        .insert({
          client_id: payload.clientId,
          service_id: payload.serviceId,
          provider_id: payload.providerId,
          reservation_date: payload.reservationDate,
          party_size: payload.partySize,
          amount: payload.amount,
          status: 'pending',
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
    },
  });
}

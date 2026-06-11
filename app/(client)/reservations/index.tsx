import React, { useState } from 'react';
import {
  ScrollView, View, Text, TouchableOpacity, Alert, ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { useClientReservations } from '@/hooks/useReservations';
import { COLORS } from '@/lib/constants';
import { CardBox } from '@/components/ui/CardBox';
import { HeaderCard } from '@/components/ui/HeaderCard';
import { StatusPill } from '@/components/ui/StatusPill';
import { EmptyState } from '@/components/ui/EmptyState';
import { InfoChip } from '@/components/ui/InfoChip';
import { InfoBox } from '@/components/ui/InfoBox';
import { isAtLeastHoursAway, formatDate } from '@/lib/utils/dateHelpers';

const STATUS_LABELS: Record<string, string> = {
  pending: 'Solicitud',
  confirmed: 'Confirmada',
  rejected: 'Rechazada',
  rescheduled: 'Reprogramada',
  completed: 'Completada',
  cancelled: 'Cancelada',
};

function useCancelReservation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (reservationId: string) => {
      const { error } = await supabase
        .from('reservations')
        .update({ status: 'cancelled' })
        .eq('id', reservationId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
    },
  });
}

export default function MyReservationsScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { data: reservations, isLoading } = useClientReservations();
  const cancelMutation = useCancelReservation();
  const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');

  const handleCancel = (reservation: any) => {
    const canCancelFreely = isAtLeastHoursAway(reservation.reservation_date, 24);

    if (canCancelFreely) {
      Alert.alert(
        'Cancelar reservación',
        `¿Deseas cancelar tu reservación de ${reservation.provider_services?.name ?? 'servicio'}?`,
        [
          { text: 'Mantener reservación', style: 'cancel' },
          {
            text: 'Cancelar reservación',
            style: 'destructive',
            onPress: () => cancelMutation.mutate(reservation.id),
          },
        ],
      );
    } else {
      Alert.alert(
        'Cancelación con menos de 24 horas de anticipación',
        'Esta cancelación podría estar sujeta a cargos según la política del Proveedor. ¿Deseas continuar?',
        [
          { text: 'Mantener reservación', style: 'cancel' },
          {
            text: 'Cancelar reservación',
            style: 'destructive',
            onPress: () => cancelMutation.mutate(reservation.id),
          },
        ],
      );
    }
  };

  const allReservations = reservations ?? [];
  const active = allReservations.filter((r) =>
    ['pending', 'confirmed', 'rescheduled'].includes(r.status),
  );
  const history = allReservations.filter((r) =>
    ['completed', 'rejected', 'cancelled'].includes(r.status),
  );
  const displayed = activeTab === 'active' ? active : history;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        <HeaderCard
          title="Mis reservaciones"
          subtitle="Seguimiento de tus solicitudes y servicios confirmados."
          icon="event-available"
          color={COLORS.success}
        />

        {/* Tabs */}
        <View
          style={{
            flexDirection: 'row',
            backgroundColor: '#F1F5F9',
            borderRadius: 14,
            padding: 4,
            marginBottom: 16,
            gap: 4,
          }}
        >
          {[
            { key: 'active' as const, label: 'Activas', count: active.length },
            { key: 'history' as const, label: 'Historial', count: history.length },
          ].map((tab) => (
            <TouchableOpacity
              key={tab.key}
              onPress={() => setActiveTab(tab.key)}
              style={{
                flex: 1,
                alignItems: 'center',
                paddingVertical: 9,
                borderRadius: 12,
                backgroundColor: activeTab === tab.key ? '#fff' : 'transparent',
                flexDirection: 'row',
                justifyContent: 'center',
                gap: 6,
              }}
            >
              <Text
                style={{
                  fontWeight: '700',
                  fontSize: 13,
                  color: activeTab === tab.key ? COLORS.ocean : '#64748B',
                }}
              >
                {tab.label}
              </Text>
              {tab.count > 0 && (
                <View
                  style={{
                    backgroundColor: activeTab === tab.key ? COLORS.ocean : '#94A3B8',
                    borderRadius: 99,
                    minWidth: 18,
                    height: 18,
                    alignItems: 'center',
                    justifyContent: 'center',
                    paddingHorizontal: 5,
                  }}
                >
                  <Text style={{ color: '#fff', fontSize: 10, fontWeight: '800' }}>
                    {tab.count}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {isLoading ? (
          <View style={{ alignItems: 'center', paddingVertical: 40 }}>
            <ActivityIndicator color={COLORS.ocean} size="large" />
          </View>
        ) : displayed.length === 0 ? (
          <EmptyState
            icon="event-busy"
            title={activeTab === 'active' ? 'Sin reservaciones activas' : 'Sin historial aún'}
            message={
              activeTab === 'active'
                ? 'Explora los servicios disponibles y realiza tu primera reservación.'
                : 'Tus reservaciones completadas, rechazadas o canceladas aparecerán aquí.'
            }
            buttonLabel="Explorar servicios"
            onPress={() => router.push('/(client)/map')}
          />
        ) : (
          displayed.map((reservation) => {
            const statusLabel = STATUS_LABELS[reservation.status] ?? reservation.status;
            const isActive = ['pending', 'confirmed', 'rescheduled'].includes(reservation.status);
            const hasChat = reservation.status === 'confirmed';

            return (
              <CardBox key={reservation.id}>
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
                  <View
                    style={{
                      width: 46,
                      height: 46,
                      borderRadius: 14,
                      backgroundColor: `${COLORS.success}20`,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <MaterialIcons name="event-available" size={24} color={COLORS.success} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontWeight: '800', color: '#0F172A', fontSize: 15 }}>
                      {reservation.provider_services?.name ?? '—'}
                    </Text>
                    <Text style={{ color: '#0F172A99', fontSize: 13 }}>
                      {reservation.providers?.business_name ?? '—'}
                    </Text>
                    <Text style={{ color: '#94A3B8', fontSize: 12, marginTop: 2 }}>
                      {reservation.reservation_date
                        ? formatDate(reservation.reservation_date)
                        : '—'}
                    </Text>
                  </View>
                  <StatusPill status={statusLabel} />
                </View>

                {/* Payment status */}
                {reservation.status === 'confirmed' && (
                  <View
                    style={{
                      marginTop: 10,
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 8,
                      backgroundColor:
                        reservation.payment_status === 'paid'
                          ? `${COLORS.success}12`
                          : `${COLORS.warning}12`,
                      borderRadius: 10,
                      paddingHorizontal: 10,
                      paddingVertical: 6,
                    }}
                  >
                    <MaterialIcons
                      name={reservation.payment_status === 'paid' ? 'check-circle' : 'payments'}
                      size={16}
                      color={reservation.payment_status === 'paid' ? COLORS.success : COLORS.warning}
                    />
                    <Text
                      style={{
                        color:
                          reservation.payment_status === 'paid' ? COLORS.success : COLORS.warning,
                        fontWeight: '700',
                        fontSize: 13,
                      }}
                    >
                      {reservation.payment_status === 'paid'
                        ? 'Pago completado'
                        : `Pago pendiente${reservation.amount ? ` · $${reservation.amount} MXN` : ''}`}
                    </Text>
                  </View>
                )}

                {/* Rescheduled notice */}
                {reservation.status === 'rescheduled' && reservation.proposed_date && (
                  <View
                    style={{
                      marginTop: 10,
                      backgroundColor: `${COLORS.info}12`,
                      borderRadius: 10,
                      padding: 10,
                      borderWidth: 1,
                      borderColor: `${COLORS.info}30`,
                    }}
                  >
                    <Text style={{ color: COLORS.info, fontWeight: '700', fontSize: 13 }}>
                      Nueva fecha propuesta: {formatDate(reservation.proposed_date)}
                    </Text>
                  </View>
                )}

                {/* Actions */}
                {(isActive || hasChat) && (
                  <>
                    <View style={{ height: 1, backgroundColor: '#E2E8F0', marginVertical: 10 }} />
                    <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
                      {/* Pay button */}
                      {reservation.status === 'confirmed' &&
                        reservation.payment_status === 'pending' && (
                          <TouchableOpacity
                            style={{
                              flex: 1,
                              backgroundColor: COLORS.success,
                              borderRadius: 12,
                              padding: 10,
                              flexDirection: 'row',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: 6,
                            }}
                          >
                            <MaterialIcons name="payments" size={16} color="#fff" />
                            <Text style={{ color: '#fff', fontWeight: '800', fontSize: 13 }}>
                              Pagar ahora
                            </Text>
                          </TouchableOpacity>
                        )}

                      {/* Chat button */}
                      {hasChat && (
                        <TouchableOpacity
                          onPress={() =>
                            router.push(`/(client)/chat/${reservation.id}` as any)
                          }
                          style={{
                            flex: 1,
                            backgroundColor: `${COLORS.ocean}15`,
                            borderRadius: 12,
                            padding: 10,
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 6,
                            borderWidth: 1,
                            borderColor: `${COLORS.ocean}30`,
                          }}
                        >
                          <MaterialIcons name="chat-bubble-outline" size={16} color={COLORS.ocean} />
                          <Text style={{ color: COLORS.ocean, fontWeight: '800', fontSize: 13 }}>
                            Chat
                          </Text>
                        </TouchableOpacity>
                      )}

                      {/* Accept rescheduled */}
                      {reservation.status === 'rescheduled' && (
                        <>
                          <TouchableOpacity
                            style={{
                              flex: 1,
                              backgroundColor: COLORS.success,
                              borderRadius: 12,
                              padding: 10,
                              alignItems: 'center',
                            }}
                          >
                            <Text style={{ color: '#fff', fontWeight: '800', fontSize: 12 }}>
                              Aceptar fecha
                            </Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={{
                              flex: 1,
                              borderRadius: 12,
                              padding: 10,
                              alignItems: 'center',
                              borderWidth: 1,
                              borderColor: COLORS.danger,
                            }}
                          >
                            <Text style={{ color: COLORS.danger, fontWeight: '800', fontSize: 12 }}>
                              Rechazar
                            </Text>
                          </TouchableOpacity>
                        </>
                      )}

                      {/* Cancel button */}
                      {['pending', 'confirmed'].includes(reservation.status) && (
                        <TouchableOpacity
                          onPress={() => handleCancel(reservation)}
                          style={{
                            borderRadius: 12,
                            padding: 10,
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 4,
                            borderWidth: 1,
                            borderColor: '#E2E8F0',
                          }}
                        >
                          <MaterialIcons name="cancel" size={15} color="#94A3B8" />
                          <Text style={{ color: '#94A3B8', fontWeight: '700', fontSize: 12 }}>
                            Cancelar
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </>
                )}
              </CardBox>
            );
          })
        )}

        <InfoBox text="Las reservaciones confirmadas incluyen acceso al chat con el proveedor. El pago se realiza de forma manual desde el detalle de cada reservación." />
      </ScrollView>
    </SafeAreaView>
  );
}

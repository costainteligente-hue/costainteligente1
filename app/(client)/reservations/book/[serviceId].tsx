import React, { useState } from 'react';
import {
  ScrollView, View, Text, TouchableOpacity, ActivityIndicator, Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { useCreateReservation } from '@/hooks/useReservations';
import { COLORS, MONTH_NAMES } from '@/lib/constants';
import { CardBox } from '@/components/ui/CardBox';
import { HeaderCard } from '@/components/ui/HeaderCard';
import { InfoBox } from '@/components/ui/InfoBox';
import { applyDiscount } from '@/lib/utils/formatCurrency';

function useServiceDetail(serviceId: string) {
  return useQuery({
    queryKey: ['service_detail', serviceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('provider_services')
        .select(`
          *,
          providers ( id, business_name, status ),
          provider_availability ( blocked_date ),
          promotions ( discount_percent, status )
        `)
        .eq('id', serviceId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!serviceId,
  });
}

function CalendarPicker({
  year,
  month,
  selectedDate,
  blockedDates,
  onSelect,
  onChangeMonth,
}: {
  year: number;
  month: number;
  selectedDate: string | null;
  blockedDates: string[];
  onSelect: (dateStr: string) => void;
  onChangeMonth: (dir: 1 | -1) => void;
}) {
  const daysInMonth = new Date(year, month, 0).getDate();
  const firstDay = new Date(year, month - 1, 1).getDay();
  const offset = firstDay === 0 ? 6 : firstDay - 1;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <CardBox>
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 16,
        }}
      >
        <TouchableOpacity onPress={() => onChangeMonth(-1)} style={{ padding: 6 }}>
          <MaterialIcons name="chevron-left" size={26} color="#0F172A" />
        </TouchableOpacity>
        <Text style={{ fontWeight: '800', color: '#0F172A', fontSize: 16 }}>
          {MONTH_NAMES[month - 1]} {year}
        </Text>
        <TouchableOpacity onPress={() => onChangeMonth(1)} style={{ padding: 6 }}>
          <MaterialIcons name="chevron-right" size={26} color="#0F172A" />
        </TouchableOpacity>
      </View>

      {/* Day headers */}
      <View style={{ flexDirection: 'row', marginBottom: 6 }}>
        {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((d, i) => (
          <View key={i} style={{ flex: 1, alignItems: 'center' }}>
            <Text style={{ fontWeight: '800', color: '#64748B', fontSize: 11 }}>{d}</Text>
          </View>
        ))}
      </View>

      {/* Days grid */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {Array.from({ length: offset }).map((_, i) => (
          <View key={`e${i}`} style={{ width: `${100 / 7}%` }} />
        ))}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const date = new Date(year, month - 1, day);
          const isPast = date < today;
          const isBlocked = blockedDates.includes(dateStr);
          const isSelected = selectedDate === dateStr;
          const isDisabled = isPast || isBlocked;

          return (
            <TouchableOpacity
              key={day}
              onPress={() => !isDisabled && onSelect(dateStr)}
              disabled={isDisabled}
              style={{ width: `${100 / 7}%`, padding: 2, marginBottom: 4 }}
            >
              <View
                style={{
                  aspectRatio: 1,
                  borderRadius: 10,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: isSelected
                    ? COLORS.ocean
                    : isBlocked
                    ? '#F1F5F9'
                    : 'transparent',
                  opacity: isPast ? 0.3 : 1,
                }}
              >
                <Text
                  style={{
                    fontWeight: isSelected ? '800' : '600',
                    color: isSelected ? '#fff' : isBlocked ? '#94A3B8' : '#0F172A',
                    fontSize: 13,
                    textDecorationLine: isBlocked ? 'line-through' : 'none',
                  }}
                >
                  {day}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Legend */}
      <View style={{ flexDirection: 'row', gap: 16, marginTop: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
          <View
            style={{ width: 10, height: 10, borderRadius: 99, backgroundColor: COLORS.ocean }}
          />
          <Text style={{ fontSize: 11, color: '#64748B' }}>Seleccionado</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
          <View
            style={{ width: 10, height: 10, borderRadius: 99, backgroundColor: '#E2E8F0' }}
          />
          <Text style={{ fontSize: 11, color: '#64748B' }}>No disponible</Text>
        </View>
      </View>
    </CardBox>
  );
}

export default function BookingScreen() {
  const { serviceId } = useLocalSearchParams<{ serviceId: string }>();
  const router = useRouter();
  const { user } = useAuthStore();
  const { data: service, isLoading } = useServiceDetail(serviceId ?? '');
  const createReservation = useCreateReservation();

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [partySize, setPartySize] = useState(1);

  const blockedDates: string[] =
    service?.provider_availability?.map((a: any) => a.blocked_date) ?? [];

  const activePromo = service?.promotions?.find((p: any) => p.status === 'active');
  const finalPrice = activePromo
    ? applyDiscount(service?.price ?? 0, activePromo.discount_percent)
    : service?.price ?? 0;

  const changeMonth = (dir: 1 | -1) => {
    if (dir === 1) {
      if (month === 12) { setMonth(1); setYear((y) => y + 1); }
      else setMonth((m) => m + 1);
    } else {
      if (month === 1) { setMonth(12); setYear((y) => y - 1); }
      else setMonth((m) => m - 1);
    }
  };

  const handleBook = async () => {
    if (!selectedDate) {
      Alert.alert('Fecha requerida', 'Selecciona una fecha disponible para continuar.');
      return;
    }
    if (!user?.id || !service) return;

    try {
      await createReservation.mutateAsync({
        clientId: user.id,
        serviceId: service.id,
        providerId: service.providers.id,
        reservationDate: selectedDate,
        partySize,
        amount: finalPrice * partySize,
      });
      Alert.alert(
        '¡Solicitud enviada!',
        `Tu solicitud de reservación para ${service.name} el ${selectedDate} ha sido enviada. El proveedor la revisará en breve.`,
        [{ text: 'Ver mis reservaciones', onPress: () => router.replace('/(client)/reservations' as any) }],
      );
    } catch (err) {
      Alert.alert('Error', 'No se pudo enviar la solicitud. Intenta de nuevo.');
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={COLORS.ocean} size="large" />
      </SafeAreaView>
    );
  }

  if (!service) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
        <MaterialIcons name="error-outline" size={48} color="#94A3B8" />
        <Text style={{ color: '#94A3B8', fontWeight: '700', marginTop: 12, textAlign: 'center' }}>
          Servicio no encontrado
        </Text>
      </SafeAreaView>
    );
  }

  const maxCapacity = service.capacity ?? 10;
  const totalAmount = finalPrice * partySize;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        {/* Back */}
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 }}
        >
          <MaterialIcons name="arrow-back" size={20} color={COLORS.ocean} />
          <Text style={{ color: COLORS.ocean, fontWeight: '700' }}>Volver</Text>
        </TouchableOpacity>

        <HeaderCard
          title={service.name}
          subtitle={`${service.providers?.business_name ?? '—'} · Reservación`}
          icon="event-available"
          color={COLORS.ocean}
        />

        {/* Service summary */}
        <CardBox>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View>
              <Text style={{ fontWeight: '700', color: '#0F172A99', fontSize: 12 }}>Precio por persona</Text>
              {activePromo ? (
                <>
                  <Text style={{ color: '#94A3B8', fontSize: 13, textDecorationLine: 'line-through' }}>
                    ${service.price.toLocaleString('es-MX')} MXN
                  </Text>
                  <Text style={{ fontWeight: '800', color: COLORS.success, fontSize: 18 }}>
                    ${finalPrice.toLocaleString('es-MX')} MXN
                  </Text>
                </>
              ) : (
                <Text style={{ fontWeight: '800', color: '#0F172A', fontSize: 18 }}>
                  ${service.price.toLocaleString('es-MX')} MXN
                </Text>
              )}
            </View>
            <View>
              <Text style={{ fontWeight: '700', color: '#0F172A99', fontSize: 12 }}>Horario</Text>
              <Text style={{ fontWeight: '700', color: '#0F172A', fontSize: 14 }}>
                {service.schedule_start?.slice(0, 5)} – {service.schedule_end?.slice(0, 5)}
              </Text>
            </View>
          </View>
        </CardBox>

        {/* Calendar */}
        <Text style={{ fontWeight: '800', color: '#0F172A', fontSize: 15, marginBottom: 10 }}>
          Selecciona una fecha
        </Text>
        <CalendarPicker
          year={year}
          month={month}
          selectedDate={selectedDate}
          blockedDates={blockedDates}
          onSelect={setSelectedDate}
          onChangeMonth={changeMonth}
        />

        {/* Party size */}
        <Text style={{ fontWeight: '800', color: '#0F172A', fontSize: 15, marginTop: 16, marginBottom: 10 }}>
          Número de personas
        </Text>
        <CardBox>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ color: '#0F172A99', fontSize: 13 }}>
              Capacidad máxima: {maxCapacity} personas
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
              <TouchableOpacity
                onPress={() => setPartySize((p) => Math.max(1, p - 1))}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 99,
                  backgroundColor: partySize <= 1 ? '#F1F5F9' : `${COLORS.ocean}20`,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                disabled={partySize <= 1}
              >
                <MaterialIcons name="remove" size={20} color={partySize <= 1 ? '#94A3B8' : COLORS.ocean} />
              </TouchableOpacity>
              <Text style={{ fontWeight: '800', color: '#0F172A', fontSize: 22, minWidth: 28, textAlign: 'center' }}>
                {partySize}
              </Text>
              <TouchableOpacity
                onPress={() => setPartySize((p) => Math.min(maxCapacity, p + 1))}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 99,
                  backgroundColor: partySize >= maxCapacity ? '#F1F5F9' : `${COLORS.ocean}20`,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                disabled={partySize >= maxCapacity}
              >
                <MaterialIcons name="add" size={20} color={partySize >= maxCapacity ? '#94A3B8' : COLORS.ocean} />
              </TouchableOpacity>
            </View>
          </View>
        </CardBox>

        {/* Summary */}
        {selectedDate && (
          <CardBox>
            <Text style={{ fontWeight: '800', color: '#0F172A', fontSize: 15, marginBottom: 12 }}>
              Resumen de reservación
            </Text>
            <View style={{ gap: 6 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ color: '#0F172A99' }}>Servicio</Text>
                <Text style={{ fontWeight: '700', color: '#0F172A' }}>{service.name}</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ color: '#0F172A99' }}>Fecha</Text>
                <Text style={{ fontWeight: '700', color: '#0F172A' }}>{selectedDate}</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ color: '#0F172A99' }}>Personas</Text>
                <Text style={{ fontWeight: '700', color: '#0F172A' }}>{partySize}</Text>
              </View>
              <View style={{ height: 1, backgroundColor: '#E2E8F0', marginVertical: 6 }} />
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ fontWeight: '800', color: '#0F172A' }}>Total estimado</Text>
                <Text style={{ fontWeight: '800', color: COLORS.ocean, fontSize: 16 }}>
                  ${totalAmount.toLocaleString('es-MX')} MXN
                </Text>
              </View>
            </View>
          </CardBox>
        )}

        <InfoBox text="Al enviar la solicitud, el proveedor la revisará y recibirás una notificación con la confirmación. El pago se realiza después de la confirmación." />

        {/* Submit */}
        <TouchableOpacity
          onPress={handleBook}
          disabled={!selectedDate || createReservation.isPending}
          style={{
            backgroundColor: !selectedDate || createReservation.isPending ? '#94A3B8' : COLORS.ocean,
            borderRadius: 14,
            padding: 15,
            alignItems: 'center',
            flexDirection: 'row',
            justifyContent: 'center',
            gap: 8,
          }}
        >
          {createReservation.isPending ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <MaterialIcons name="send" size={20} color="#fff" />
          )}
          <Text style={{ color: '#fff', fontWeight: '800', fontSize: 16 }}>
            {createReservation.isPending ? 'Enviando solicitud...' : 'Enviar solicitud'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

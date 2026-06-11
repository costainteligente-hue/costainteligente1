import React from 'react';
import {
  ScrollView, View, Text, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { COLORS, SERVICE_DEFS } from '@/lib/constants';
import { applyDiscount } from '@/lib/utils/formatCurrency';
import { CardBox } from '@/components/ui/CardBox';
import { HeaderCard } from '@/components/ui/HeaderCard';
import { StatusPill } from '@/components/ui/StatusPill';
import { InfoChip } from '@/components/ui/InfoChip';

interface ServiceDetail {
  id: string;
  name: string;
  description: string;
  price: number;
  capacity: number;
  schedule_start: string;
  schedule_end: string;
  module_type: string;
  photo_urls: string[];
  status: string;
  providers: {
    id: string;
    business_name: string;
    status: string;
  };
  promotions?: {
    discount_percent: number;
    status: string;
  }[];
}

function useServiceDetail(id: string) {
  return useQuery({
    queryKey: ['service_detail_view', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('provider_services')
        .select(`
          *,
          providers ( id, business_name, status ),
          promotions ( discount_percent, status )
        `)
        .eq('id', id)
        .single();
      if (error) throw error;
      return data as ServiceDetail;
    },
    enabled: !!id,
  });
}

export default function ServiceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data: service, isLoading } = useServiceDetail(id ?? '');

  if (isLoading) {
    return (
      <SafeAreaView
        style={{ flex: 1, backgroundColor: '#F8FAFC', alignItems: 'center', justifyContent: 'center' }}
      >
        <ActivityIndicator color={COLORS.ocean} size="large" />
      </SafeAreaView>
    );
  }

  if (!service) {
    return (
      <SafeAreaView
        style={{ flex: 1, backgroundColor: '#F8FAFC', alignItems: 'center', justifyContent: 'center', padding: 32 }}
      >
        <MaterialIcons name="error-outline" size={48} color="#94A3B8" />
        <Text style={{ color: '#94A3B8', fontWeight: '700', marginTop: 12, textAlign: 'center' }}>
          Servicio no encontrado
        </Text>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ marginTop: 16, flexDirection: 'row', alignItems: 'center', gap: 6 }}
        >
          <MaterialIcons name="arrow-back" size={18} color={COLORS.ocean} />
          <Text style={{ color: COLORS.ocean, fontWeight: '700' }}>Volver</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const def = SERVICE_DEFS.find((s) => s.id === service.module_type);
  const color = def?.color ?? COLORS.ocean;
  const icon = (def?.icon ?? 'storefront') as keyof typeof MaterialIcons.glyphMap;
  const activePromo = service.promotions?.find((p) => p.status === 'active');
  const discountedPrice = activePromo
    ? applyDiscount(service.price, activePromo.discount_percent)
    : null;

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
          subtitle={service.providers?.business_name ?? '—'}
          icon={icon}
          color={color}
        />

        {/* Precio */}
        <CardBox>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View>
              <Text style={{ fontWeight: '700', color: '#0F172A99', fontSize: 12 }}>
                Precio por persona
              </Text>
              {activePromo ? (
                <>
                  <Text style={{ color: '#94A3B8', fontSize: 13, textDecorationLine: 'line-through' }}>
                    ${service.price.toLocaleString('es-MX')} MXN
                  </Text>
                  <Text style={{ fontWeight: '800', color: COLORS.success, fontSize: 20 }}>
                    ${discountedPrice!.toLocaleString('es-MX')} MXN
                  </Text>
                  <View
                    style={{
                      alignSelf: 'flex-start',
                      backgroundColor: `${COLORS.success}15`,
                      borderRadius: 999,
                      paddingHorizontal: 8,
                      paddingVertical: 3,
                      marginTop: 4,
                    }}
                  >
                    <Text style={{ color: COLORS.success, fontWeight: '800', fontSize: 11 }}>
                      -{activePromo.discount_percent}% descuento
                    </Text>
                  </View>
                </>
              ) : (
                <Text style={{ fontWeight: '800', color: '#0F172A', fontSize: 20 }}>
                  ${service.price.toLocaleString('es-MX')} MXN
                </Text>
              )}
            </View>
            <View style={{ alignItems: 'flex-end', gap: 6 }}>
              <StatusPill status={service.status} />
              <InfoChip
                icon="people"
                text={`Cap. ${service.capacity}`}
              />
            </View>
          </View>
        </CardBox>

        {/* Horario */}
        <CardBox>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <MaterialIcons name="schedule" size={22} color={color} />
            <View>
              <Text style={{ fontWeight: '700', color: '#0F172A99', fontSize: 12 }}>Horario</Text>
              <Text style={{ fontWeight: '800', color: '#0F172A', fontSize: 15 }}>
                {service.schedule_start?.slice(0, 5)} – {service.schedule_end?.slice(0, 5)}
              </Text>
            </View>
          </View>
        </CardBox>

        {/* Descripción */}
        {!!service.description && (
          <CardBox>
            <Text style={{ fontWeight: '800', color: '#0F172A', fontSize: 14, marginBottom: 6 }}>
              Descripción
            </Text>
            <Text style={{ color: '#64748B', fontSize: 14, lineHeight: 22 }}>
              {service.description}
            </Text>
          </CardBox>
        )}

        {/* Proveedor */}
        <CardBox>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 14,
                backgroundColor: `${color}20`,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <MaterialIcons name="storefront" size={22} color={color} />
            </View>
            <View>
              <Text style={{ fontWeight: '700', color: '#0F172A99', fontSize: 12 }}>Proveedor</Text>
              <Text style={{ fontWeight: '800', color: '#0F172A', fontSize: 15 }}>
                {service.providers?.business_name ?? '—'}
              </Text>
            </View>
          </View>
        </CardBox>

        {/* Reservar */}
        <TouchableOpacity
          onPress={() => router.push(`/(client)/reservations/book/${service.id}` as any)}
          style={{
            backgroundColor: color,
            borderRadius: 14,
            padding: 15,
            alignItems: 'center',
            flexDirection: 'row',
            justifyContent: 'center',
            gap: 8,
            marginTop: 8,
          }}
        >
          <MaterialIcons name="event-available" size={20} color="#fff" />
          <Text style={{ color: '#fff', fontWeight: '800', fontSize: 16 }}>
            Reservar este servicio
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

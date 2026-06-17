import React, { useState } from 'react';
import {
  ScrollView, View, Text, TouchableOpacity, ActivityIndicator, TextInput,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { publicServicesRepository } from '@/lib/repositories/public-services.repository';
import { COLORS, SERVICE_DEFS } from '@/lib/constants';
import { applyDiscount } from '@/lib/utils/formatCurrency';
import { CardBox } from '@/components/ui/CardBox';
import { HeaderCard } from '@/components/ui/HeaderCard';
import { StatusPill } from '@/components/ui/StatusPill';
import { EmptyState } from '@/components/ui/EmptyState';
import { InfoChip } from '@/components/ui/InfoChip';

interface ServiceWithPromotion {
  id: string;
  name: string;
  description: string;
  price: number;
  capacity: number;
  schedule_start: string;
  schedule_end: string;
  module_type: string;
  photo_urls: string[];
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

function useActiveServices(search: string) {
  return useQuery({
    queryKey: ['active_services', search],
    queryFn: () => publicServicesRepository.findActive(search),
    staleTime: 1000 * 60 * 5,
  });
}

const MODULE_ICONS: Record<string, keyof typeof MaterialIcons.glyphMap> = {
  boat: 'directions-boat',
  guide: 'explore',
  sport: 'emoji-events',
  rental: 'sailing',
  restaurant: 'restaurant',
  store: 'storefront',
  fishMarket: 'set-meal',
  transport: 'airport-shuttle',
};

export default function ServicesListScreen() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const { data: services, isLoading } = useActiveServices(debouncedSearch);

  const handleSearch = (text: string) => {
    setSearch(text);
    // Simple debounce
    setTimeout(() => setDebouncedSearch(text), 400);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        <HeaderCard
          title="Servicios disponibles"
          subtitle="Explora y reserva servicios náuticos y turísticos verificados."
          icon="storefront"
          color={COLORS.ocean}
        />

        {/* Search */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: '#fff',
            borderRadius: 14,
            borderWidth: 1,
            borderColor: '#E2E8F0',
            paddingHorizontal: 12,
            marginBottom: 16,
            gap: 8,
          }}
        >
          <MaterialIcons name="search" size={20} color="#94A3B8" />
          <TextInput
            value={search}
            onChangeText={handleSearch}
            placeholder="Buscar servicios..."
            placeholderTextColor="#94A3B8"
            style={{ flex: 1, paddingVertical: 12, fontSize: 14, color: '#0F172A' }}
          />
        </View>

        {isLoading ? (
          <View style={{ alignItems: 'center', paddingVertical: 40 }}>
            <ActivityIndicator color={COLORS.ocean} size="large" />
          </View>
        ) : (services ?? []).length === 0 ? (
          <EmptyState
            icon="storefront"
            title="Sin servicios disponibles"
            message="No hay servicios que coincidan con tu búsqueda. Intenta con otro término."
            buttonLabel="Limpiar búsqueda"
            onPress={() => { setSearch(''); setDebouncedSearch(''); }}
          />
        ) : (
          (services ?? []).map((service) => {
            const activePromo = service.promotions?.find((p) => p.status === 'active');
            const discountedPrice = activePromo
              ? applyDiscount(service.price, activePromo.discount_percent)
              : null;
            const icon = MODULE_ICONS[service.module_type] ?? 'storefront';
            const def = SERVICE_DEFS.find((s) => s.id === service.module_type);
            const color = def?.color ?? COLORS.ocean;

            return (
              <TouchableOpacity
                key={service.id}
                onPress={() => router.push(`/(client)/services/${service.id}` as any)}
              >
                <CardBox>
                  <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
                    <View
                      style={{
                        width: 52,
                        height: 52,
                        borderRadius: 16,
                        backgroundColor: `${color}20`,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <MaterialIcons name={icon} size={26} color={color} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontWeight: '800', color: '#0F172A', fontSize: 15 }}>
                        {service.name}
                      </Text>
                      <Text style={{ color: '#0F172A99', fontSize: 13 }}>
                        {service.providers?.business_name ?? '—'}
                      </Text>
                      <Text
                        style={{ color: '#64748B', fontSize: 12, marginTop: 3 }}
                        numberOfLines={2}
                      >
                        {service.description}
                      </Text>
                    </View>
                  </View>

                  <View
                    style={{
                      height: 1,
                      backgroundColor: '#E2E8F0',
                      marginVertical: 10,
                    }}
                  />

                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      {activePromo ? (
                        <View>
                          <Text
                            style={{
                              color: '#94A3B8',
                              fontSize: 12,
                              textDecorationLine: 'line-through',
                            }}
                          >
                            ${service.price.toLocaleString('es-MX')} MXN
                          </Text>
                          <Text
                            style={{ color: COLORS.success, fontWeight: '800', fontSize: 16 }}
                          >
                            ${discountedPrice!.toLocaleString('es-MX')} MXN
                          </Text>
                        </View>
                      ) : (
                        <Text style={{ color: '#0F172A', fontWeight: '800', fontSize: 16 }}>
                          ${service.price.toLocaleString('es-MX')} MXN
                        </Text>
                      )}
                      {activePromo && (
                        <View
                          style={{
                            backgroundColor: `${COLORS.success}15`,
                            borderRadius: 999,
                            paddingHorizontal: 8,
                            paddingVertical: 3,
                          }}
                        >
                          <Text
                            style={{ color: COLORS.success, fontWeight: '800', fontSize: 11 }}
                          >
                            -{activePromo.discount_percent}%
                          </Text>
                        </View>
                      )}
                    </View>

                    <TouchableOpacity
                      onPress={() =>
                        router.push(`/(client)/reservations/book/${service.id}` as any)
                      }
                      style={{
                        backgroundColor: color,
                        borderRadius: 12,
                        paddingHorizontal: 14,
                        paddingVertical: 8,
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      <MaterialIcons name="event-available" size={15} color="#fff" />
                      <Text style={{ color: '#fff', fontWeight: '800', fontSize: 13 }}>
                        Reservar
                      </Text>
                    </TouchableOpacity>
                  </View>
                </CardBox>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

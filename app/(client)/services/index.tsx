/**
 * Servicios — Directorio costero con categorías
 * Clasificación por categoría, búsqueda, filtros y listado real de la DB.
 */
import React, { useState, useMemo } from 'react';
import {
  ScrollView, View, Text, TouchableOpacity, ActivityIndicator,
  TextInput, Dimensions,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { publicServicesRepository } from '@/lib/repositories/public-services.repository';
import { COLORS, SERVICE_DEFS, SERVICE_CATEGORIES } from '@/lib/constants';
import { applyDiscount } from '@/lib/utils/formatCurrency';
import { CardBox } from '@/components/ui/CardBox';
import { EmptyState } from '@/components/ui/EmptyState';

const { width: SCREEN_W } = Dimensions.get('window');
const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? '';

// ─── Fetch servicios activos ──────────────────────────────────────────────────
function useActiveServices(search: string) {
  return useQuery({
    queryKey: ['active_services', search],
    queryFn:  () => publicServicesRepository.findActive(search),
    staleTime: 1000 * 60 * 5,
  });
}

const MODULE_ICONS: Record<string, keyof typeof MaterialIcons.glyphMap> = {
  boat:       'directions-boat',
  guide:      'explore',
  sport:      'emoji-events',
  rental:     'sailing',
  restaurant: 'restaurant',
  store:      'storefront',
  fishMarket: 'set-meal',
  transport:  'airport-shuttle',
  insumos:    'inventory',
  hospedaje:  'hotel',
};

// ─── Tarjeta de categoría ─────────────────────────────────────────────────────
function CategoryCard({ cat, count, active, onPress }: {
  cat: typeof SERVICE_CATEGORIES[0]; count: number; active: boolean; onPress: () => void;
}) {
  return (
    <TouchableOpacity onPress={onPress} style={{ marginRight: 10, alignItems: 'center', width: 88 }}>
      <View style={{
        width: 64, height: 64, borderRadius: 20, marginBottom: 6,
        backgroundColor: active ? cat.color : `${cat.color}15`,
        alignItems: 'center', justifyContent: 'center',
        borderWidth: active ? 0 : 1.5, borderColor: `${cat.color}30`,
        shadowColor: active ? cat.color : 'transparent',
        shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: active ? 4 : 0,
      }}>
        <Text style={{ fontSize: 26 }}>{cat.emoji}</Text>
      </View>
      <Text style={{ fontWeight: active ? '800' : '600', color: active ? cat.color : '#374151', fontSize: 11, textAlign: 'center' }} numberOfLines={2}>
        {cat.name}
      </Text>
      {count > 0 && (
        <View style={{ backgroundColor: active ? cat.color : '#E2E8F0', borderRadius: 999, paddingHorizontal: 6, paddingVertical: 1, marginTop: 2 }}>
          <Text style={{ color: active ? '#fff' : '#64748B', fontSize: 9, fontWeight: '800' }}>{count}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

// ─── Tarjeta de servicio ──────────────────────────────────────────────────────
function ServiceCard({ service, onPress, onBook }: { service: any; onPress: () => void; onBook: () => void }) {
  const activePromo   = service.promotions?.find((p: any) => p.status === 'active');
  const discountPrice = activePromo ? applyDiscount(service.price, activePromo.discount_percent) : null;
  const icon          = MODULE_ICONS[service.module_type] ?? 'storefront';
  const def           = SERVICE_DEFS.find((s) => s.id === service.module_type);
  const color         = def?.color ?? COLORS.ocean;
  const cat           = SERVICE_CATEGORIES.find((c) => c.moduleTypes.includes(service.module_type));

  return (
    <TouchableOpacity onPress={onPress}>
      <View style={{ backgroundColor: '#fff', borderRadius: 18, marginBottom: 12, overflow: 'hidden',
        borderWidth: 1, borderColor: '#E2E8F0',
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8, elevation: 2 }}>
        {/* Color strip */}
        <View style={{ height: 6, backgroundColor: color }} />
        <View style={{ padding: 14 }}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
            <View style={{ width: 52, height: 52, borderRadius: 16, backgroundColor: `${color}15`, alignItems: 'center', justifyContent: 'center' }}>
              <MaterialIcons name={icon} size={28} color={color} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: '800', color: '#0F172A', fontSize: 15 }}>{service.name}</Text>
              <Text style={{ color: '#64748B', fontSize: 12, marginTop: 1 }}>{service.providers?.business_name ?? '—'}</Text>
              {cat && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
                  <View style={{ backgroundColor: `${color}12`, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 }}>
                    <Text style={{ color, fontSize: 10, fontWeight: '800' }}>{cat.emoji} {cat.name}</Text>
                  </View>
                </View>
              )}
              <Text style={{ color: '#94A3B8', fontSize: 12, marginTop: 5 }} numberOfLines={2}>{service.description}</Text>
            </View>
          </View>

          <View style={{ height: 1, backgroundColor: '#F1F5F9', marginVertical: 12 }} />

          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View>
              {activePromo ? (
                <>
                  <Text style={{ color: '#94A3B8', fontSize: 11, textDecorationLine: 'line-through' }}>
                    ${service.price.toLocaleString('es-MX')} MXN
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={{ color: COLORS.success, fontWeight: '900', fontSize: 18 }}>
                      ${discountPrice!.toLocaleString('es-MX')}
                    </Text>
                    <View style={{ backgroundColor: `${COLORS.success}15`, borderRadius: 999, paddingHorizontal: 7, paddingVertical: 2 }}>
                      <Text style={{ color: COLORS.success, fontWeight: '800', fontSize: 11 }}>-{activePromo.discount_percent}%</Text>
                    </View>
                  </View>
                </>
              ) : (
                <Text style={{ color: '#0F172A', fontWeight: '900', fontSize: 18 }}>
                  ${service.price.toLocaleString('es-MX')} <Text style={{ fontSize: 12, fontWeight: '600', color: '#64748B' }}>MXN</Text>
                </Text>
              )}
            </View>
            <TouchableOpacity onPress={onBook}
              style={{ backgroundColor: color, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 9, flexDirection: 'row', alignItems: 'center', gap: 5 }}>
              <MaterialIcons name="event-available" size={16} color="#fff" />
              <Text style={{ color: '#fff', fontWeight: '800', fontSize: 13 }}>Reservar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ─── Pantalla principal ───────────────────────────────────────────────────────
export default function ServicesListScreen() {
  const router = useRouter();
  const [search, setSearch]         = useState('');
  const [debouncedSearch, setDebounced] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const { data: services, isLoading } = useActiveServices(debouncedSearch);

  const handleSearch = (text: string) => {
    setSearch(text);
    setTimeout(() => setDebounced(text), 400);
  };

  // Contar servicios por categoría
  const countByCategory = useMemo(() => {
    const counts: Record<string, number> = {};
    (services ?? []).forEach((s: any) => {
      SERVICE_CATEGORIES.forEach((cat) => {
        if (cat.moduleTypes.includes(s.module_type)) {
          counts[cat.id] = (counts[cat.id] ?? 0) + 1;
        }
      });
    });
    return counts;
  }, [services]);

  // Filtrar por categoría activa
  const filtered = useMemo(() => {
    const all = services ?? [];
    if (!activeCategory) return all;
    const cat = SERVICE_CATEGORIES.find((c) => c.id === activeCategory);
    if (!cat) return all;
    return all.filter((s: any) => cat.moduleTypes.includes(s.module_type));
  }, [services, activeCategory]);

  const activeCat = SERVICE_CATEGORIES.find((c) => c.id === activeCategory);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }} edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>

        {/* Hero */}
        <LinearGradient colors={['#0F172A', '#0F766E']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 24 }}>
          <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: '600', marginBottom: 4 }}>Directorio costero</Text>
          <Text style={{ color: '#fff', fontSize: 22, fontWeight: '900', letterSpacing: -0.4, marginBottom: 16 }}>
            Servicios disponibles
          </Text>
          {/* Buscador dentro del hero */}
          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 14, paddingHorizontal: 14, gap: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' }}>
            <MaterialIcons name="search" size={20} color="rgba(255,255,255,0.7)" />
            <TextInput
              value={search} onChangeText={handleSearch}
              placeholder="Buscar restaurantes, guías, lanchas..."
              placeholderTextColor="rgba(255,255,255,0.5)"
              style={{ flex: 1, paddingVertical: 12, fontSize: 14, color: '#fff' }}
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => { setSearch(''); setDebounced(''); }}>
                <MaterialIcons name="close" size={18} color="rgba(255,255,255,0.7)" />
              </TouchableOpacity>
            )}
          </View>
        </LinearGradient>

        <View style={{ padding: 16 }}>
          {/* Categorías */}
          <Text style={{ fontWeight: '800', color: '#0F172A', fontSize: 16, marginBottom: 12 }}>Categorías</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 16, marginBottom: 20 }}>
            {/* Botón "Todos" */}
            <TouchableOpacity onPress={() => setActiveCategory(null)} style={{ marginRight: 10, alignItems: 'center', width: 64 }}>
              <View style={{
                width: 64, height: 64, borderRadius: 20, marginBottom: 6, alignItems: 'center', justifyContent: 'center',
                backgroundColor: !activeCategory ? COLORS.ocean : `${COLORS.ocean}12`,
                borderWidth: !activeCategory ? 0 : 1.5, borderColor: `${COLORS.ocean}30`,
                shadowColor: !activeCategory ? COLORS.ocean : 'transparent',
                shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: !activeCategory ? 4 : 0,
              }}>
                <Text style={{ fontSize: 26 }}>🌊</Text>
              </View>
              <Text style={{ fontWeight: !activeCategory ? '800' : '600', color: !activeCategory ? COLORS.ocean : '#374151', fontSize: 11, textAlign: 'center' }}>
                Todos
              </Text>
              <View style={{ backgroundColor: !activeCategory ? COLORS.ocean : '#E2E8F0', borderRadius: 999, paddingHorizontal: 6, paddingVertical: 1, marginTop: 2 }}>
                <Text style={{ color: !activeCategory ? '#fff' : '#64748B', fontSize: 9, fontWeight: '800' }}>
                  {(services ?? []).length}
                </Text>
              </View>
            </TouchableOpacity>

            {SERVICE_CATEGORIES.map((cat) => (
              <CategoryCard
                key={cat.id}
                cat={cat}
                count={countByCategory[cat.id] ?? 0}
                active={activeCategory === cat.id}
                onPress={() => setActiveCategory(activeCategory === cat.id ? null : cat.id)}
              />
            ))}
          </ScrollView>

          {/* Header de sección activa */}
          {activeCat && (
            <View style={{ backgroundColor: `${activeCat.color}10`, borderRadius: 16, padding: 14, marginBottom: 16, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Text style={{ fontSize: 28 }}>{activeCat.emoji}</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: '800', color: '#0F172A', fontSize: 15 }}>{activeCat.name}</Text>
                <Text style={{ color: '#64748B', fontSize: 12 }}>{activeCat.description}</Text>
              </View>
              <TouchableOpacity onPress={() => setActiveCategory(null)}>
                <MaterialIcons name="close" size={20} color="#94A3B8" />
              </TouchableOpacity>
            </View>
          )}

          {/* Resultados */}
          {!activeCat && !search && (
            <Text style={{ fontWeight: '800', color: '#0F172A', fontSize: 16, marginBottom: 12 }}>
              Todos los servicios
              <Text style={{ fontWeight: '600', color: '#64748B', fontSize: 13 }}> · {(services ?? []).length}</Text>
            </Text>
          )}

          {isLoading ? (
            <View style={{ alignItems: 'center', paddingVertical: 60 }}>
              <ActivityIndicator color={COLORS.ocean} size="large" />
              <Text style={{ color: '#64748B', marginTop: 12 }}>Buscando servicios...</Text>
            </View>
          ) : filtered.length === 0 ? (
            <EmptyState
              icon="storefront"
              title={activeCategory ? `Sin ${activeCat?.name ?? 'servicios'} disponibles` : 'Sin resultados'}
              message={search ? `No encontramos servicios para "${search}"` : 'No hay servicios en esta categoría por el momento.'}
              buttonLabel={search || activeCategory ? 'Ver todos' : ''}
              onPress={() => { setSearch(''); setDebounced(''); setActiveCategory(null); }}
            />
          ) : (
            filtered.map((service: any) => (
              <ServiceCard
                key={service.id}
                service={service}
                onPress={() => router.push(`/(client)/services/${service.id}` as any)}
                onBook={() => router.push(`/(client)/reservations/book/${service.id}` as any)}
              />
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { COLORS, ZIHUATANEJO } from '@/lib/constants';
import { InfoBox } from '@/components/ui/InfoBox';
import { StatusPill } from '@/components/ui/StatusPill';
import { CardBox } from '@/components/ui/CardBox';

// ─── Seed zones para cuando la base de datos está vacía ──────────────────────
const SEED_ZONES = [
  { id: 'z1', name: 'Bajo de Chila', level: 'intermedio', type: 'Offshore', latitude: 17.58, longitude: -101.62, is_active: true, description: 'Zona de aguas profundas ideal para pez vela y marlín.', species: ['Pez vela', 'Marlín azul', 'Dorado'] },
  { id: 'z2', name: 'La Ropa', level: 'principiante', type: 'Playa', latitude: 17.63, longitude: -101.55, is_active: true, description: 'Playa protegida perfecta para principiantes y pesca desde la orilla.', species: ['Jurel', 'Sierra', 'Robalo'] },
  { id: 'z3', name: 'Punta Ixtapa', level: 'avanzado', type: 'Rocas', latitude: 17.67, longitude: -101.64, is_active: true, description: 'Zona rocosa con corrientes fuertes. Requiere experiencia y equipo adecuado.', species: ['Atún aleta amarilla', 'Wahoo', 'Pez vela'] },
  { id: 'z4', name: 'Bahía de Zihuatanejo', level: 'principiante', type: 'Bahía', latitude: 17.64, longitude: -101.55, is_active: true, description: 'Bahía tranquila ideal para pesca recreativa y avistamiento de fauna.', species: ['Huachinango', 'Robalo', 'Mojarra'] },
  { id: 'z5', name: 'Morro de Petatlán', level: 'avanzado', type: 'Offshore', latitude: 17.52, longitude: -101.71, is_active: true, description: 'Zona de pesca de altura con gran diversidad de especies pelágicas.', species: ['Marlín rayado', 'Atún', 'Dorado', 'Wahoo'] },
];

type Level = 'todos' | 'principiante' | 'intermedio' | 'avanzado';

const LEVEL_COLORS: Record<string, string> = {
  principiante: COLORS.success,
  intermedio: COLORS.warning,
  avanzado: COLORS.danger,
};

// ─── Zone detail modal ────────────────────────────────────────────────────────
function ZoneDetailModal({
  zone,
  onClose,
  onFavorite,
}: {
  zone: typeof SEED_ZONES[0];
  onClose: () => void;
  onFavorite: (id: string) => void;
}) {
  const [favorited, setFavorited] = useState(false);

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
        <View className="flex-row items-center justify-between px-4 pt-4 pb-2">
          <Text style={{ fontSize: 18, fontWeight: '800', color: '#0F172A' }}>{zone.name}</Text>
          <TouchableOpacity onPress={onClose}>
            <MaterialIcons name="close" size={24} color="#0F172A" />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
          {/* Hero image placeholder */}
          <View
            style={{
              height: 180,
              borderRadius: 20,
              backgroundColor: `${COLORS.ocean}20`,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 14,
              borderWidth: 1,
              borderColor: `${COLORS.ocean}30`,
            }}
          >
            <MaterialIcons name="photo-camera" size={40} color={COLORS.ocean} />
            <Text style={{ color: COLORS.ocean, fontWeight: '700', marginTop: 8 }}>Foto de la zona</Text>
          </View>

          {/* Level + type badges */}
          <View className="flex-row gap-2 flex-wrap mb-3">
            <View
              style={{
                backgroundColor: `${LEVEL_COLORS[zone.level]}20`,
                borderRadius: 999,
                paddingHorizontal: 12,
                paddingVertical: 5,
                borderWidth: 1,
                borderColor: `${LEVEL_COLORS[zone.level]}40`,
              }}
            >
              <Text style={{ color: LEVEL_COLORS[zone.level], fontWeight: '800', fontSize: 12 }}>
                {zone.level.charAt(0).toUpperCase() + zone.level.slice(1)}
              </Text>
            </View>
            <View
              style={{
                backgroundColor: '#F1F5F9',
                borderRadius: 999,
                paddingHorizontal: 12,
                paddingVertical: 5,
                borderWidth: 1,
                borderColor: '#E2E8F0',
              }}
            >
              <Text style={{ color: '#0F172A', fontWeight: '700', fontSize: 12 }}>{zone.type}</Text>
            </View>
          </View>

          <CardBox>
            <Text style={{ fontWeight: '800', color: '#0F172A', marginBottom: 6 }}>Descripción</Text>
            <Text style={{ color: '#0F172A99', lineHeight: 20 }}>{zone.description}</Text>
          </CardBox>

          <CardBox>
            <Text style={{ fontWeight: '800', color: '#0F172A', marginBottom: 10 }}>
              Especies probables
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {zone.species.map((s) => (
                <View
                  key={s}
                  style={{
                    backgroundColor: `${COLORS.success}15`,
                    borderRadius: 999,
                    paddingHorizontal: 11,
                    paddingVertical: 5,
                    borderWidth: 1,
                    borderColor: `${COLORS.success}30`,
                  }}
                >
                  <Text style={{ color: COLORS.success, fontWeight: '700', fontSize: 12 }}>{s}</Text>
                </View>
              ))}
            </View>
          </CardBox>

          <CardBox>
            <Text style={{ fontWeight: '800', color: '#0F172A', marginBottom: 8 }}>Coordenadas</Text>
            <Text style={{ color: '#0F172A99', fontFamily: 'monospace' }}>
              {zone.latitude.toFixed(4)}° N, {Math.abs(zone.longitude).toFixed(4)}° O
            </Text>
          </CardBox>

          {/* Favorite + navigate buttons */}
          <View className="flex-row gap-3 mt-2">
            <TouchableOpacity
              onPress={() => { setFavorited((v) => !v); onFavorite(zone.id); }}
              style={{
                flex: 1,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: favorited ? COLORS.danger : '#E2E8F0',
                padding: 13,
                backgroundColor: favorited ? `${COLORS.danger}10` : '#fff',
              }}
            >
              <MaterialIcons
                name={favorited ? 'favorite' : 'favorite-border'}
                size={20}
                color={favorited ? COLORS.danger : '#0F172A'}
              />
              <Text
                style={{
                  fontWeight: '800',
                  color: favorited ? COLORS.danger : '#0F172A',
                }}
              >
                {favorited ? 'Guardado' : 'Guardar'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onClose}
              style={{
                flex: 1,
                backgroundColor: COLORS.ocean,
                borderRadius: 14,
                padding: 13,
                alignItems: 'center',
                flexDirection: 'row',
                justifyContent: 'center',
                gap: 6,
              }}
            >
              <MaterialIcons name="navigation" size={18} color="#fff" />
              <Text style={{ color: '#fff', fontWeight: '800' }}>Navegar</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

// ─── Main Map Screen ──────────────────────────────────────────────────────────
export default function MapScreen() {
  const router = useRouter();
  const [levelFilter, setLevelFilter] = useState<Level>('todos');
  const [selectedZone, setSelectedZone] = useState<typeof SEED_ZONES[0] | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  const filtered = SEED_ZONES.filter(
    (z) => levelFilter === 'todos' || z.level === levelFilter,
  );

  const toggleFavorite = (id: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const levels: { key: Level; label: string }[] = [
    { key: 'todos', label: 'Todos' },
    { key: 'principiante', label: 'Principiante' },
    { key: 'intermedio', label: 'Intermedio' },
    { key: 'avanzado', label: 'Avanzado' },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }} edges={['top']}>
      {selectedZone && (
        <ZoneDetailModal
          zone={selectedZone}
          onClose={() => setSelectedZone(null)}
          onFavorite={toggleFavorite}
        />
      )}

      {/* Map placeholder — replace with MapView + UrlTile from react-native-maps */}
      <View style={{ flex: 1 }}>
        <View
          style={{
            height: 280,
            backgroundColor: '#DBEAFE',
            margin: 16,
            borderRadius: 20,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 1,
            borderColor: `${COLORS.info}30`,
            overflow: 'hidden',
          }}
        >
          <MaterialIcons name="map" size={52} color={COLORS.info} />
          <Text style={{ color: COLORS.info, fontWeight: '800', marginTop: 8, fontSize: 16 }}>
            Mapa de Zihuatanejo
          </Text>
          <Text style={{ color: `${COLORS.info}99`, fontSize: 13, marginTop: 4 }}>
            17.6392° N · 101.5507° O
          </Text>
          <Text style={{ color: `${COLORS.info}80`, fontSize: 12, marginTop: 8, textAlign: 'center', paddingHorizontal: 24 }}>
            Integrar react-native-maps con UrlTile de OpenStreetMap. Ver design.md §7.2
          </Text>

          {/* Zone pins simulation */}
          {filtered.map((z, i) => (
            <TouchableOpacity
              key={z.id}
              onPress={() => setSelectedZone(z)}
              style={{
                position: 'absolute',
                top: 40 + i * 35,
                left: 30 + (i % 3) * 80,
                backgroundColor: LEVEL_COLORS[z.level],
                borderRadius: 99,
                paddingHorizontal: 8,
                paddingVertical: 4,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 3,
              }}
            >
              <MaterialIcons name="place" size={12} color="#fff" />
              <Text style={{ color: '#fff', fontSize: 10, fontWeight: '800' }} numberOfLines={1}>
                {z.name.split(' ')[0]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Level filters */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 8, marginBottom: 12 }}
        >
          {levels.map((l) => (
            <TouchableOpacity
              key={l.key}
              onPress={() => setLevelFilter(l.key)}
              style={{
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 999,
                backgroundColor: levelFilter === l.key ? COLORS.ocean : '#fff',
                borderWidth: 1,
                borderColor: levelFilter === l.key ? COLORS.ocean : '#E2E8F0',
              }}
            >
              <Text
                style={{
                  fontWeight: '700',
                  color: levelFilter === l.key ? '#fff' : '#0F172A',
                  fontSize: 13,
                }}
              >
                {l.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Zone list */}
        <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}>
          {filtered.length === 0 ? (
            <View
              style={{
                backgroundColor: '#fff',
                borderRadius: 16,
                padding: 20,
                alignItems: 'center',
                borderWidth: 1,
                borderColor: '#E2E8F0',
              }}
            >
              <MaterialIcons name="search-off" size={36} color="#94A3B8" />
              <Text style={{ color: '#94A3B8', fontWeight: '700', marginTop: 8 }}>
                No hay zonas disponibles con estos filtros.
              </Text>
            </View>
          ) : (
            filtered.map((zone) => (
              <TouchableOpacity key={zone.id} onPress={() => setSelectedZone(zone)}>
                <CardBox>
                  <View className="flex-row items-center gap-3">
                    <View
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 99,
                        backgroundColor: `${LEVEL_COLORS[zone.level]}20`,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <MaterialIcons name="place" size={22} color={LEVEL_COLORS[zone.level]} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontWeight: '800', color: '#0F172A' }}>{zone.name}</Text>
                      <Text style={{ color: '#0F172A99', fontSize: 13 }}>
                        {zone.type} · {zone.species.slice(0, 2).join(', ')}
                      </Text>
                    </View>
                    <View className="items-end gap-1">
                      <StatusPill status={zone.level.charAt(0).toUpperCase() + zone.level.slice(1)} />
                      <TouchableOpacity onPress={() => toggleFavorite(zone.id)}>
                        <MaterialIcons
                          name={favorites.has(zone.id) ? 'favorite' : 'favorite-border'}
                          size={20}
                          color={favorites.has(zone.id) ? COLORS.danger : '#94A3B8'}
                        />
                      </TouchableOpacity>
                    </View>
                  </View>
                </CardBox>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

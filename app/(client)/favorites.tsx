import React, { useState } from 'react';
import { ScrollView, View, Text, TouchableOpacity, Image } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '@/lib/constants';
import { HeaderCard } from '@/components/ui/HeaderCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { useRouter } from 'expo-router';
import { ZONE_ID_TO_PHOTO } from '@/lib/zone-photos';

const SEED_FAVORITES = [
  { id: 'z2', name: 'Playa La Ropa',          level: 'principiante', type: 'Playa',    species: ['Jurel', 'Sierra'],           savedAt: '10/07/2026' },
  { id: 'z4', name: 'Bahía de Zihuatanejo',   level: 'principiante', type: 'Bahía',    species: ['Huachinango', 'Robalo'],     savedAt: '05/07/2026' },
];

const LEVEL_COLORS: Record<string, string> = {
  principiante: COLORS.success,
  intermedio: COLORS.warning,
  avanzado: COLORS.danger,
};

function FavoriteCard({ zone, onRemove }: { zone: typeof SEED_FAVORITES[0]; onRemove: () => void }) {
  const photo = ZONE_ID_TO_PHOTO[zone.id] ?? null;
  const color = LEVEL_COLORS[zone.level];
  return (
    <View style={{ backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', marginBottom: 12, borderWidth: 1, borderColor: '#E2E8F0', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8, elevation: 2 }}>
      <View style={{ height: 130, backgroundColor: `${color}15` }}>
        {photo
          ? <Image source={photo} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
          : <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><MaterialIcons name="place" size={36} color={color} /></View>
        }
        <View style={{ position: 'absolute', top: 10, left: 10, backgroundColor: color, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 }}>
          <Text style={{ color: '#fff', fontSize: 11, fontWeight: '800' }}>{zone.level}</Text>
        </View>
        <TouchableOpacity onPress={onRemove} style={{ position: 'absolute', top: 10, right: 10, backgroundColor: 'rgba(220,38,38,0.85)', borderRadius: 999, padding: 6 }}>
          <MaterialIcons name="favorite" size={16} color="#fff" />
        </TouchableOpacity>
      </View>
      <View style={{ padding: 12 }}>
        <Text style={{ fontWeight: '800', color: '#0F172A', fontSize: 15 }}>{zone.name}</Text>
        <Text style={{ color: '#64748B', fontSize: 12, marginTop: 2 }}>{zone.type} · {zone.species.join(', ')}</Text>
        <Text style={{ color: '#94A3B8', fontSize: 11, marginTop: 4 }}>Guardado el {zone.savedAt}</Text>
      </View>
    </View>
  );
}

export default function FavoritesScreen() {
  const router = useRouter();
  const [favorites, setFavorites] = useState(SEED_FAVORITES);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
        <HeaderCard
          title="Mis favoritos"
          subtitle="Zonas de pesca que guardaste para acceso rápido."
          icon="favorite"
          color={COLORS.danger}
        />

        {favorites.length === 0 ? (
          <EmptyState
            icon="favorite-border"
            title="Sin favoritos aún"
            message="Explora el mapa y guarda las zonas que más te gusten."
            buttonLabel="Explorar mapa"
            onPress={() => router.push('/(client)/map')}
          />
        ) : (
          favorites.map((zone) => {
            const color = LEVEL_COLORS[zone.level];
            return (
              <FavoriteCard
                key={zone.id}
                zone={zone}
                onRemove={() => setFavorites((prev) => prev.filter((f) => f.id !== zone.id))}
              />
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

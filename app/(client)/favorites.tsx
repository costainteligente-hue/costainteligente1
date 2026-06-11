import React, { useState } from 'react';
import { ScrollView, View, Text, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '@/lib/constants';
import { CardBox } from '@/components/ui/CardBox';
import { HeaderCard } from '@/components/ui/HeaderCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { useRouter } from 'expo-router';

const SEED_FAVORITES = [
  { id: 'z1', name: 'Bajo de Chila', level: 'intermedio', type: 'Offshore', species: ['Pez vela', 'Marlín azul'], savedAt: '10/07/2026' },
  { id: 'z4', name: 'Bahía de Zihuatanejo', level: 'principiante', type: 'Bahía', species: ['Huachinango', 'Robalo'], savedAt: '05/07/2026' },
];

const LEVEL_COLORS: Record<string, string> = {
  principiante: COLORS.success,
  intermedio: COLORS.warning,
  avanzado: COLORS.danger,
};

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
          favorites.map((zone) => (
            <CardBox key={zone.id}>
              <View className="flex-row items-center gap-3">
                <View
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 16,
                    backgroundColor: `${LEVEL_COLORS[zone.level]}20`,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <MaterialIcons name="place" size={26} color={LEVEL_COLORS[zone.level]} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: '800', color: '#0F172A', fontSize: 15 }}>{zone.name}</Text>
                  <Text style={{ color: '#0F172A99', fontSize: 13 }}>
                    {zone.type} · {zone.species.join(', ')}
                  </Text>
                  <Text style={{ color: '#94A3B8', fontSize: 11, marginTop: 2 }}>
                    Guardado el {zone.savedAt}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => setFavorites((prev) => prev.filter((f) => f.id !== zone.id))}
                >
                  <MaterialIcons name="favorite" size={24} color={COLORS.danger} />
                </TouchableOpacity>
              </View>
            </CardBox>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

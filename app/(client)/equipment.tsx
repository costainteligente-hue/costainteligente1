import React, { useState } from 'react';
import { ScrollView, View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { eq, and } from 'drizzle-orm';
import { getDb } from '@/lib/db/client';
import { equipment as equipmentTable } from '@/lib/db/schema';
import { COLORS } from '@/lib/constants';
import { CardBox } from '@/components/ui/CardBox';
import { HeaderCard } from '@/components/ui/HeaderCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { InfoBox } from '@/components/ui/InfoBox';

type Level = 'principiante' | 'intermedio' | 'avanzado';

interface Equipment {
  id: string;
  name: string;
  description: string;
  level: Level;
  recommended_use: string | null;
  image_url: string | null;
}

// Datos de muestra para cuando la base de datos está vacía
const SEED_EQUIPMENT: Equipment[] = [
  { id: 'e1', name: 'Caña spinning 7 ft acción media', description: 'Ideal para pesca costera con señuelos ligeros. Fácil de manejar para principiantes.', level: 'principiante', recommended_use: 'Pesca desde la orilla o embarcación pequeña', image_url: null },
  { id: 'e2', name: 'Carrete spinning 3000', description: 'Carrete de relación 5.2:1, suficiente para pesca recreativa en bahía.', level: 'principiante', recommended_use: 'Peces de fondo y especies costeras', image_url: null },
  { id: 'e3', name: 'Línea monofilamento 12 lb', description: 'Línea translúcida con buena elongación para absorber jalones de peces medianos.', level: 'principiante', recommended_use: 'Robalo, huachinango y jurel', image_url: null },
  { id: 'e4', name: 'Caña casting 7 ft acción rápida', description: 'Caña de carbono con acción rápida para lanzamientos de precisión con señuelos pesados.', level: 'intermedio', recommended_use: 'Pesca con jigs y señuelos topwater', image_url: null },
  { id: 'e5', name: 'Carrete baitcasting 200 series', description: 'Control de freno magnético para lanzamientos de media distancia. Relación 7.2:1.', level: 'intermedio', recommended_use: 'Pez vela pequeño y dorado costero', image_url: null },
  { id: 'e6', name: 'Línea trenzada 30 lb PE 2.0', description: 'Línea de alta resistencia y diámetro reducido. Sin elongación para sensación directa.', level: 'intermedio', recommended_use: 'Jigging y spinning en zonas rocosas', image_url: null },
  { id: 'e7', name: 'Caña offshore 80 lb clase B', description: 'Caña de fibra de vidrio reforzada para pesca de altura con tróleo o jigging profundo.', level: 'avanzado', recommended_use: 'Marlín, atún y pez vela grande', image_url: null },
  { id: 'e8', name: 'Carrete two-speed 80W', description: 'Carrete de doble velocidad con capacidad para 600 m de línea 80 lb. Para peces grandes.', level: 'avanzado', recommended_use: 'Pesca de altura y tróleo', image_url: null },
  { id: 'e9', name: 'Línea trenzada 80 lb PE 6.0', description: 'Máxima resistencia para pelea prolongada con peces grandes en aguas profundas.', level: 'avanzado', recommended_use: 'Marlín azul, wahoo y atún aleta amarilla', image_url: null },
];

function useEquipment(level: Level) {
  return useQuery({
    queryKey: ['equipment', level],
    queryFn: async () => {
      const db = getDb();
      const rows = await db
        .select()
        .from(equipmentTable)
        .where(and(eq(equipmentTable.level, level), eq(equipmentTable.isActive, true)));
      return rows as Equipment[];
    },
    staleTime: 1000 * 60 * 60 * 24,
    gcTime: 1000 * 60 * 60 * 48,
    retry: 1,
  });
}

const LEVEL_CONFIG: { key: Level; label: string; icon: keyof typeof MaterialIcons.glyphMap; color: string }[] = [
  { key: 'principiante', label: 'Principiante', icon: 'star-border', color: COLORS.success },
  { key: 'intermedio', label: 'Intermedio', icon: 'star-half', color: COLORS.warning },
  { key: 'avanzado', label: 'Avanzado', icon: 'star', color: COLORS.danger },
];

export default function EquipmentScreen() {
  const [level, setLevel] = useState<Level>('principiante');
  const { data, isLoading, isError } = useEquipment(level);

  // Usar seed si la DB está vacía
  const items: Equipment[] =
    data && data.length > 0
      ? data
      : SEED_EQUIPMENT.filter((e) => e.level === level);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        <HeaderCard
          title="Equipo recomendado"
          subtitle="Selecciona tu nivel de experiencia para ver el equipo adecuado."
          icon="straighten"
          color={COLORS.ocean}
        />

        {/* Level selector */}
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
          {LEVEL_CONFIG.map((cfg) => (
            <TouchableOpacity
              key={cfg.key}
              onPress={() => setLevel(cfg.key)}
              style={{
                flex: 1,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 4,
                paddingVertical: 10,
                borderRadius: 14,
                backgroundColor: level === cfg.key ? cfg.color : '#fff',
                borderWidth: 1,
                borderColor: level === cfg.key ? cfg.color : '#E2E8F0',
              }}
            >
              <MaterialIcons
                name={cfg.icon}
                size={16}
                color={level === cfg.key ? '#fff' : '#64748B'}
              />
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: '800',
                  color: level === cfg.key ? '#fff' : '#64748B',
                }}
              >
                {cfg.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Loading */}
        {isLoading && (
          <View style={{ alignItems: 'center', paddingVertical: 40 }}>
            <ActivityIndicator color={COLORS.ocean} size="large" />
          </View>
        )}

        {/* Empty */}
        {!isLoading && items.length === 0 && (
          <View
            style={{
              backgroundColor: '#fff',
              borderRadius: 16,
              padding: 24,
              alignItems: 'center',
              borderWidth: 1,
              borderColor: '#E2E8F0',
            }}
          >
            <MaterialIcons name="construction" size={40} color="#94A3B8" />
            <Text style={{ color: '#94A3B8', fontWeight: '700', marginTop: 10, textAlign: 'center' }}>
              No hay equipo registrado para este nivel aún.
            </Text>
          </View>
        )}

        {/* Equipment list */}
        {!isLoading && items.map((item) => {
          const cfg = LEVEL_CONFIG.find((l) => l.key === item.level)!;
          return (
            <CardBox key={item.id}>
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
                <View
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 16,
                    backgroundColor: `${cfg.color}20`,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <MaterialIcons name="straighten" size={24} color={cfg.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: '800', color: '#0F172A', fontSize: 15 }}>
                    {item.name}
                  </Text>
                  <Text style={{ color: '#0F172A99', fontSize: 13, lineHeight: 19, marginTop: 4 }}>
                    {item.description}
                  </Text>
                  {item.recommended_use && (
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 5,
                        marginTop: 8,
                        backgroundColor: `${cfg.color}12`,
                        borderRadius: 8,
                        paddingHorizontal: 8,
                        paddingVertical: 4,
                        alignSelf: 'flex-start',
                      }}
                    >
                      <MaterialIcons name="check-circle" size={13} color={cfg.color} />
                      <Text style={{ color: cfg.color, fontSize: 12, fontWeight: '700' }}>
                        {item.recommended_use}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            </CardBox>
          );
        })}

        <InfoBox text="El equipo recomendado se actualiza según las condiciones de pesca locales en Zihuatanejo. Consulta a los proveedores verificados para equiparte correctamente." />
      </ScrollView>
    </SafeAreaView>
  );
}

import React, { useState } from 'react';
import { ScrollView, View, Text, TouchableOpacity, Switch, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '@/lib/constants';
import { CardBox } from '@/components/ui/CardBox';
import { HeaderCard } from '@/components/ui/HeaderCard';
import { StatusPill } from '@/components/ui/StatusPill';
import { InfoBox } from '@/components/ui/InfoBox';

interface Zone {
  id: string; name: string; level: string; type: string;
  isActive: boolean; species: string[]; lat: number; lon: number;
}

const INITIAL_ZONES: Zone[] = [
  { id: 'z1', name: 'Bajo de Chila', level: 'intermedio', type: 'Offshore', isActive: true, species: ['Pez vela', 'Marlín', 'Dorado'], lat: 17.58, lon: -101.62 },
  { id: 'z2', name: 'La Ropa', level: 'principiante', type: 'Playa', isActive: true, species: ['Jurel', 'Sierra', 'Robalo'], lat: 17.63, lon: -101.55 },
  { id: 'z3', name: 'Punta Ixtapa', level: 'avanzado', type: 'Rocas', isActive: true, species: ['Atún', 'Wahoo', 'Pez vela'], lat: 17.67, lon: -101.64 },
  { id: 'z4', name: 'Bahía de Zihuatanejo', level: 'principiante', type: 'Bahía', isActive: true, species: ['Huachinango', 'Robalo', 'Mojarra'], lat: 17.64, lon: -101.55 },
  { id: 'z5', name: 'Morro de Petatlán', level: 'avanzado', type: 'Offshore', isActive: false, species: ['Marlín rayado', 'Atún'], lat: 17.52, lon: -101.71 },
];

const LEVEL_COLOR: Record<string, string> = {
  principiante: COLORS.success, intermedio: COLORS.warning, avanzado: COLORS.danger,
};

export default function ZonesScreen() {
  const [zones, setZones] = useState<Zone[]>(INITIAL_ZONES);

  const toggle = (id: string) => {
    const zone = zones.find((z) => z.id === id);
    if (!zone) return;
    const msg = zone.isActive
      ? `Desactivar "${zone.name}" la ocultará del mapa para los clientes sin eliminar el registro.`
      : `Activar "${zone.name}" la mostrará nuevamente en el mapa.`;
    Alert.alert(zone.isActive ? 'Desactivar zona' : 'Activar zona', msg, [
      { text: 'Cancelar', style: 'cancel' },
      { text: zone.isActive ? 'Desactivar' : 'Activar', onPress: () => setZones((prev) => prev.map((z) => z.id === id ? { ...z, isActive: !z.isActive } : z)) },
    ]);
  };

  const activeCount = zones.filter((z) => z.isActive).length;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
        <HeaderCard
          title="Zonas de pesca"
          subtitle={`${activeCount} activas · ${zones.length - activeCount} desactivadas`}
          icon="place"
          color={COLORS.info}
        />

        <TouchableOpacity
          style={{
            backgroundColor: COLORS.ocean, borderRadius: 14, padding: 14, marginBottom: 16,
            flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}
        >
          <MaterialIcons name="add-location-alt" size={20} color="#fff" />
          <Text style={{ color: '#fff', fontWeight: '800' }}>Agregar nueva zona</Text>
        </TouchableOpacity>

        {zones.map((zone) => (
          <CardBox key={zone.id}>
            <View className="flex-row items-start gap-3">
              <View style={{
                width: 48, height: 48, borderRadius: 16,
                backgroundColor: `${LEVEL_COLOR[zone.level] ?? COLORS.info}20`,
                alignItems: 'center', justifyContent: 'center',
              }}>
                <MaterialIcons name="place" size={26} color={LEVEL_COLOR[zone.level] ?? COLORS.info} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: '800', color: '#0F172A', fontSize: 15 }}>{zone.name}</Text>
                <Text style={{ color: '#0F172A99', fontSize: 13 }}>{zone.type} · {zone.level}</Text>
                <Text style={{ color: '#94A3B8', fontSize: 12, marginTop: 2 }}>
                  {zone.species.join(', ')}
                </Text>
                <Text style={{ color: '#94A3B8', fontSize: 11, marginTop: 2 }}>
                  {zone.lat.toFixed(4)}° N · {Math.abs(zone.lon).toFixed(4)}° O
                </Text>
              </View>
              <Switch
                value={zone.isActive}
                onValueChange={() => toggle(zone.id)}
                trackColor={{ false: '#E2E8F0', true: `${COLORS.success}60` }}
                thumbColor={zone.isActive ? COLORS.success : '#fff'}
              />
            </View>
            <View style={{ height: 1, backgroundColor: '#E2E8F0', marginVertical: 10 }} />
            <View className="flex-row items-center justify-between">
              <StatusPill status={zone.isActive ? 'Activa' : 'Desactivada'} />
              <View className="flex-row gap-2">
                <TouchableOpacity className="p-2">
                  <MaterialIcons name="edit" size={20} color={COLORS.ocean} />
                </TouchableOpacity>
                <TouchableOpacity className="p-2">
                  <MaterialIcons name="bar-chart" size={20} color={COLORS.info} />
                </TouchableOpacity>
              </View>
            </View>
          </CardBox>
        ))}

        <InfoBox text="Desactivar una zona la oculta del mapa sin eliminar el registro. Los datos históricos se conservan." />
      </ScrollView>
    </SafeAreaView>
  );
}

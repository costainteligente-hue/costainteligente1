/**
 * Admin — Gestión de zonas de pesca (datos reales)
 */
import React, { useState } from 'react';
import { ScrollView, View, Text, TouchableOpacity, Switch, Alert, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { COLORS } from '@/lib/constants';
import { CardBox } from '@/components/ui/CardBox';
import { HeaderCard } from '@/components/ui/HeaderCard';
import { StatusPill } from '@/components/ui/StatusPill';
import { InfoBox } from '@/components/ui/InfoBox';
import { EmptyState } from '@/components/ui/EmptyState';

const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? '';

interface Zone {
  id: string; name: string; level: string; zoneType: string;
  isActive: boolean; latitude: number; longitude: number;
  description: string | null;
}

// ─── Fetch / mutate ───────────────────────────────────────────────────────────
async function fetchZones(): Promise<Zone[]> {
  if (typeof window !== 'undefined') {
    const res = await fetch(`${API_BASE}/api/admin/zones`);
    if (!res.ok) throw new Error('Error cargando zonas');
    return res.json();
  }
  const { getDb } = await import('@/lib/db/client');
  const { fishingZones } = await import('@/lib/db/schema');
  const { desc } = await import('drizzle-orm');
  const db = getDb();
  const rows = await db.select().from(fishingZones).orderBy(desc(fishingZones.createdAt));
  return rows.map((r: any) => ({
    id: r.id, name: r.name, level: r.level, zoneType: r.zoneType,
    isActive: r.isActive, latitude: r.latitude, longitude: r.longitude,
    description: r.description,
  }));
}

async function toggleZoneActive(payload: { id: string; isActive: boolean }) {
  if (typeof window !== 'undefined') {
    const res = await fetch(`${API_BASE}/api/admin/zones`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Error al actualizar zona');
    return;
  }
  const { getDb } = await import('@/lib/db/client');
  const { fishingZones } = await import('@/lib/db/schema');
  const { eq } = await import('drizzle-orm');
  await getDb().update(fishingZones).set({ isActive: payload.isActive, updatedAt: new Date() }).where(eq(fishingZones.id, payload.id));
}

const LEVEL_COLOR: Record<string, string> = {
  principiante: COLORS.success, intermedio: COLORS.warning, avanzado: COLORS.danger,
};

// ─── Pantalla ─────────────────────────────────────────────────────────────────
export default function ZonesScreen() {
  const qc = useQueryClient();
  const { data, isLoading, error, refetch } = useQuery({ queryKey: ['admin_zones'], queryFn: fetchZones, staleTime: 1000 * 60 * 3 });
  const mutation = useMutation({
    mutationFn: toggleZoneActive,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin_zones'] }),
  });

  const zones = data ?? [];
  const activeCount = zones.filter((z) => z.isActive).length;

  const toggle = (zone: Zone) => {
    const msg = zone.isActive
      ? `Desactivar "${zone.name}" la ocultará del mapa para los clientes.`
      : `Activar "${zone.name}" la mostrará nuevamente en el mapa.`;
    Alert.alert(zone.isActive ? 'Desactivar zona' : 'Activar zona', msg, [
      { text: 'Cancelar', style: 'cancel' },
      { text: zone.isActive ? 'Desactivar' : 'Activar', onPress: () => mutation.mutate({ id: zone.id, isActive: !zone.isActive }) },
    ]);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
        <HeaderCard
          title="Zonas de pesca"
          subtitle={isLoading ? 'Cargando...' : `${activeCount} activas · ${zones.length - activeCount} desactivadas`}
          icon="place" color={COLORS.info}
        />

        <TouchableOpacity style={{ backgroundColor: COLORS.ocean, borderRadius: 14, padding: 14, marginBottom: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <MaterialIcons name="add-location-alt" size={20} color="#fff" />
          <Text style={{ color: '#fff', fontWeight: '800' }}>Agregar nueva zona</Text>
        </TouchableOpacity>

        {isLoading && (
          <View style={{ alignItems: 'center', paddingVertical: 40 }}>
            <ActivityIndicator size="large" color={COLORS.ocean} />
            <Text style={{ color: '#64748B', marginTop: 12 }}>Cargando zonas...</Text>
          </View>
        )}

        {!isLoading && error && (
          <View style={{ backgroundColor: `${COLORS.danger}10`, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: `${COLORS.danger}30` }}>
            <Text style={{ color: COLORS.danger, fontWeight: '700' }}>Error al cargar zonas.</Text>
            <TouchableOpacity onPress={() => refetch()}><Text style={{ color: COLORS.ocean, fontWeight: '800', marginTop: 8 }}>Reintentar</Text></TouchableOpacity>
          </View>
        )}

        {!isLoading && !error && zones.length === 0 && (
          <EmptyState icon="place" title="Sin zonas" message="No hay zonas de pesca registradas aún." buttonLabel="Actualizar" onPress={() => refetch()} />
        )}

        {zones.map((zone) => (
          <CardBox key={zone.id}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
              <View style={{ width: 48, height: 48, borderRadius: 16, backgroundColor: `${LEVEL_COLOR[zone.level] ?? COLORS.info}20`, alignItems: 'center', justifyContent: 'center' }}>
                <MaterialIcons name="place" size={26} color={LEVEL_COLOR[zone.level] ?? COLORS.info} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: '800', color: '#0F172A', fontSize: 15 }}>{zone.name}</Text>
                <Text style={{ color: '#64748B', fontSize: 13 }}>{zone.zoneType} · {zone.level}</Text>
                {zone.description && (
                  <Text style={{ color: '#94A3B8', fontSize: 12, marginTop: 2 }} numberOfLines={2}>{zone.description}</Text>
                )}
                <Text style={{ color: '#94A3B8', fontSize: 11, marginTop: 2 }}>
                  {zone.latitude.toFixed(4)}° N · {Math.abs(zone.longitude).toFixed(4)}° O
                </Text>
              </View>
              <Switch
                value={zone.isActive}
                onValueChange={() => toggle(zone)}
                trackColor={{ false: '#E2E8F0', true: `${COLORS.success}60` }}
                thumbColor={zone.isActive ? COLORS.success : '#fff'}
                disabled={mutation.isPending}
              />
            </View>
            <View style={{ height: 1, backgroundColor: '#E2E8F0', marginVertical: 10 }} />
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <StatusPill status={zone.isActive ? 'Activa' : 'Desactivada'} />
              <TouchableOpacity style={{ padding: 6 }}>
                <MaterialIcons name="edit" size={20} color={COLORS.ocean} />
              </TouchableOpacity>
            </View>
          </CardBox>
        ))}

        <InfoBox text="Desactivar una zona la oculta del mapa sin eliminar el registro. Los datos históricos se conservan." />
      </ScrollView>
    </SafeAreaView>
  );
}

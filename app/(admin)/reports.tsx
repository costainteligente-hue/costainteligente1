import React, { useState } from 'react';
import { ScrollView, View, Text, TouchableOpacity, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '@/lib/constants';
import { CardBox } from '@/components/ui/CardBox';
import { HeaderCard } from '@/components/ui/HeaderCard';
import { StatusPill } from '@/components/ui/StatusPill';
import { InfoBox } from '@/components/ui/InfoBox';
import { EmptyState } from '@/components/ui/EmptyState';

interface Report {
  id: string;
  reportType: 'provider' | 'post' | 'user';
  targetName: string;
  reporterName: string;
  description: string;
  createdAt: string;
  status: 'pending' | 'resolved';
}

const INITIAL_REPORTS: Report[] = [
  {
    id: 'rp1', reportType: 'provider', targetName: 'Lanchas El Cazador',
    reporterName: 'Carlos M.', description: 'El proveedor no se presentó a la reservación confirmada y no respondió mensajes.',
    createdAt: '13/07/2026', status: 'pending',
  },
  {
    id: 'rp2', reportType: 'post', targetName: 'Publicación de Juan R.',
    reporterName: 'Ana T.', description: 'La foto publicada contiene imágenes inapropiadas que no cumplen con las políticas de la comunidad.',
    createdAt: '11/07/2026', status: 'pending',
  },
  {
    id: 'rp3', reportType: 'user', targetName: 'Usuario anónimo',
    reporterName: 'Jorge L.', description: 'Este usuario ha enviado mensajes de acoso a través del chat de reservaciones.',
    createdAt: '08/07/2026', status: 'resolved',
  },
];

const TYPE_CONFIG: Record<string, { color: string; icon: keyof typeof MaterialIcons.glyphMap; label: string }> = {
  provider: { color: COLORS.warning, icon: 'storefront', label: 'Proveedor' },
  post: { color: COLORS.purple, icon: 'photo-camera', label: 'Publicación' },
  user: { color: COLORS.danger, icon: 'person', label: 'Usuario' },
};

export default function ReportsScreen() {
  const [reports, setReports] = useState<Report[]>(INITIAL_REPORTS);
  const [filter, setFilter] = useState<'all' | 'pending' | 'resolved'>('all');

  const filtered = reports.filter((r) =>
    filter === 'all' ? true : r.status === filter,
  );

  const resolve = (id: string) => {
    Alert.alert('Resolver reporte', '¿Marcar este reporte como resuelto?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Resolver',
        onPress: () =>
          setReports((prev) =>
            prev.map((r) => (r.id === id ? { ...r, status: 'resolved' } : r)),
          ),
      },
    ]);
  };

  const pending = reports.filter((r) => r.status === 'pending').length;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
        <HeaderCard
          title="Reportes y denuncias"
          subtitle={`${pending} pendiente${pending !== 1 ? 's' : ''} de revisión.`}
          icon="report"
          color={COLORS.danger}
        />

        {/* Filter tabs */}
        <View
          style={{
            flexDirection: 'row',
            backgroundColor: '#F1F5F9',
            borderRadius: 14,
            padding: 4,
            marginBottom: 16,
            gap: 4,
          }}
        >
          {(['all', 'pending', 'resolved'] as const).map((f) => {
            const labels = { all: 'Todos', pending: 'Pendientes', resolved: 'Resueltos' };
            return (
              <TouchableOpacity
                key={f}
                onPress={() => setFilter(f)}
                style={{
                  flex: 1,
                  alignItems: 'center',
                  paddingVertical: 8,
                  borderRadius: 12,
                  backgroundColor: filter === f ? '#fff' : 'transparent',
                }}
              >
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: '700',
                    color: filter === f ? COLORS.ocean : '#64748B',
                  }}
                >
                  {labels[f]}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {filtered.length === 0 ? (
          <EmptyState
            icon="check-circle"
            title="Sin reportes"
            message="No hay reportes en esta categoría."
            buttonLabel="Ver todos"
            onPress={() => setFilter('all')}
          />
        ) : (
          filtered.map((report) => {
            const cfg = TYPE_CONFIG[report.reportType];
            return (
              <CardBox key={report.id}>
                <View className="flex-row items-start gap-3">
                  <View
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 14,
                      backgroundColor: `${cfg.color}20`,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <MaterialIcons name={cfg.icon} size={22} color={cfg.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View className="flex-row items-center gap-2 mb-1 flex-wrap">
                      <Text style={{ fontWeight: '800', color: '#0F172A', flex: 1 }}>
                        {report.targetName}
                      </Text>
                      <StatusPill status={cfg.label} />
                    </View>
                    <Text style={{ color: '#0F172A99', fontSize: 13, lineHeight: 18 }}>
                      {report.description}
                    </Text>
                    <Text style={{ color: '#94A3B8', fontSize: 12, marginTop: 6 }}>
                      Reportado por {report.reporterName} · {report.createdAt}
                    </Text>
                  </View>
                </View>

                <View
                  style={{ height: 1, backgroundColor: '#E2E8F0', marginVertical: 10 }}
                />

                <View className="flex-row items-center justify-between">
                  <StatusPill status={report.status === 'pending' ? 'Pendiente' : 'Resuelto'} />
                  {report.status === 'pending' && (
                    <TouchableOpacity
                      onPress={() => resolve(report.id)}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 6,
                        paddingHorizontal: 14,
                        paddingVertical: 8,
                        borderRadius: 12,
                        backgroundColor: `${COLORS.success}15`,
                        borderWidth: 1,
                        borderColor: `${COLORS.success}30`,
                      }}
                    >
                      <MaterialIcons name="check" size={16} color={COLORS.success} />
                      <Text style={{ color: COLORS.success, fontWeight: '800', fontSize: 13 }}>
                        Marcar resuelto
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </CardBox>
            );
          })
        )}

        <InfoBox text="Resolver un reporte registra la acción en el log de auditoría. No elimina automáticamente el contenido denunciado." />
      </ScrollView>
    </SafeAreaView>
  );
}

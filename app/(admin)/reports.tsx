/**
 * Admin — Reportes y denuncias (datos reales)
 */
import React, { useState } from 'react';
import { ScrollView, View, Text, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
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

interface Report {
  id: string; reportType: 'provider' | 'post' | 'user';
  targetId: string; description: string; status: 'pending' | 'resolved';
  reporterName: string; createdAt: string;
}

// ─── Fetch / mutate ───────────────────────────────────────────────────────────
async function fetchReports(): Promise<Report[]> {
  if (typeof window !== 'undefined') {
    const res = await fetch(`${API_BASE}/api/admin?r=reports`);
    if (!res.ok) throw new Error('Error cargando reportes');
    return res.json();
  }
  const { getDb } = await import('@/lib/db/client');
  const { reports, profiles } = await import('@/lib/db/schema');
  const { eq, desc } = await import('drizzle-orm');
  const db = getDb();
  const rows = await db
    .select({
      id: reports.id, reportType: reports.reportType, targetId: reports.targetId,
      description: reports.description, status: reports.status, createdAt: reports.createdAt,
      reporterName: profiles.fullName,
    })
    .from(reports)
    .leftJoin(profiles, eq(reports.reporterId, profiles.id))
    .orderBy(desc(reports.createdAt))
    .limit(100);
  return rows.map((r: any) => ({
    id: r.id, reportType: r.reportType, targetId: r.targetId,
    description: r.description, status: r.status,
    reporterName: r.reporterName ?? 'Usuario',
    createdAt: r.createdAt instanceof Date ? r.createdAt.toLocaleDateString('es-MX') : String(r.createdAt ?? ''),
  }));
}

async function resolveReport(id: string) {
  if (typeof window !== 'undefined') {
    const res = await fetch(`${API_BASE}/api/admin?r=reports`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }),
    });
    if (!res.ok) throw new Error('Error al resolver reporte');
    return;
  }
  const { getDb } = await import('@/lib/db/client');
  const { reports } = await import('@/lib/db/schema');
  const { eq } = await import('drizzle-orm');
  await getDb().update(reports).set({ status: 'resolved', updatedAt: new Date() }).where(eq(reports.id, id));
}

const TYPE_CONFIG: Record<string, { color: string; icon: keyof typeof MaterialIcons.glyphMap; label: string }> = {
  provider: { color: COLORS.warning, icon: 'storefront', label: 'Proveedor' },
  post:     { color: COLORS.purple,  icon: 'photo-camera', label: 'Publicación' },
  user:     { color: COLORS.danger,  icon: 'person',      label: 'Usuario' },
};

export default function ReportsScreen() {
  const qc = useQueryClient();
  const { data, isLoading, error, refetch } = useQuery({ queryKey: ['admin_reports'], queryFn: fetchReports, staleTime: 1000 * 60 * 2 });
  const mutation = useMutation({ mutationFn: resolveReport, onSuccess: () => qc.invalidateQueries({ queryKey: ['admin_reports'] }) });
  const [filter, setFilter] = useState<'all' | 'pending' | 'resolved'>('all');

  const allReports = data ?? [];
  const filtered   = allReports.filter((r) => filter === 'all' || r.status === filter);
  const pending    = allReports.filter((r) => r.status === 'pending').length;

  const handleResolve = (id: string) => {
    Alert.alert('Resolver reporte', '¿Marcar este reporte como resuelto?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Resolver', onPress: () => mutation.mutate(id) },
    ]);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
        <HeaderCard
          title="Reportes y denuncias"
          subtitle={isLoading ? 'Cargando...' : `${pending} pendiente${pending !== 1 ? 's' : ''} de revisión`}
          icon="report" color={COLORS.danger}
        />

        {/* Filtros */}
        <View style={{ flexDirection: 'row', backgroundColor: '#F1F5F9', borderRadius: 14, padding: 4, marginBottom: 16, gap: 4 }}>
          {(['all', 'pending', 'resolved'] as const).map((f) => {
            const labels = { all: 'Todos', pending: 'Pendientes', resolved: 'Resueltos' };
            return (
              <TouchableOpacity key={f} onPress={() => setFilter(f)} style={{ flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 12, backgroundColor: filter === f ? '#fff' : 'transparent' }}>
                <Text style={{ fontSize: 12, fontWeight: '700', color: filter === f ? COLORS.ocean : '#64748B' }}>{labels[f]}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {isLoading && (
          <View style={{ alignItems: 'center', paddingVertical: 40 }}>
            <ActivityIndicator size="large" color={COLORS.ocean} />
            <Text style={{ color: '#64748B', marginTop: 12 }}>Cargando reportes...</Text>
          </View>
        )}

        {!isLoading && error && (
          <View style={{ backgroundColor: `${COLORS.danger}10`, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: `${COLORS.danger}30` }}>
            <Text style={{ color: COLORS.danger, fontWeight: '700' }}>Error al cargar reportes.</Text>
            <TouchableOpacity onPress={() => refetch()}><Text style={{ color: COLORS.ocean, fontWeight: '800', marginTop: 8 }}>Reintentar</Text></TouchableOpacity>
          </View>
        )}

        {!isLoading && !error && filtered.length === 0 && (
          <EmptyState icon="check-circle" title="Sin reportes" message="No hay reportes en esta categoría." buttonLabel="Ver todos" onPress={() => setFilter('all')} />
        )}

        {filtered.map((report) => {
          const cfg = TYPE_CONFIG[report.reportType] ?? TYPE_CONFIG.user;
          return (
            <CardBox key={report.id}>
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
                <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: `${cfg.color}20`, alignItems: 'center', justifyContent: 'center' }}>
                  <MaterialIcons name={cfg.icon} size={22} color={cfg.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                    <StatusPill status={cfg.label} />
                    <Text style={{ color: '#94A3B8', fontSize: 11 }}>{report.createdAt}</Text>
                  </View>
                  <Text style={{ color: '#0F172A', fontSize: 13, lineHeight: 18 }}>{report.description}</Text>
                  <Text style={{ color: '#94A3B8', fontSize: 12, marginTop: 4 }}>
                    Reportado por {report.reporterName}
                  </Text>
                </View>
              </View>
              <View style={{ height: 1, backgroundColor: '#E2E8F0', marginVertical: 10 }} />
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <StatusPill status={report.status === 'pending' ? 'Pendiente' : 'Resuelto'} />
                {report.status === 'pending' && (
                  <TouchableOpacity
                    onPress={() => handleResolve(report.id)}
                    disabled={mutation.isPending}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, backgroundColor: `${COLORS.success}15`, borderWidth: 1, borderColor: `${COLORS.success}30` }}
                  >
                    <MaterialIcons name="check" size={16} color={COLORS.success} />
                    <Text style={{ color: COLORS.success, fontWeight: '800', fontSize: 13 }}>Marcar resuelto</Text>
                  </TouchableOpacity>
                )}
              </View>
            </CardBox>
          );
        })}

        <InfoBox text="Resolver un reporte registra la acción en el log de auditoría. No elimina automáticamente el contenido denunciado." />
      </ScrollView>
    </SafeAreaView>
  );
}

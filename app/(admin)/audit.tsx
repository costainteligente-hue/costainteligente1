/**
 * Admin — Logs de auditoría (datos reales)
 */
import React, { useState } from 'react';
import { ScrollView, View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { COLORS } from '@/lib/constants';
import { CardBox } from '@/components/ui/CardBox';
import { HeaderCard } from '@/components/ui/HeaderCard';
import { InfoBox } from '@/components/ui/InfoBox';
import { EmptyState } from '@/components/ui/EmptyState';

const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? '';

interface AuditLog {
  id: string; adminName: string; action: string;
  targetType: string | null; targetId: string | null;
  description: string | null; createdAt: string;
}

const ACTION_CONFIG: Record<string, { color: string; icon: keyof typeof MaterialIcons.glyphMap }> = {
  approve_provider: { color: COLORS.success, icon: 'check-circle' },
  reject_provider:  { color: COLORS.danger,  icon: 'cancel' },
  resolve_report:   { color: COLORS.info,    icon: 'task-alt' },
  deactivate_zone:  { color: COLORS.warning, icon: 'location-off' },
  activate_zone:    { color: COLORS.success, icon: 'location-on' },
  send_alert:       { color: COLORS.ocean,   icon: 'notifications-active' },
  block_user:       { color: COLORS.danger,  icon: 'block' },
  suspend_user:     { color: COLORS.warning, icon: 'pause-circle' },
};

async function fetchAuditLogs(): Promise<AuditLog[]> {
  if (typeof window !== 'undefined') {
    const res = await fetch(`${API_BASE}/api/admin?r=audit`);
    if (!res.ok) throw new Error('Error cargando logs');
    return res.json();
  }
  const { getDb } = await import('@/lib/db/client');
  const { auditLogs, profiles } = await import('@/lib/db/schema');
  const { eq, desc } = await import('drizzle-orm');
  const db   = getDb();
  const rows = await db
    .select({
      id: auditLogs.id, action: auditLogs.action,
      targetType: auditLogs.targetType, targetId: auditLogs.targetId,
      description: auditLogs.description, createdAt: auditLogs.createdAt,
      adminName: profiles.fullName,
    })
    .from(auditLogs)
    .leftJoin(profiles, eq(auditLogs.adminId, profiles.id))
    .orderBy(desc(auditLogs.createdAt))
    .limit(100);
  return rows.map((r: any) => ({
    id: r.id, action: r.action, targetType: r.targetType, targetId: r.targetId,
    description: r.description, adminName: r.adminName ?? 'Admin',
    createdAt: r.createdAt instanceof Date ? r.createdAt.toLocaleString('es-MX') : String(r.createdAt ?? ''),
  }));
}

const PAGE_SIZE = 20;

export default function AuditScreen() {
  const { data, isLoading, error, refetch } = useQuery({ queryKey: ['admin_audit'], queryFn: fetchAuditLogs, staleTime: 1000 * 60 });
  const [page, setPage] = useState(1);

  const logs   = data ?? [];
  const paged  = logs.slice(0, page * PAGE_SIZE);
  const hasMore = paged.length < logs.length;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
        <HeaderCard
          title="Logs de auditoría"
          subtitle={isLoading ? 'Cargando...' : `${logs.length} acciones registradas`}
          icon="history" color={COLORS.purple}
        />

        {isLoading && (
          <View style={{ alignItems: 'center', paddingVertical: 40 }}>
            <ActivityIndicator size="large" color={COLORS.ocean} />
            <Text style={{ color: '#64748B', marginTop: 12 }}>Cargando registros...</Text>
          </View>
        )}

        {!isLoading && error && (
          <View style={{ backgroundColor: `${COLORS.danger}10`, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: `${COLORS.danger}30` }}>
            <Text style={{ color: COLORS.danger, fontWeight: '700' }}>Error al cargar logs.</Text>
            <TouchableOpacity onPress={() => refetch()}><Text style={{ color: COLORS.ocean, fontWeight: '800', marginTop: 8 }}>Reintentar</Text></TouchableOpacity>
          </View>
        )}

        {!isLoading && !error && logs.length === 0 && (
          <EmptyState icon="history" title="Sin registros" message="Aún no hay acciones registradas en el log de auditoría." buttonLabel="Actualizar" onPress={() => refetch()} />
        )}

        {paged.map((log) => {
          const cfg = ACTION_CONFIG[log.action] ?? { color: COLORS.ocean, icon: 'info' as const };
          return (
            <CardBox key={log.id}>
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
                <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: `${cfg.color}20`, alignItems: 'center', justifyContent: 'center' }}>
                  <MaterialIcons name={cfg.icon} size={20} color={cfg.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 2 }}>
                    <Text style={{ fontWeight: '800', color: '#0F172A', fontSize: 13 }}>{log.adminName}</Text>
                    <View style={{ backgroundColor: `${cfg.color}15`, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 }}>
                      <Text style={{ color: cfg.color, fontSize: 10, fontWeight: '800' }}>
                        {log.action.replace(/_/g, ' ').toUpperCase()}
                      </Text>
                    </View>
                  </View>
                  {log.targetType && (
                    <Text style={{ color: '#0F172A', fontWeight: '700', fontSize: 12 }}>
                      {log.targetType}{log.targetId ? ` · ${log.targetId.slice(0, 8)}…` : ''}
                    </Text>
                  )}
                  {log.description && (
                    <Text style={{ color: '#64748B', fontSize: 12, lineHeight: 17, marginTop: 2 }}>{log.description}</Text>
                  )}
                  <Text style={{ color: '#94A3B8', fontSize: 11, marginTop: 4 }}>{log.createdAt}</Text>
                </View>
              </View>
            </CardBox>
          );
        })}

        {hasMore && (
          <TouchableOpacity
            onPress={() => setPage((p) => p + 1)}
            style={{ alignItems: 'center', paddingVertical: 12, borderRadius: 14, borderWidth: 1, borderColor: '#E2E8F0', backgroundColor: '#fff', marginBottom: 8 }}
          >
            <Text style={{ color: COLORS.ocean, fontWeight: '800' }}>
              Cargar más ({logs.length - paged.length} restantes)
            </Text>
          </TouchableOpacity>
        )}

        <InfoBox text="El log registra todas las acciones administrativas con admin responsable, acción, entidad afectada y timestamp." />
      </ScrollView>
    </SafeAreaView>
  );
}

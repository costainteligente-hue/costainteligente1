import React, { useState } from 'react';
import { ScrollView, View, Text, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '@/lib/constants';
import { CardBox } from '@/components/ui/CardBox';
import { HeaderCard } from '@/components/ui/HeaderCard';
import { InfoBox } from '@/components/ui/InfoBox';

interface AuditLog {
  id: string;
  adminName: string;
  action: string;
  targetType: string;
  targetName: string;
  description: string;
  createdAt: string;
}

const ACTION_CONFIG: Record<string, { color: string; icon: keyof typeof MaterialIcons.glyphMap }> = {
  approve_provider: { color: COLORS.success, icon: 'check-circle' },
  reject_provider: { color: COLORS.danger, icon: 'cancel' },
  resolve_report: { color: COLORS.info, icon: 'task-alt' },
  deactivate_zone: { color: COLORS.warning, icon: 'location-off' },
  activate_zone: { color: COLORS.success, icon: 'location-on' },
  send_alert: { color: COLORS.ocean, icon: 'notifications-active' },
};

const AUDIT_LOGS: AuditLog[] = [
  {
    id: 'al1', adminName: 'Admin Principal', action: 'approve_provider',
    targetType: 'Proveedor', targetName: 'Mariscos La Gaviota',
    description: 'Proveedor aprobado tras revisión de documentos.', createdAt: '14/07/2026 10:32',
  },
  {
    id: 'al2', adminName: 'Admin Principal', action: 'send_alert',
    targetType: 'Alerta', targetName: 'Alerta de viento',
    description: 'Notificación push enviada a todos los usuarios.', createdAt: '10/07/2026 09:15',
  },
  {
    id: 'al3', adminName: 'Admin Principal', action: 'reject_provider',
    targetType: 'Proveedor', targetName: 'Lanchas Sin Papeles',
    description: 'Rechazado: documentación incompleta. Falta licencia de navegación.', createdAt: '09/07/2026 14:20',
  },
  {
    id: 'al4', adminName: 'Admin Principal', action: 'resolve_report',
    targetType: 'Reporte', targetName: 'Denuncia #rp2',
    description: 'Reporte resuelto tras revisión de contenido.', createdAt: '08/07/2026 11:05',
  },
  {
    id: 'al5', adminName: 'Admin Principal', action: 'deactivate_zone',
    targetType: 'Zona', targetName: 'Morro de Petatlán',
    description: 'Zona desactivada temporalmente por condiciones climáticas adversas.', createdAt: '06/07/2026 16:40',
  },
];

const PAGE_SIZE = 10;

export default function AuditScreen() {
  const [page, setPage] = useState(1);
  const totalPages = Math.ceil(AUDIT_LOGS.length / PAGE_SIZE);
  const paged = AUDIT_LOGS.slice(0, page * PAGE_SIZE);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
        <HeaderCard
          title="Logs de auditoría"
          subtitle={`${AUDIT_LOGS.length} acciones registradas.`}
          icon="history"
          color={COLORS.purple}
        />

        {paged.map((log) => {
          const cfg = ACTION_CONFIG[log.action] ?? { color: COLORS.ocean, icon: 'info' as const };
          return (
            <CardBox key={log.id}>
              <View className="flex-row items-start gap-3">
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    backgroundColor: `${cfg.color}20`,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <MaterialIcons name={cfg.icon} size={20} color={cfg.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <View className="flex-row items-center flex-wrap gap-2 mb-1">
                    <Text style={{ fontWeight: '800', color: '#0F172A', fontSize: 13 }}>
                      {log.adminName}
                    </Text>
                    <View
                      style={{
                        backgroundColor: `${cfg.color}15`,
                        borderRadius: 999,
                        paddingHorizontal: 8,
                        paddingVertical: 3,
                      }}
                    >
                      <Text style={{ color: cfg.color, fontSize: 10, fontWeight: '800' }}>
                        {log.action.replace(/_/g, ' ').toUpperCase()}
                      </Text>
                    </View>
                  </View>
                  <Text style={{ color: '#0F172A', fontWeight: '700', fontSize: 13 }}>
                    {log.targetType}: {log.targetName}
                  </Text>
                  <Text style={{ color: '#0F172A99', fontSize: 12, lineHeight: 17, marginTop: 3 }}>
                    {log.description}
                  </Text>
                  <Text style={{ color: '#94A3B8', fontSize: 11, marginTop: 4 }}>
                    {log.createdAt}
                  </Text>
                </View>
              </View>
            </CardBox>
          );
        })}

        {page < totalPages && (
          <TouchableOpacity
            onPress={() => setPage((p) => p + 1)}
            style={{
              alignItems: 'center',
              paddingVertical: 12,
              borderRadius: 14,
              borderWidth: 1,
              borderColor: '#E2E8F0',
              backgroundColor: '#fff',
              marginBottom: 8,
            }}
          >
            <Text style={{ color: COLORS.ocean, fontWeight: '800' }}>
              Cargar más ({AUDIT_LOGS.length - paged.length} restantes)
            </Text>
          </TouchableOpacity>
        )}

        <InfoBox text="El log de auditoría registra todas las acciones administrativas. Cada entrada incluye el admin responsable, la acción, la entidad afectada y el timestamp." />
      </ScrollView>
    </SafeAreaView>
  );
}

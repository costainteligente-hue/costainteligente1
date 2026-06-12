import React from 'react';
import { ScrollView, View, Text, TouchableOpacity, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { COLORS } from '@/lib/constants';
import { CardBox } from '@/components/ui/CardBox';
import { HeaderCard } from '@/components/ui/HeaderCard';
import { InfoBox } from '@/components/ui/InfoBox';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';

// ─── Metric card ──────────────────────────────────────────────────────────────
function MetricCard({
  label, value, subtitle, icon, color, onPress,
}: {
  label: string; value: string; subtitle: string;
  icon: keyof typeof MaterialIcons.glyphMap; color: string; onPress?: () => void;
}) {
  const Inner = (
    <View>
      <View style={{ width: 42, height: 42, borderRadius: 99, backgroundColor: `${color}20`, alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
        <MaterialIcons name={icon} size={22} color={color} />
      </View>
      <Text style={{ fontSize: 28, fontWeight: '800', color: '#0F172A' }}>{value}</Text>
      <Text style={{ fontWeight: '800', color: '#0F172A', fontSize: 13, marginTop: 2 }}>{label}</Text>
      <Text style={{ color: '#0F172A99', fontSize: 11, marginTop: 1 }}>{subtitle}</Text>
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} style={{ flex: 1 }}>
        <CardBox style={{ flex: 1, margin: 0, marginBottom: 0 }}>{Inner}</CardBox>
      </TouchableOpacity>
    );
  }
  return <CardBox style={{ flex: 1, margin: 0, marginBottom: 0 }}>{Inner}</CardBox>;
}

// ─── Nav shortcut ─────────────────────────────────────────────────────────────
function NavCard({
  title, subtitle, icon, color, badge, onPress,
}: {
  title: string; subtitle: string; icon: keyof typeof MaterialIcons.glyphMap;
  color: string; badge?: number; onPress: () => void;
}) {
  return (
    <TouchableOpacity onPress={onPress}>
      <CardBox>
        <View className="flex-row items-center gap-3">
          <View style={{ width: 48, height: 48, borderRadius: 16, backgroundColor: `${color}20`, alignItems: 'center', justifyContent: 'center' }}>
            <MaterialIcons name={icon} size={24} color={color} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontWeight: '800', color: '#0F172A', fontSize: 15 }}>{title}</Text>
            <Text style={{ color: '#0F172A99', fontSize: 13 }}>{subtitle}</Text>
          </View>
          {badge !== undefined && badge > 0 && (
            <View style={{ backgroundColor: COLORS.danger, borderRadius: 99, minWidth: 22, height: 22, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 }}>
              <Text style={{ color: '#fff', fontSize: 11, fontWeight: '800' }}>{badge}</Text>
            </View>
          )}
          <MaterialIcons name="chevron-right" size={22} color="#94A3B8" />
        </View>
      </CardBox>
    </TouchableOpacity>
  );
}

export default function AdminDashboard() {
  const router = useRouter();
  const { clear } = useAuthStore();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    clear();
    router.replace('/auth/login');
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
        {/* Header with logout */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
          <View style={{ flex: 1 }}>
            <HeaderCard
              title="Panel de administración"
              subtitle="Métricas en tiempo real y gestión de la plataforma."
              icon="admin-panel-settings"
              color={COLORS.ocean}
            />
          </View>
        </View>

        {/* Logout button */}
        <TouchableOpacity
          onPress={handleLogout}
          style={{
            flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
            gap: 8, padding: 12, borderRadius: 14, borderWidth: 1,
            borderColor: COLORS.danger, marginBottom: 16,
          }}
        >
          <MaterialIcons name="logout" size={18} color={COLORS.danger} />
          <Text style={{ color: COLORS.danger, fontWeight: '800' }}>Cerrar sesión</Text>
        </TouchableOpacity>

        {/* Metrics row 1 */}
        <View className="flex-row gap-3 mb-3">
          <MetricCard label="Clientes" value="248" subtitle="Registrados" icon="people" color={COLORS.ocean} />
          <MetricCard label="Proveedores" value="32" subtitle="Total activos" icon="storefront" color={COLORS.success} />
        </View>
        <View className="flex-row gap-3 mb-3">
          <MetricCard label="Pendientes" value="7" subtitle="Por verificar" icon="hourglass-bottom" color={COLORS.warning}
            onPress={() => router.push('/(admin)/verification')} />
          <MetricCard label="Zonas activas" value="12" subtitle="En el mapa" icon="place" color={COLORS.info}
            onPress={() => router.push('/(admin)/zones')} />
        </View>

        {/* Payments summary */}
        <CardBox>
          <Text style={{ fontWeight: '800', color: '#0F172A', fontSize: 15, marginBottom: 10 }}>Pagos del mes</Text>
          <View className="flex-row items-center gap-3">
            <MaterialIcons name="account-balance-wallet" size={36} color={COLORS.success} />
            <View>
              <Text style={{ fontSize: 24, fontWeight: '800', color: '#0F172A' }}>$ 148,200 MXN</Text>
              <Text style={{ color: '#0F172A99', fontSize: 13 }}>Procesados · 94 reservaciones</Text>
            </View>
          </View>
        </CardBox>

        {/* Navigation cards */}
        <Text style={{ fontWeight: '800', color: '#0F172A', fontSize: 17, marginBottom: 10 }}>
          Gestión de la plataforma
        </Text>

        <NavCard title="Cola de verificación" subtitle="Revisar proveedores pendientes." icon="verified-user" color={COLORS.warning} badge={7}
          onPress={() => router.push('/(admin)/verification')} />
        <NavCard title="Zonas de pesca" subtitle="Crear, editar y desactivar zonas." icon="place" color={COLORS.info}
          onPress={() => router.push('/(admin)/zones')} />
        <NavCard title="Reportes y denuncias" subtitle="Revisar y resolver denuncias." icon="report" color={COLORS.danger} badge={3}
          onPress={() => router.push('/(admin)/reports')} />
        <NavCard title="Alertas y avisos" subtitle="Publicar notificaciones push masivas." icon="notifications-active" color={COLORS.ocean}
          onPress={() => router.push('/(admin)/alerts')} />
        <NavCard title="Logs de auditoría" subtitle="Historial de acciones administrativas." icon="history" color={COLORS.purple}
          onPress={() => router.push('/(admin)/audit')} />

        <InfoBox text="Las métricas se actualizan en tiempo real usando Supabase Realtime. Conecta el cliente de Supabase para ver datos reales." />
      </ScrollView>
    </SafeAreaView>
  );
}

import React from 'react';
import { ScrollView, View, Text, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { COLORS } from '@/lib/constants';
import { CardBox } from '@/components/ui/CardBox';
import { HeaderCard } from '@/components/ui/HeaderCard';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';

function useAdminStats() {
  return useQuery({
    queryKey: ['admin_stats'],
    queryFn: async () => {
      const [clients, providers, pendingProviders] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'client'),
        supabase.from('providers').select('id', { count: 'exact', head: true }).eq('status', 'approved'),
        supabase.from('providers').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      ]);
      return {
        clients: clients.count ?? 0,
        providers: providers.count ?? 0,
        pending: pendingProviders.count ?? 0,
      };
    },
  });
}

function NavCard({
  title, subtitle, icon, color, badge, onPress,
}: {
  title: string;
  subtitle: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  color: string;
  badge?: number;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity onPress={onPress}>
      <CardBox>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View
            style={{
              width: 48, height: 48, borderRadius: 16,
              backgroundColor: `${color}20`,
              alignItems: 'center', justifyContent: 'center',
            }}
          >
            <MaterialIcons name={icon} size={24} color={color} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontWeight: '800', color: '#0F172A', fontSize: 15 }}>{title}</Text>
            <Text style={{ color: '#64748B', fontSize: 13 }}>{subtitle}</Text>
          </View>
          {badge !== undefined && badge > 0 && (
            <View
              style={{
                backgroundColor: COLORS.danger, borderRadius: 99,
                minWidth: 22, height: 22,
                alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6,
              }}
            >
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
  const { data: stats, isLoading } = useAdminStats();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    // clear() sets role=null, isLoading=false which triggers index.tsx → /auth/login
    clear();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
        <HeaderCard
          title="Panel de administración"
          subtitle="Gestión de la plataforma Costa Inteligente."
          icon="admin-panel-settings"
          color={COLORS.ocean}
        />

        {/* Metrics */}
        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
          <CardBox style={{ flex: 1, marginBottom: 0 }}>
            <View style={{ alignItems: 'center' }}>
              <MaterialIcons name="people" size={28} color={COLORS.ocean} />
              <Text style={{ fontSize: 26, fontWeight: '800', color: '#0F172A', marginTop: 4 }}>
                {isLoading ? '—' : stats?.clients ?? 0}
              </Text>
              <Text style={{ fontWeight: '700', color: '#0F172A', fontSize: 13 }}>Clientes</Text>
            </View>
          </CardBox>
          <CardBox style={{ flex: 1, marginBottom: 0 }}>
            <View style={{ alignItems: 'center' }}>
              <MaterialIcons name="storefront" size={28} color={COLORS.success} />
              <Text style={{ fontSize: 26, fontWeight: '800', color: '#0F172A', marginTop: 4 }}>
                {isLoading ? '—' : stats?.providers ?? 0}
              </Text>
              <Text style={{ fontWeight: '700', color: '#0F172A', fontSize: 13 }}>Proveedores</Text>
            </View>
          </CardBox>
          <TouchableOpacity
            onPress={() => router.push('/(admin)/verification')}
            style={{ flex: 1 }}
          >
            <CardBox style={{ marginBottom: 0 }}>
              <View style={{ alignItems: 'center' }}>
                <MaterialIcons name="hourglass-bottom" size={28} color={COLORS.warning} />
                <Text style={{ fontSize: 26, fontWeight: '800', color: '#0F172A', marginTop: 4 }}>
                  {isLoading ? '—' : stats?.pending ?? 0}
                </Text>
                <Text style={{ fontWeight: '700', color: '#0F172A', fontSize: 13 }}>Pendientes</Text>
              </View>
            </CardBox>
          </TouchableOpacity>
        </View>

        {/* Navigation */}
        <Text style={{ fontWeight: '800', color: '#0F172A', fontSize: 17, marginBottom: 10 }}>
          Gestión de la plataforma
        </Text>

        <NavCard
          title="Cola de verificación"
          subtitle="Revisar proveedores pendientes de aprobación."
          icon="verified-user"
          color={COLORS.warning}
          badge={stats?.pending}
          onPress={() => router.push('/(admin)/verification')}
        />
        <NavCard
          title="Zonas de pesca"
          subtitle="Crear, editar y desactivar zonas."
          icon="place"
          color={COLORS.info}
          onPress={() => router.push('/(admin)/zones')}
        />
        <NavCard
          title="Reportes y denuncias"
          subtitle="Revisar y resolver denuncias."
          icon="report"
          color={COLORS.danger}
          onPress={() => router.push('/(admin)/reports')}
        />
        <NavCard
          title="Alertas y avisos"
          subtitle="Publicar notificaciones push masivas."
          icon="notifications-active"
          color={COLORS.ocean}
          onPress={() => router.push('/(admin)/alerts')}
        />
        <NavCard
          title="Logs de auditoría"
          subtitle="Historial de acciones administrativas."
          icon="history"
          color={COLORS.purple}
          onPress={() => router.push('/(admin)/audit')}
        />

        {/* Logout */}
        <TouchableOpacity
          onPress={handleLogout}
          style={{
            flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
            gap: 8, padding: 14, borderRadius: 14, borderWidth: 1,
            borderColor: COLORS.danger, marginTop: 8,
          }}
        >
          <MaterialIcons name="logout" size={18} color={COLORS.danger} />
          <Text style={{ color: COLORS.danger, fontWeight: '800' }}>Cerrar sesión</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

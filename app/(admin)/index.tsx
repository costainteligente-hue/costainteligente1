/**
 * Admin Dashboard — Costa Inteligente
 * Layout tipo sidebar: menú lateral + panel principal con stats, gráfica y prioridades
 */
import React, { useRef, useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, Dimensions,
  Platform, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { COLORS } from '@/lib/constants';
import { signOut } from '@/lib/services/auth.service';
import { useAuthStore } from '@/stores/authStore';

const { width: SCREEN_W } = Dimensions.get('window');
const SIDEBAR_W = 220;
const IS_WIDE = SCREEN_W >= 768; // tablet / web

// ─── Stats mock (reemplazar con useQuery real) ────────────────────────────────
function useAdminStats() {
  return useQuery({
    queryKey: ['admin_stats'],
    queryFn: async () => {
      try {
        const res = await fetch('/api/admin/stats');
        if (!res.ok) throw new Error();
        return res.json();
      } catch {
        return {
          clients: 5, providers: 5, pendingVerification: 4,
          boats: 3, urgentReports: 1, activeZones: 8,
          reservations: 24, suspended: 0, pendingPhotos: 4, activeServices: 12,
          verificationByStatus: [
            { label: 'Urgente', value: 1 },
            { label: 'Pendiente', value: 6 },
            { label: 'En revisión', value: 5 },
            { label: 'Corrección', value: 3 },
            { label: 'Aprobado', value: 2 },
          ],
          priorities: [
            { id: 'p1', title: 'Problema con reserva', subtitle: 'Reporte · Pesca Deportiva Ixtapa · Prioridad Alta', responsible: 'José Rivera', status: 'urgent' },
            { id: 'p2', title: 'Lanchas Mar Azul', subtitle: 'Proveedor · Pescador de lancha · Muelle Principal, Zihuatanejo', responsible: 'Ernesto Salgado', status: 'pending' },
            { id: 'p3', title: 'Fotos sin revisar', subtitle: 'Restaurante La Gaviota · 4 fotos esperando aprobación', responsible: 'Sistema', status: 'review' },
          ],
        };
      }
    },
    staleTime: 1000 * 60 * 2,
  });
}

// ─── Menú sidebar ─────────────────────────────────────────────────────────────
const MENU_SECTIONS = [
  {
    label: 'GENERAL',
    items: [
      { key: 'index',        label: 'Panel principal',      icon: 'dashboard' as const,          route: '/(admin)' },
      { key: 'verification', label: 'Cola de verificación', icon: 'verified-user' as const,      route: '/(admin)/verification', badge: 'pendingVerification' },
    ],
  },
  {
    label: 'PERSONAS',
    items: [
      { key: 'users',     label: 'Usuarios',    icon: 'people' as const,    route: '/(admin)/users' },
      { key: 'providers', label: 'Proveedores', icon: 'storefront' as const, route: '/(admin)/verification', badge: 'providers' },
    ],
  },
  {
    label: 'OPERACIÓN',
    items: [
      { key: 'boats',   label: 'Lanchas y embarcaciones', icon: 'directions-boat' as const, route: '/(admin)/verification', badge: 'boats' },
      { key: 'photos',  label: 'Fotos y documentos',      icon: 'photo-library' as const,   route: '/(admin)/verification', badge: 'pendingPhotos' },
      { key: 'reservas',label: 'Reservas',                icon: 'event-available' as const, route: '/(admin)/verification' },
    ],
  },
  {
    label: 'MAPA Y CONTENIDO',
    items: [
      { key: 'zones',    label: 'Zonas de pesca',     icon: 'place' as const,              route: '/(admin)/zones',          badge: 'activeZones' },
      { key: 'coords',   label: 'Coordenadas GPS',     icon: 'gps-fixed' as const,          route: '/(admin)/fishing-coords' },
      { key: 'services', label: 'Servicios',           icon: 'category' as const,           route: '/(admin)/verification' },
      { key: 'reports',  label: 'Reportes',        icon: 'report' as const,             route: '/(admin)/reports', badge: 'urgentReports' },
      { key: 'alerts',   label: 'Alertas',          icon: 'notifications-active' as const, route: '/(admin)/alerts' },
      { key: 'audit',    label: 'Auditoría',        icon: 'history' as const,            route: '/(admin)/audit' },
    ],
  },
];

const STATUS_COLORS: Record<string, string> = {
  urgent:  COLORS.danger,
  pending: COLORS.warning,
  review:  COLORS.info,
};
const STATUS_LABELS: Record<string, string> = {
  urgent:  'Urgente',
  pending: 'Pendiente',
  review:  'En revisión',
};

// ─── Mini gráfica de barras (canvas-less, solo Views) ─────────────────────────
function BarChart({ data }: { data: { label: string; value: number }[] }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  const BAR_H = 90;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8, height: BAR_H + 32 }}>
      {data.map((d) => {
        const barH = Math.max(4, (d.value / max) * BAR_H);
        return (
          <View key={d.label} style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-end' }}>
            <Text style={{ fontSize: 11, fontWeight: '800', color: '#0F172A', marginBottom: 3 }}>
              {d.value}
            </Text>
            <View style={{ width: '80%', height: barH, backgroundColor: COLORS.aqua, borderRadius: 6 }} />
            <Text style={{ fontSize: 9, color: '#64748B', marginTop: 4, textAlign: 'center' }} numberOfLines={2}>
              {d.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

// ─── Stat card ────────────────────────────────────────────────────────────────
function StatCard({ icon, value, label, sub, color, onPress }: {
  icon: keyof typeof MaterialIcons.glyphMap;
  value: number | string;
  label: string;
  sub?: string;
  color: string;
  onPress?: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={onPress ? 0.75 : 1}
      style={{
        flex: 1, minWidth: 140,
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
      }}
    >
      <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: `${color}18`, alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
        <MaterialIcons name={icon} size={22} color={color} />
      </View>
      <Text style={{ fontSize: 28, fontWeight: '900', color: '#0F172A', lineHeight: 32 }}>{value}</Text>
      <Text style={{ fontWeight: '800', color: '#0F172A', fontSize: 13, marginTop: 2 }}>{label}</Text>
      {sub && <Text style={{ color: color, fontSize: 11, fontWeight: '700', marginTop: 3 }}>{sub}</Text>}
    </TouchableOpacity>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────
function Sidebar({ active, stats, onNav, onClose }: {
  active: string;
  stats: any;
  onNav: (route: string) => void;
  onClose?: () => void;
}) {
  return (
    <View style={{
      width: SIDEBAR_W, backgroundColor: '#fff',
      borderRightWidth: 1, borderRightColor: '#E2E8F0',
      paddingTop: 8, paddingBottom: 24,
    }}>
      {/* Header */}
      <View style={{ paddingHorizontal: 16, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <View style={{ width: 38, height: 38, borderRadius: 10, backgroundColor: `${COLORS.ocean}18`, alignItems: 'center', justifyContent: 'center' }}>
          <MaterialIcons name="admin-panel-settings" size={20} color={COLORS.ocean} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontWeight: '900', color: '#0F172A', fontSize: 14 }}>Costa Admin</Text>
          <Text style={{ color: '#64748B', fontSize: 11 }}>Zihuatanejo-Ixtapa</Text>
        </View>
        {onClose && (
          <TouchableOpacity onPress={onClose}>
            <MaterialIcons name="close" size={20} color="#94A3B8" />
          </TouchableOpacity>
        )}
      </View>

      <View style={{ height: 1, backgroundColor: '#E2E8F0', marginBottom: 8 }} />

      <ScrollView showsVerticalScrollIndicator={false}>
        {MENU_SECTIONS.map((section) => (
          <View key={section.label} style={{ marginBottom: 4 }}>
            <Text style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4, fontSize: 10, fontWeight: '800', color: '#94A3B8', letterSpacing: 0.8 }}>
              {section.label}
            </Text>
            {section.items.map((item) => {
              const isActive = active === item.key;
              const badgeVal = item.badge && stats ? stats[item.badge as keyof typeof stats] : undefined;
              return (
                <TouchableOpacity
                  key={item.key}
                  onPress={() => { onNav(item.route); onClose?.(); }}
                  style={{
                    flexDirection: 'row', alignItems: 'center', gap: 10,
                    paddingHorizontal: 12, paddingVertical: 9, marginHorizontal: 8, borderRadius: 10,
                    backgroundColor: isActive ? `${COLORS.ocean}12` : 'transparent',
                  }}
                >
                  <MaterialIcons name={item.icon} size={18} color={isActive ? COLORS.ocean : '#64748B'} />
                  <Text style={{ flex: 1, fontSize: 13, fontWeight: isActive ? '800' : '600', color: isActive ? COLORS.ocean : '#374151' }}>
                    {item.label}
                  </Text>
                  {typeof badgeVal === 'number' && badgeVal > 0 && (
                    <View style={{ backgroundColor: isActive ? COLORS.ocean : '#E2E8F0', borderRadius: 99, minWidth: 20, height: 20, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5 }}>
                      <Text style={{ fontSize: 10, fontWeight: '800', color: isActive ? '#fff' : '#64748B' }}>{badgeVal}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const router = useRouter();
  const { clear } = useAuthStore();
  const { data: stats, isLoading } = useAdminStats();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await signOut();
    clear();
    router.replace('/auth/login');
  };

  const nav = (route: string) => {
    setSidebarOpen(false);
    router.push(route as any);
  };

  const s = stats ?? {};

  const content = (
    <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
      {/* Page title */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <View>
          <Text style={{ fontSize: 26, fontWeight: '900', color: '#0F172A' }}>Panel principal</Text>
          <Text style={{ color: '#64748B', fontSize: 13, marginTop: 2 }}>Resumen operativo para decidir qué revisar primero.</Text>
        </View>
        <TouchableOpacity
          onPress={handleLogout}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: '#E2E8F0' }}
        >
          <MaterialIcons name="logout" size={16} color={COLORS.danger} />
          <Text style={{ color: COLORS.danger, fontWeight: '700', fontSize: 12 }}>Salir</Text>
        </TouchableOpacity>
      </View>

      {/* Stat cards row 1 */}
      <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
        <StatCard icon="people" value={isLoading ? '—' : s.clients ?? 0} label="Usuarios registrados" sub="Usuarios y proveedores con cuenta" color={COLORS.ocean} onPress={() => nav('/(admin)/users')} />
        <StatCard icon="storefront" value={isLoading ? '—' : s.providers ?? 0} label="Proveedores" sub={`${s.pendingVerification ?? 0} requieren revisión`} color={COLORS.success} onPress={() => nav('/(admin)/verification')} />
      </View>
      <View style={{ flexDirection: 'row', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <StatCard icon="directions-boat" value={isLoading ? '—' : s.boats ?? 0} label="Lanchas" sub={`${s.boats ?? 0} pendientes o en corrección`} color={COLORS.info} onPress={() => nav('/(admin)/verification')} />
        <StatCard icon="warning" value={isLoading ? '—' : s.urgentReports ?? 0} label="Reportes urgentes" sub="Prioridad alta para moderación" color={COLORS.danger} onPress={() => nav('/(admin)/reports')} />
      </View>

      {/* Fila 2 — stats secundarios */}
      <View style={{ flexDirection: 'row', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        {[
          { icon: 'place' as const,            label: 'Zonas activas',     val: s.activeZones ?? 0,      color: COLORS.info },
          { icon: 'event-available' as const,  label: 'Reservas',          val: s.reservations ?? 0,     color: COLORS.ocean },
          { icon: 'block' as const,            label: 'Suspendidos',       val: s.suspended ?? 0,        color: COLORS.danger },
          { icon: 'photo-library' as const,    label: 'Fotos pendientes',  val: s.pendingPhotos ?? 0,    color: COLORS.warning },
          { icon: 'category' as const,         label: 'Servicios activos', val: s.activeServices ?? 0,   color: COLORS.success },
        ].map((item) => (
          <View key={item.label} style={{
            flex: 1, minWidth: 90, backgroundColor: '#fff', borderRadius: 14,
            padding: 12, alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0',
            shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
          }}>
            <MaterialIcons name={item.icon} size={20} color={item.color} />
            <Text style={{ fontSize: 22, fontWeight: '900', color: '#0F172A', marginTop: 4 }}>{isLoading ? '—' : item.val}</Text>
            <Text style={{ fontSize: 10, fontWeight: '700', color: '#64748B', textAlign: 'center', marginTop: 2 }}>{item.label}</Text>
          </View>
        ))}
      </View>

      {/* Gráfica + Prioridades */}
      <View style={{ flexDirection: IS_WIDE ? 'row' : 'column', gap: 16, marginBottom: 20 }}>

        {/* Gráfica de barras */}
        <View style={{
          flex: IS_WIDE ? 1 : undefined,
          backgroundColor: '#fff', borderRadius: 16, padding: 18,
          borderWidth: 1, borderColor: '#E2E8F0',
          shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
        }}>
          <Text style={{ fontWeight: '800', color: '#0F172A', fontSize: 15, marginBottom: 4 }}>Actividad de verificación</Text>
          <Text style={{ color: '#64748B', fontSize: 12, marginBottom: 14 }}>Solicitudes por estado.</Text>
          <BarChart data={s.verificationByStatus ?? [
            { label: 'Urgente', value: 0 }, { label: 'Pendiente', value: 0 },
            { label: 'En revisión', value: 0 }, { label: 'Corrección', value: 0 },
            { label: 'Aprobado', value: 0 },
          ]} />
        </View>

        {/* Prioridades inmediatas */}
        <View style={{
          flex: IS_WIDE ? 1 : undefined,
          backgroundColor: '#fff', borderRadius: 16, padding: 18,
          borderWidth: 1, borderColor: '#E2E8F0',
          shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
        }}>
          <Text style={{ fontWeight: '800', color: '#0F172A', fontSize: 15, marginBottom: 4 }}>Prioridades inmediatas</Text>
          <Text style={{ color: '#64748B', fontSize: 12, marginBottom: 14 }}>Lo que el administrador debe revisar primero.</Text>
          {(s.priorities ?? []).map((p: any) => (
            <View key={p.id} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 14 }}>
              <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: `${STATUS_COLORS[p.status] ?? COLORS.ocean}15`, alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <MaterialIcons name={p.status === 'urgent' ? 'warning' : p.status === 'pending' ? 'hourglass-empty' : 'rate-review'} size={18} color={STATUS_COLORS[p.status] ?? COLORS.ocean} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: '800', color: '#0F172A', fontSize: 13 }}>{p.title}</Text>
                <Text style={{ color: '#64748B', fontSize: 11, marginTop: 1 }}>{p.subtitle}</Text>
                <Text style={{ color: '#94A3B8', fontSize: 11, marginTop: 1 }}>Responsable: {p.responsible}</Text>
              </View>
              <View style={{ alignItems: 'flex-end', gap: 6 }}>
                <View style={{ backgroundColor: `${STATUS_COLORS[p.status] ?? COLORS.ocean}18`, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 }}>
                  <Text style={{ color: STATUS_COLORS[p.status] ?? COLORS.ocean, fontSize: 10, fontWeight: '800' }}>{STATUS_LABELS[p.status] ?? p.status}</Text>
                </View>
                <TouchableOpacity
                  onPress={() => nav('/(admin)/verification')}
                  style={{ backgroundColor: '#F1F5F9', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 }}
                >
                  <Text style={{ color: '#374151', fontSize: 10, fontWeight: '700' }}>Abrir cola</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Accesos rápidos */}
      <Text style={{ fontWeight: '800', color: '#0F172A', fontSize: 15, marginBottom: 12 }}>Accesos rápidos</Text>
      <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap' }}>
        {[
          { label: 'Cola de verificación', icon: 'verified-user' as const, color: COLORS.warning, route: '/(admin)/verification' },
          { label: 'Zonas de pesca',      icon: 'place' as const,         color: COLORS.info,    route: '/(admin)/zones' },
          { label: 'Coordenadas GPS',     icon: 'gps-fixed' as const,     color: COLORS.success, route: '/(admin)/fishing-coords' },
          { label: 'Reportes',            icon: 'report' as const,         color: COLORS.danger,  route: '/(admin)/reports' },
          { label: 'Alertas',             icon: 'notifications-active' as const, color: COLORS.ocean, route: '/(admin)/alerts' },
          { label: 'Auditoría',           icon: 'history' as const,        color: COLORS.purple,  route: '/(admin)/audit' },
        ].map((item) => (
          <TouchableOpacity
            key={item.label}
            onPress={() => nav(item.route)}
            style={{
              flexDirection: 'row', alignItems: 'center', gap: 8,
              paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12,
              backgroundColor: '#fff', borderWidth: 1, borderColor: '#E2E8F0',
              shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3, elevation: 1,
            }}
          >
            <MaterialIcons name={item.icon} size={16} color={item.color} />
            <Text style={{ color: '#0F172A', fontWeight: '700', fontSize: 12 }}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );

  // ─── Layout wide (tablet/web): sidebar fijo ───────────────────────────────
  if (IS_WIDE) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }} edges={['top']}>
        <View style={{ flex: 1, flexDirection: 'row' }}>
          <Sidebar active="index" stats={s} onNav={nav} />
          <View style={{ flex: 1, backgroundColor: '#F8FAFC' }}>{content}</View>
        </View>
      </SafeAreaView>
    );
  }

  // ─── Layout mobile: sidebar deslizable ───────────────────────────────────
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }} edges={['top']}>
      {/* Mobile header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E2E8F0', gap: 12 }}>
        <TouchableOpacity onPress={() => setSidebarOpen(true)}>
          <MaterialIcons name="menu" size={24} color="#0F172A" />
        </TouchableOpacity>
        <View style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: `${COLORS.ocean}18`, alignItems: 'center', justifyContent: 'center' }}>
          <MaterialIcons name="admin-panel-settings" size={16} color={COLORS.ocean} />
        </View>
        <Text style={{ fontWeight: '900', color: '#0F172A', fontSize: 15, flex: 1 }}>Costa Admin</Text>
      </View>

      {/* Sidebar overlay */}
      {sidebarOpen && (
        <View style={{ position: 'absolute', inset: 0, zIndex: 100, flexDirection: 'row' } as any}>
          <Sidebar active="index" stats={s} onNav={nav} onClose={() => setSidebarOpen(false)} />
          <TouchableOpacity
            style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.35)' }}
            activeOpacity={1}
            onPress={() => setSidebarOpen(false)}
          />
        </View>
      )}

      <View style={{ flex: 1 }}>{content}</View>
    </SafeAreaView>
  );
}

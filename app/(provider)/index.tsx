/**
 * Provider Dashboard — Rediseño basado en Flutter reference
 * Drawer lateral + NavigationBar + Hero gradient + Metric grid + Charts
 */
import React, { useEffect, useState, useRef } from 'react';
import {
  ScrollView, View, Text, TouchableOpacity, Dimensions,
  Animated, DrawerLayoutAndroid, Platform, Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useProviderStore } from '@/stores/providerStore';
import { useAuthStore } from '@/stores/authStore';
import { SERVICE_DEFS, COLORS } from '@/lib/constants';
import { signOut } from '@/lib/services/auth.service';

const { width: SCREEN_W } = Dimensions.get('window');

// ─── Colores del sistema de diseño Flutter ────────────────────────────────────
const C = {
  navy:    '#0F172A',
  ocean:   '#0F766E',
  aqua:    '#14B8A6',
  bg:      '#F8FAFC',
  surface: '#FFFFFF',
  line:    '#E2E8F0',
  green:   '#16A34A',
  orange:  '#EA580C',
  blue:    '#2563EB',
  purple:  '#7C3AED',
  red:     '#DC2626',
  muted:   'rgba(15,23,42,0.6)',
};

// ─── Mini gráfica de barras ───────────────────────────────────────────────────
function BarChart({ data }: { data: { label: string; value: number; color: string }[] }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 10, height: 80 }}>
      {data.map((d) => {
        const h = Math.max(4, (d.value / max) * 72);
        return (
          <View key={d.label} style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-end' }}>
            <Text style={{ fontSize: 11, fontWeight: '800', color: C.navy, marginBottom: 4 }}>{d.value}</Text>
            <View style={{ width: '70%', height: h, backgroundColor: d.color, borderRadius: 6 }} />
            <Text style={{ fontSize: 9, color: C.muted, marginTop: 4, textAlign: 'center' }} numberOfLines={1}>{d.label}</Text>
          </View>
        );
      })}
    </View>
  );
}

// ─── Drawer content ───────────────────────────────────────────────────────────
function DrawerContent({ onNav, onClose, currentRoute }: {
  onNav: (route: string) => void;
  onClose: () => void;
  currentRoute: string;
}) {
  const { clear } = useAuthStore();
  const router = useRouter();

  const handleLogout = async () => {
    onClose();
    await signOut();
    clear();
    router.replace('/auth/login');
  };

  const section = (label: string) => (
    <Text style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 4, fontSize: 10, fontWeight: '800', color: 'rgba(255,255,255,0.55)', letterSpacing: 0.8 }}>
      {label}
    </Text>
  );

  const item = (icon: keyof typeof MaterialIcons.glyphMap, label: string, route: string) => {
    const active = currentRoute === route;
    return (
      <TouchableOpacity
        key={label}
        onPress={() => { onNav(route); onClose(); }}
        style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginHorizontal: 10, marginVertical: 2, paddingHorizontal: 12, paddingVertical: 11, borderRadius: 14, backgroundColor: active ? 'rgba(255,255,255,0.12)' : 'transparent' }}
      >
        <MaterialIcons name={icon} size={20} color={active ? '#fff' : 'rgba(255,255,255,0.7)'} />
        <Text style={{ flex: 1, fontWeight: active ? '800' : '600', color: active ? '#fff' : 'rgba(255,255,255,0.82)', fontSize: 14 }}>{label}</Text>
        {active && <MaterialIcons name="chevron-right" size={18} color="rgba(255,255,255,0.6)" />}
      </TouchableOpacity>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: C.navy }}>
      {/* Header */}
      <LinearGradient colors={[C.navy, C.ocean]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={{ padding: 24, paddingTop: 56 }}>
        <View style={{ width: 60, height: 60, borderRadius: 99, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
          <MaterialIcons name="business-center" size={32} color={C.ocean} />
        </View>
        <Text style={{ color: '#fff', fontSize: 20, fontWeight: '800', marginBottom: 2 }}>Costa Inteligente</Text>
        <Text style={{ color: 'rgba(255,255,255,0.75)', fontWeight: '700', fontSize: 13 }}>Panel comercial</Text>
      </LinearGradient>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        {section('GENERAL')}
        {item('dashboard', 'Panel principal', '/(provider)')}
        {item('tune', 'Configurar servicios', '/(provider)/services')}
        {item('verified-user', 'Verificación', '/(provider)/settings')}
        {section('MIS SERVICIOS')}
        {SERVICE_DEFS.map((s) => item(s.icon as any, s.name, `/(provider)/services`))}
        {section('OPERACIÓN')}
        {item('event-available', 'Reservaciones', '/(provider)/reservations')}
        {item('calendar-month', 'Calendario', '/(provider)/calendar')}
        {item('payments', 'Pagos', '/(provider)/payments')}
        {item('chat-bubble-outline', 'Mensajes', '/(provider)/chat/general')}
        {item('star-border', 'Reseñas', '/(provider)/reviews')}
        {item('local-offer', 'Promociones', '/(provider)/promotions')}
        {item('settings', 'Ajustes', '/(provider)/settings')}
        {item('support-agent', 'Soporte', '/(provider)/settings')}
      </ScrollView>

      {/* Logout */}
      <TouchableOpacity onPress={handleLogout}
        style={{ flexDirection: 'row', alignItems: 'center', gap: 10, margin: 16, padding: 14, borderRadius: 14, backgroundColor: 'rgba(220,38,38,0.15)', borderWidth: 1, borderColor: 'rgba(220,38,38,0.3)' }}>
        <MaterialIcons name="logout" size={18} color={C.red} />
        <Text style={{ color: C.red, fontWeight: '800' }}>Cerrar sesión</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Metric Card ──────────────────────────────────────────────────────────────
function MetricCard({ title, value, subtitle, icon, color }: {
  title: string; value: string; subtitle: string;
  icon: keyof typeof MaterialIcons.glyphMap; color: string;
}) {
  return (
    <View style={{ flex: 1, backgroundColor: C.surface, borderRadius: 18, borderWidth: 1, borderColor: C.line, padding: 14, gap: 6,
      shadowColor: C.navy, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 }}>
      <View style={{ width: 40, height: 40, borderRadius: 99, backgroundColor: `${color}20`, alignItems: 'center', justifyContent: 'center' }}>
        <MaterialIcons name={icon} size={20} color={color} />
      </View>
      <Text style={{ fontSize: 28, fontWeight: '900', color: C.navy, letterSpacing: -0.5 }}>{value}</Text>
      <Text style={{ fontWeight: '800', color: C.navy, fontSize: 13 }}>{title}</Text>
      <Text style={{ color: C.muted, fontSize: 11, lineHeight: 15 }}>{subtitle}</Text>
    </View>
  );
}

// ─── Operation Shortcut ───────────────────────────────────────────────────────
function OperationShortcut({ title, subtitle, icon, color, onPress }: {
  title: string; subtitle: string; icon: keyof typeof MaterialIcons.glyphMap; color: string; onPress: () => void;
}) {
  return (
    <TouchableOpacity onPress={onPress} style={{ flex: 1, backgroundColor: C.surface, borderRadius: 18, borderWidth: 1, borderColor: C.line, padding: 14, gap: 6,
      shadowColor: C.navy, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 }}>
      <View style={{ width: 40, height: 40, borderRadius: 99, backgroundColor: `${color}20`, alignItems: 'center', justifyContent: 'center' }}>
        <MaterialIcons name={icon} size={20} color={color} />
      </View>
      <Text style={{ fontWeight: '800', color: C.navy, fontSize: 13, marginTop: 4 }}>{title}</Text>
      <Text style={{ color: C.muted, fontSize: 11, lineHeight: 15 }} numberOfLines={2}>{subtitle}</Text>
    </TouchableOpacity>
  );
}

// ─── Service Summary Row ──────────────────────────────────────────────────────
function ServiceSummaryRow({ serviceId, count, onPress }: { serviceId: string; count: number; onPress: () => void }) {
  const def = SERVICE_DEFS.find((s) => s.id === serviceId);
  if (!def) return null;
  return (
    <TouchableOpacity onPress={onPress}>
      <View style={{ backgroundColor: C.surface, borderRadius: 16, borderWidth: 1, borderColor: C.line, padding: 14, marginBottom: 10, flexDirection: 'row', alignItems: 'center', gap: 12,
        shadowColor: C.navy, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 1 }}>
        <View style={{ width: 50, height: 50, borderRadius: 16, backgroundColor: `${def.color}18`, alignItems: 'center', justifyContent: 'center' }}>
          <MaterialIcons name={def.icon as any} size={26} color={def.color} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontWeight: '800', color: C.navy, fontSize: 14 }}>{def.name}</Text>
          <Text style={{ color: C.muted, fontSize: 12, marginTop: 2 }}>
            {count === 0 ? 'Sin registros activos' : `${count} registro${count > 1 ? 's' : ''} activo${count > 1 ? 's' : ''}`}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <View style={{ backgroundColor: count > 0 ? `${C.green}15` : `${C.muted}10`, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 }}>
            <Text style={{ fontSize: 11, fontWeight: '800', color: count > 0 ? C.green : C.muted }}>{count > 0 ? 'Activo' : 'Vacío'}</Text>
          </View>
          <MaterialIcons name="chevron-right" size={20} color="#CBD5E1" />
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function ProviderDashboard() {
  const router = useRouter();
  const { selectedServices, records } = useProviderStore();
  const { user } = useAuthStore();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [approvalStatus, setApprovalStatus] = useState<'checking' | 'approved' | 'pending'>('checking');

  useEffect(() => {
    if (!user?.id) return;
    const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? '';
    const check = async () => {
      try {
        if (typeof window !== 'undefined') {
          const res = await fetch(`${API_BASE}/api/auth/provider-status?userId=${user.id}`);
          const data = await res.json();
          setApprovalStatus(data.status === 'approved' ? 'approved' : 'pending');
        } else {
          const { getDb } = await import('@/lib/db/client');
          const { providers } = await import('@/lib/db/schema');
          const { eq } = await import('drizzle-orm');
          const rows = await getDb().select({ status: providers.status }).from(providers).where(eq(providers.userId, user.id!));
          setApprovalStatus(rows[0]?.status === 'approved' ? 'approved' : 'pending');
        }
      } catch { setApprovalStatus('pending'); }
    };
    check();
  }, [user?.id]);

  const isApproved    = approvalStatus === 'approved';
  const enabledDefs   = SERVICE_DEFS.filter((s) => selectedServices.has(s.id));
  const totalRecords  = Object.values(records).reduce((sum, list) => sum + list.length, 0);
  const firstName     = user?.fullName?.split(' ')[0] ?? 'Proveedor';

  const chartData = [
    { label: 'Servicios', value: selectedServices.size, color: C.ocean },
    { label: 'Registros', value: totalRecords, color: C.green },
    { label: 'Reservas',  value: 0,            color: C.blue  },
    { label: 'Mensajes',  value: 0,            color: C.purple },
  ];

  const content = (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={['top']}>
      {/* Top bar */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: C.surface, borderBottomWidth: 1, borderBottomColor: C.line, gap: 12 }}>
        <TouchableOpacity onPress={() => setDrawerOpen(true)} style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: `${C.ocean}12`, alignItems: 'center', justifyContent: 'center' }}>
          <MaterialIcons name="menu" size={22} color={C.ocean} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 15, fontWeight: '900', color: C.navy, letterSpacing: -0.3 }}>Panel comercial</Text>
          <Text style={{ fontSize: 11, color: C.muted }}>Costa Inteligente · Proveedor</Text>
        </View>
        <TouchableOpacity onPress={() => router.push('/(provider)/chat/general' as any)}
          style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: `${C.ocean}12`, alignItems: 'center', justifyContent: 'center' }}>
          <MaterialIcons name="chat-bubble-outline" size={20} color={C.ocean} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push('/(provider)/settings')}
          style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: `${C.ocean}12`, alignItems: 'center', justifyContent: 'center' }}>
          <MaterialIcons name="notifications-none" size={20} color={C.ocean} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }} showsVerticalScrollIndicator={false}>

        {/* Hero */}
        <LinearGradient colors={[C.navy, C.ocean]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={{ borderRadius: 24, padding: 22, marginBottom: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <View style={{ width: 48, height: 48, borderRadius: 99, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' }}>
              <MaterialIcons name="business-center" size={26} color="#fff" />
            </View>
            <View>
              <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: 12, fontWeight: '600' }}>Bienvenido,</Text>
              <Text style={{ color: '#fff', fontSize: 18, fontWeight: '900', letterSpacing: -0.3 }}>{firstName} 👋</Text>
            </View>
          </View>
          <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 14, lineHeight: 22, marginBottom: 14 }}>
            Administra servicios, reservaciones, pagos y comunicación desde un solo lugar.
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {['Servicios verificados', 'Operación diaria', 'Control comercial'].map((tag) => (
              <View key={tag} style={{ backgroundColor: 'rgba(255,255,255,0.10)', borderRadius: 999, borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)', paddingHorizontal: 10, paddingVertical: 5 }}>
                <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700' }}>{tag}</Text>
              </View>
            ))}
          </View>
        </LinearGradient>

        {/* Banner pending */}
        {!isApproved && approvalStatus !== 'checking' && (
          <View style={{ backgroundColor: `${COLORS.warning}12`, borderRadius: 16, borderWidth: 1, borderColor: `${COLORS.warning}35`, padding: 14, marginBottom: 16, flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
            <MaterialIcons name="hourglass-bottom" size={20} color={COLORS.warning} style={{ marginTop: 1 }} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: '800', color: C.navy, fontSize: 13, marginBottom: 3 }}>Cuenta pendiente de aprobación</Text>
              <Text style={{ color: C.muted, fontSize: 12, lineHeight: 18 }}>Puedes explorar el panel, pero no podrás publicar servicios hasta que el admin te apruebe.</Text>
            </View>
          </View>
        )}

        {/* Metrics 2x2 */}
        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
          <MetricCard title="Servicios" value={`${selectedServices.size}`} subtitle="Seleccionados" icon="storefront" color={C.ocean} />
          <MetricCard title="Registros" value={`${totalRecords}`} subtitle="Activos" icon="verified" color={C.green} />
        </View>
        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
          <MetricCard title="Reservas" value="—" subtitle="Próximamente" icon="event-available" color={C.blue} />
          <MetricCard title="Pagos" value="—" subtitle="Próximamente" icon="payments" color={C.orange} />
        </View>

        {/* Chart */}
        <View style={{ backgroundColor: C.surface, borderRadius: 18, borderWidth: 1, borderColor: C.line, padding: 18, marginBottom: 16,
          shadowColor: C.navy, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 }}>
          <Text style={{ fontWeight: '800', color: C.navy, fontSize: 15, marginBottom: 4 }}>Actividad comercial</Text>
          <Text style={{ color: C.muted, fontSize: 12, marginBottom: 16 }}>Resumen de tu operación actual</Text>
          <BarChart data={chartData} />
        </View>

        {/* Services section */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <View>
            <Text style={{ fontWeight: '800', color: C.navy, fontSize: 16 }}>Servicios activos</Text>
            <Text style={{ color: C.muted, fontSize: 12 }}>{enabledDefs.length} módulos habilitados</Text>
          </View>
          <TouchableOpacity onPress={() => router.push('/(provider)/services')}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: `${C.ocean}12`, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 7 }}>
            <MaterialIcons name="tune" size={15} color={C.ocean} />
            <Text style={{ color: C.ocean, fontWeight: '800', fontSize: 12 }}>Configurar</Text>
          </TouchableOpacity>
        </View>

        {enabledDefs.length === 0 ? (
          <TouchableOpacity onPress={() => router.push('/(provider)/services')}
            style={{ backgroundColor: `${C.ocean}08`, borderRadius: 16, borderWidth: 1.5, borderColor: `${C.ocean}25`, borderStyle: 'dashed', padding: 24, alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <MaterialIcons name="add-business" size={32} color={C.ocean} />
            <Text style={{ fontWeight: '800', color: C.ocean, fontSize: 14 }}>Activar servicios</Text>
            <Text style={{ color: C.muted, fontSize: 12, textAlign: 'center' }}>Toca para seleccionar los servicios que ofreces</Text>
          </TouchableOpacity>
        ) : (
          enabledDefs.map((def) => (
            <ServiceSummaryRow key={def.id} serviceId={def.id} count={records[def.id]?.length ?? 0}
              onPress={() => router.push('/(provider)/services')} />
          ))
        )}

        {/* Operations */}
        <Text style={{ fontWeight: '800', color: C.navy, fontSize: 16, marginBottom: 4 }}>Centro de operación</Text>
        <Text style={{ color: C.muted, fontSize: 12, marginBottom: 12 }}>Herramientas de administración diaria</Text>
        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
          <OperationShortcut title="Reservaciones" subtitle="Solicitudes, cupos y confirmaciones." icon="event-available" color={C.green} onPress={() => router.push('/(provider)/reservations')} />
          <OperationShortcut title="Calendario" subtitle="Disponibilidad y bloqueos." icon="calendar-month" color={C.blue} onPress={() => router.push('/(provider)/calendar')} />
        </View>
        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
          <OperationShortcut title="Pagos" subtitle="Cobros e historial." icon="payments" color={C.orange} onPress={() => router.push('/(provider)/payments')} />
          <OperationShortcut title="Mensajes" subtitle="Comunicación con clientes." icon="chat-bubble-outline" color={C.ocean} onPress={() => router.push('/(provider)/chat/general' as any)} />
        </View>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <OperationShortcut title="Reseñas" subtitle="Opiniones de clientes." icon="star-border" color={C.purple} onPress={() => router.push('/(provider)/reviews')} />
          <OperationShortcut title="Promociones" subtitle="Descuentos y ofertas." icon="local-offer" color={C.green} onPress={() => router.push('/(provider)/promotions')} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );

  // Drawer overlay
  return (
    <>
      {content}
      {/* Drawer overlay */}
      <Modal visible={drawerOpen} transparent animationType="none" onRequestClose={() => setDrawerOpen(false)}>
        <View style={{ flex: 1, flexDirection: 'row' }}>
          <View style={{ width: Math.min(SCREEN_W * 0.82, 300) }}>
            <DrawerContent onNav={(r) => router.push(r as any)} onClose={() => setDrawerOpen(false)} currentRoute="/(provider)" />
          </View>
          <TouchableOpacity style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' }} activeOpacity={1} onPress={() => setDrawerOpen(false)} />
        </View>
      </Modal>
    </>
  );
}

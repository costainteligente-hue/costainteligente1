/**
 * Provider Dashboard — fiel al PWA costa-inteligente-proveedor-pwa
 * Hero gradient + Metric grid + Charts + Services list + Operation grid
 */
import React, { useEffect, useState } from 'react';
import {
  ScrollView, View, Text, TouchableOpacity,
  Dimensions, Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useProviderStore } from '@/stores/providerStore';
import { useAuthStore } from '@/stores/authStore';
import { SERVICE_DEFS, COLORS, serviceSupportsOptions } from '@/lib/constants';
import { signOut } from '@/lib/services/auth.service';
import { MetricCard } from '@/components/ui/MetricCard';
import { OperationCard } from '@/components/ui/OperationCard';
import { ChartBar } from '@/components/ui/ChartBar';
import { CardBox } from '@/components/ui/CardBox';
import { SectionHeader } from '@/components/ui/SectionHeader';

const { width: SCREEN_W } = Dimensions.get('window');

// ─── Drawer ───────────────────────────────────────────────────────────────────
function DrawerContent({ onNav, onClose }: { onNav: (r: string) => void; onClose: () => void }) {
  const { clear } = useAuthStore();
  const router = useRouter();
  const { selectedServices } = useProviderStore();

  const logout = async () => { onClose(); await signOut(); clear(); router.replace('/auth/login'); };

  const section = (label: string) => (
    <Text style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 4, fontSize: 10, fontWeight: '800', color: 'rgba(255,255,255,0.55)', letterSpacing: 0.8 }}>{label}</Text>
  );

  const item = (icon: keyof typeof MaterialIcons.glyphMap, label: string, route: string) => (
    <TouchableOpacity key={label} onPress={() => { onNav(route); onClose(); }}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginHorizontal: 10, marginVertical: 2, paddingHorizontal: 12, paddingVertical: 11, borderRadius: 16 }}>
      <View style={{ width: 34, height: 34, alignItems: 'center', justifyContent: 'center' }}>
        <MaterialIcons name={icon} size={20} color="rgba(255,255,255,0.78)" />
      </View>
      <Text style={{ flex: 1, fontWeight: '750', color: 'rgba(255,255,255,0.82)', fontSize: 14 }}>{label}</Text>
    </TouchableOpacity>
  );

  const enabledDefs = SERVICE_DEFS.filter((s) => selectedServices.has(s.id));

  return (
    <View style={{ flex: 1, backgroundColor: '#0F172A' }}>
      <LinearGradient colors={['#0F172A', '#0F766E']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={{ padding: 24, paddingTop: 56 }}>
        <View style={{ width: 60, height: 60, borderRadius: 99, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
          <MaterialIcons name="business-center" size={30} color="#0F766E" />
        </View>
        <Text style={{ color: '#fff', fontSize: 20, fontWeight: '800', marginBottom: 2 }}>Costa Inteligente</Text>
        <Text style={{ color: 'rgba(255,255,255,0.75)', fontWeight: '700', fontSize: 13 }}>Panel comercial</Text>
      </LinearGradient>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        {section('GENERAL')}
        {item('dashboard', 'Panel principal', '/(provider)')}
        {item('tune', 'Configurar servicios', '/(provider)/services')}
        {item('verified-user', 'Verificación', '/(provider)/verification')}
        {section('MIS SERVICIOS ACEPTADOS')}
        {enabledDefs.map((s) => item(s.icon as any, s.name, '/(provider)/services'))}
        {section('OPERACIÓN')}
        {item('event-available', 'Reservaciones', '/(provider)/reservations')}
        {item('calendar-month', 'Calendario', '/(provider)/calendar')}
        {item('payments', 'Pagos', '/(provider)/payments')}
        {item('chat-bubble-outline', 'Chat interno', '/(provider)/chat/general')}
        {item('star', 'Reseñas', '/(provider)/reviews')}
        {item('local-offer', 'Promociones', '/(provider)/promotions')}
        {item('settings', 'Ajustes', '/(provider)/settings')}
        {item('support-agent', 'Soporte', '/(provider)/settings')}
      </ScrollView>

      <TouchableOpacity onPress={logout}
        style={{ flexDirection: 'row', alignItems: 'center', gap: 10, margin: 16, padding: 14, borderRadius: 14, backgroundColor: 'rgba(220,38,38,0.15)', borderWidth: 1, borderColor: 'rgba(220,38,38,0.3)' }}>
        <MaterialIcons name="logout" size={18} color="#DC2626" />
        <Text style={{ color: '#DC2626', fontWeight: '800' }}>Cerrar sesión</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Mini stat row (dashboard indicators) ────────────────────────────────────
function MiniStat({ icon, label, value, color }: { icon: keyof typeof MaterialIcons.glyphMap; label: string; value: number | string; color: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 }}>
      <View style={{ width: 38, height: 38, borderRadius: 999, backgroundColor: `${color}20`, alignItems: 'center', justifyContent: 'center' }}>
        <MaterialIcons name={icon} size={18} color={color} />
      </View>
      <Text style={{ flex: 1, fontWeight: '800', color: '#0F172A', fontSize: 14 }}>{label}</Text>
      <Text style={{ fontWeight: '900', color: '#0F172A', fontSize: 18 }}>{value}</Text>
    </View>
  );
}

// ─── Service summary row ──────────────────────────────────────────────────────
function ServiceSummaryRow({ serviceId, count, onPress }: { serviceId: string; count: number; onPress: () => void }) {
  const def = SERVICE_DEFS.find((s) => s.id === serviceId);
  if (!def) return null;
  return (
    <CardBox style={{ marginBottom: 10 }}>
      <TouchableOpacity onPress={onPress} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View style={{ width: 58, height: 58, borderRadius: 18, backgroundColor: `${def.color}20`, alignItems: 'center', justifyContent: 'center' }}>
          <MaterialIcons name={def.icon as any} size={28} color={def.color} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontWeight: '900', color: '#0F172A', fontSize: 15 }}>{def.name}</Text>
          <Text style={{ color: 'rgba(15,23,42,0.62)', fontSize: 13, marginTop: 2 }}>
            {count === 0 ? 'Sin registros' : `${count} registro aceptado activo`}
          </Text>
        </View>
        <MaterialIcons name="chevron-right" size={20} color="#CBD5E1" />
      </TouchableOpacity>
    </CardBox>
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
    (async () => {
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
    })();
  }, [user?.id]);

  const allRecords  = Object.values(records).flat();
  const totalRecs   = allRecords.length;
  const available   = allRecords.filter((r) => r.isAvailable).length;
  const unavailable = totalRecs - available;
  const totalOpts   = allRecords.reduce((s, r) => s + (serviceSupportsOptions(r.serviceId) ? r.routeOptions.length : 0), 0);
  const totalCat    = allRecords.reduce((s, r) => s + r.catalog.length, 0);
  const totalPhotos = allRecords.reduce((s, r) => s + r.gallery.length, 0);
  const enabledDefs = SERVICE_DEFS.filter((s) => selectedServices.has(s.id));

  const chartData = enabledDefs.map((s) => ({
    label: s.name,
    value: records[s.id]?.length ?? 0,
    color: s.color,
  }));

  return (
    <>
      <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }} edges={['top']}>
        {/* App bar */}
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E2E8F0', gap: 8 }}>
          <TouchableOpacity onPress={() => setDrawerOpen(true)} style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: `${COLORS.ocean}12`, alignItems: 'center', justifyContent: 'center' }}>
            <MaterialIcons name="menu" size={22} color={COLORS.ocean} />
          </TouchableOpacity>
          <Text style={{ flex: 1, fontSize: 19, fontWeight: '850', color: '#0F172A', letterSpacing: -0.3 }}>Panel del proveedor</Text>
          <TouchableOpacity onPress={() => router.push('/(provider)/chat/general' as any)}
            style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: `${COLORS.ocean}12`, alignItems: 'center', justifyContent: 'center' }}>
            <MaterialIcons name="chat-bubble-outline" size={20} color={COLORS.ocean} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>

          {/* Hero panel */}
          <LinearGradient colors={['#0F172A', '#0F766E']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={{ borderRadius: 24, padding: 24, marginBottom: 16, overflow: 'hidden' }}>
            {/* decorative circle */}
            <View style={{ position: 'absolute', top: -42, right: -48, width: 160, height: 160, borderRadius: 80, borderWidth: 24, borderColor: 'rgba(255,255,255,0.10)' }} />
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <View style={{ backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5, flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                <MaterialIcons name="storefront" size={13} color="#fff" />
                <Text style={{ color: '#fff', fontSize: 12, fontWeight: '800' }}>Panel profesional</Text>
              </View>
            </View>
            <Text style={{ color: '#fff', fontSize: 28, fontWeight: '900', marginTop: 18, marginBottom: 8, lineHeight: 32 }}>Panel comercial</Text>
            <Text style={{ color: 'rgba(255,255,255,0.84)', fontSize: 14.5, lineHeight: 21, fontWeight: '550' }}>
              Administra servicios, horarios, precios, catálogos, reservaciones, pagos y comunicación desde una experiencia clara y centralizada.
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 18 }}>
              {['Servicios verificados', 'Operación diaria', 'Control comercial'].map((tag) => (
                <View key={tag} style={{ backgroundColor: 'rgba(255,255,255,0.10)', borderRadius: 999, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', paddingHorizontal: 10, paddingVertical: 5 }}>
                  <Text style={{ color: '#fff', fontSize: 11, fontWeight: '800' }}>{tag}</Text>
                </View>
              ))}
            </View>
          </LinearGradient>

          {/* Pending banner */}
          {approvalStatus === 'pending' && (
            <View style={{ backgroundColor: `${COLORS.warning}12`, borderRadius: 16, borderWidth: 1, borderColor: `${COLORS.warning}35`, padding: 14, marginBottom: 16, flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
              <MaterialIcons name="hourglass-bottom" size={20} color={COLORS.warning} style={{ marginTop: 1 }} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: '800', color: '#0F172A', fontSize: 13, marginBottom: 3 }}>Cuenta pendiente de aprobación</Text>
                <Text style={{ color: 'rgba(15,23,42,0.62)', fontSize: 12, lineHeight: 18 }}>Puedes explorar el panel, pero no podrás publicar servicios hasta que el admin te apruebe.</Text>
              </View>
            </View>
          )}

          {/* Metric grid 2×2 */}
          <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
            <MetricCard title="Servicios" value={selectedServices.size} subtitle="Seleccionados" icon="storefront" color={COLORS.ocean} />
            <MetricCard title="Aceptados" value={totalRecs} subtitle="Registros activos" icon="verified" color={COLORS.success} />
          </View>
          <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
            <MetricCard title="Reservas" value="3" subtitle="Actividad actual" icon="event-available" color={COLORS.info} />
            <MetricCard title="Pagos" value="3" subtitle="Movimientos" icon="payments" color={COLORS.warning} />
          </View>

          {/* Charts 2-col */}
          <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
            <CardBox style={{ flex: 1, marginBottom: 0 }}>
              <Text style={{ fontWeight: '900', color: '#0F172A', fontSize: 16, marginBottom: 4 }}>Actividad por servicio</Text>
              <Text style={{ color: 'rgba(15,23,42,0.62)', fontSize: 12, marginBottom: 14 }}>Vista rápida de registros administrados.</Text>
              <ChartBar data={chartData} />
            </CardBox>
            <CardBox style={{ flex: 1, marginBottom: 0 }}>
              <Text style={{ fontWeight: '900', color: '#0F172A', fontSize: 16, marginBottom: 4 }}>Indicadores</Text>
              <Text style={{ color: 'rgba(15,23,42,0.62)', fontSize: 12, marginBottom: 14 }}>Disponibilidad y opciones.</Text>
              <MiniStat icon="check-circle" label="Disponibles" value={available} color={COLORS.success} />
              <MiniStat icon="block" label="No disponibles" value={unavailable} color={COLORS.danger} />
              <MiniStat icon="route" label="Rutas / paquetes" value={totalOpts} color={COLORS.info} />
              <MiniStat icon="menu-book" label="Productos / menú" value={totalCat} color={COLORS.purple} />
              <MiniStat icon="photo-library" label="Fotos publicadas" value={totalPhotos} color={COLORS.ocean} />
            </CardBox>
          </View>

          {/* Services */}
          <SectionHeader title="Servicios para administrar" subtitle="Cada servicio cuenta con registros aceptados." actionLabel="Configurar" actionIcon="tune" onAction={() => router.push('/(provider)/services')} />
          <View style={{ height: 8 }} />
          {enabledDefs.length === 0 ? (
            <TouchableOpacity onPress={() => router.push('/(provider)/services')}
              style={{ backgroundColor: `${COLORS.ocean}08`, borderRadius: 16, borderWidth: 1.5, borderColor: `${COLORS.ocean}25`, borderStyle: 'dashed', padding: 24, alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <MaterialIcons name="add-business" size={32} color={COLORS.ocean} />
              <Text style={{ fontWeight: '800', color: COLORS.ocean, fontSize: 14 }}>Activar servicios</Text>
            </TouchableOpacity>
          ) : (
            enabledDefs.map((def) => (
              <ServiceSummaryRow key={def.id} serviceId={def.id} count={records[def.id]?.length ?? 0} onPress={() => router.push('/(provider)/services')} />
            ))
          )}

          {/* Operation center */}
          <View style={{ marginTop: 16 }}>
            <Text style={{ fontWeight: '900', color: '#0F172A', fontSize: 18, marginBottom: 4 }}>Centro de operación</Text>
            <Text style={{ color: 'rgba(15,23,42,0.62)', fontSize: 13, marginBottom: 12 }}>Herramientas preparadas para administrar actividad diaria.</Text>
            <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
              <OperationCard title="Reservaciones" subtitle="Solicitudes, cupos y confirmaciones." icon="event-available" color={COLORS.success} onPress={() => router.push('/(provider)/reservations')} />
              <OperationCard title="Calendario" subtitle="Disponibilidad, bloqueos y temporadas." icon="calendar-month" color={COLORS.info} onPress={() => router.push('/(provider)/calendar')} />
            </View>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <OperationCard title="Pagos" subtitle="Cobros, comprobantes e historial." icon="payments" color={COLORS.warning} onPress={() => router.push('/(provider)/payments')} />
              <OperationCard title="Mensajes" subtitle="Comunicación con usuarios." icon="chat-bubble-outline" color={COLORS.ocean} onPress={() => router.push('/(provider)/chat/general' as any)} />
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>

      {/* Drawer modal */}
      <Modal visible={drawerOpen} transparent animationType="none" onRequestClose={() => setDrawerOpen(false)}>
        <View style={{ flex: 1, flexDirection: 'row' }}>
          <View style={{ width: Math.min(SCREEN_W * 0.86, 342) }}>
            <DrawerContent onNav={(r) => router.push(r as any)} onClose={() => setDrawerOpen(false)} />
          </View>
          <TouchableOpacity style={{ flex: 1, backgroundColor: 'rgba(15,23,42,0.44)' }} activeOpacity={1} onPress={() => setDrawerOpen(false)} />
        </View>
      </Modal>
    </>
  );
}

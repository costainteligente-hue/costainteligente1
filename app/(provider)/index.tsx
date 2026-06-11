import React from 'react';
import { ScrollView, View, Text, TouchableOpacity, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useProviderStore } from '@/stores/providerStore';
import { SERVICE_DEFS, COLORS, formatCurrency } from '@/lib/constants';
import { CardBox } from '@/components/ui/CardBox';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { StatusPill } from '@/components/ui/StatusPill';

const { width } = Dimensions.get('window');
const COLS = width > 600 ? 4 : 2;

// ─── Hero Panel ──────────────────────────────────────────────────────────────
function HeroPanel() {
  return (
    <LinearGradient
      colors={['#0F172A', '#0F766E']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ borderRadius: 24, padding: 24, marginBottom: 12 }}
    >
      <View
        style={{
          backgroundColor: 'rgba(255,255,255,0.12)',
          borderRadius: 999,
          paddingHorizontal: 12,
          paddingVertical: 7,
          flexDirection: 'row',
          alignItems: 'center',
          alignSelf: 'flex-start',
          gap: 6,
          marginBottom: 16,
        }}
      >
        <MaterialIcons name="business-center" size={16} color="#fff" />
        <Text style={{ color: '#fff', fontSize: 12, fontWeight: '800' }}>Panel profesional</Text>
      </View>
      <Text style={{ color: '#fff', fontSize: 26, fontWeight: '800', letterSpacing: -0.5 }}>
        Panel comercial
      </Text>
      <Text style={{ color: 'rgba(255,255,255,0.84)', marginTop: 8, lineHeight: 22, fontSize: 14 }}>
        Administra servicios, horarios, precios, catálogos, reservaciones, pagos y comunicación
        desde una experiencia centralizada.
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 16 }}>
        {['Servicios verificados', 'Operación diaria', 'Control comercial'].map((tag) => (
          <View
            key={tag}
            style={{
              backgroundColor: 'rgba(255,255,255,0.10)',
              borderRadius: 999,
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.12)',
              paddingHorizontal: 10,
              paddingVertical: 6,
            }}
          >
            <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>{tag}</Text>
          </View>
        ))}
      </View>
    </LinearGradient>
  );
}

// ─── Metric card ─────────────────────────────────────────────────────────────
interface MetricCardProps {
  title: string;
  value: string;
  subtitle: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  color: string;
}

function MetricCard({ title, value, subtitle, icon, color }: MetricCardProps) {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: '#fff',
        borderRadius: 18,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        padding: 14,
        gap: 6,
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
      }}
    >
      <View
        style={{
          width: 38,
          height: 38,
          borderRadius: 99,
          backgroundColor: `${color}20`,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <MaterialIcons name={icon} size={20} color={color} />
      </View>
      <Text style={{ fontSize: 26, fontWeight: '800', color: '#0F172A' }}>{value}</Text>
      <Text style={{ fontWeight: '800', color: '#0F172A', fontSize: 13 }}>{title}</Text>
      <Text style={{ color: '#0F172A99', fontSize: 11 }}>{subtitle}</Text>
    </View>
  );
}

// ─── Operation shortcut ───────────────────────────────────────────────────────
interface ShortcutProps {
  title: string;
  subtitle: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  color: string;
  onPress: () => void;
}

function OperationShortcut({ title, subtitle, icon, color, onPress }: ShortcutProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        flex: 1,
        backgroundColor: '#fff',
        borderRadius: 18,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        padding: 14,
        gap: 6,
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
      }}
    >
      <View
        style={{
          width: 38,
          height: 38,
          borderRadius: 99,
          backgroundColor: `${color}20`,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <MaterialIcons name={icon} size={20} color={color} />
      </View>
      <Text style={{ fontWeight: '800', color: '#0F172A', fontSize: 13, marginTop: 4 }}>
        {title}
      </Text>
      <Text style={{ color: '#0F172A99', fontSize: 11, lineHeight: 16 }} numberOfLines={2}>
        {subtitle}
      </Text>
    </TouchableOpacity>
  );
}

// ─── Service summary row ─────────────────────────────────────────────────────
function ServiceSummaryRow({
  serviceId,
  count,
  onPress,
}: {
  serviceId: string;
  count: number;
  onPress: () => void;
}) {
  const def = SERVICE_DEFS.find((s) => s.id === serviceId);
  if (!def) return null;
  return (
    <TouchableOpacity onPress={onPress}>
      <CardBox>
        <View className="flex-row items-center gap-3">
          <View
            style={{
              width: 50,
              height: 50,
              borderRadius: 16,
              backgroundColor: `${def.color}20`,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <MaterialIcons name={def.icon as any} size={26} color={def.color} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontWeight: '800', color: '#0F172A' }}>{def.name}</Text>
            <Text style={{ color: '#0F172A99', fontSize: 13 }}>
              {count === 0 ? 'Sin registros' : `${count} registro${count > 1 ? 's' : ''} activo${count > 1 ? 's' : ''}`}
            </Text>
          </View>
          <MaterialIcons name="chevron-right" size={24} color="#94A3B8" />
        </View>
      </CardBox>
    </TouchableOpacity>
  );
}

// ─── Main screen ─────────────────────────────────────────────────────────────
export default function ProviderDashboard() {
  const router = useRouter();
  const { selectedServices, records } = useProviderStore();

  const enabledDefs = SERVICE_DEFS.filter((s) => selectedServices.has(s.id));
  const totalRecords = Object.values(records).reduce((sum, list) => sum + list.length, 0);

  const metrics: MetricCardProps[] = [
    { title: 'Servicios', value: `${selectedServices.size}`, subtitle: 'Seleccionados', icon: 'storefront', color: COLORS.ocean },
    { title: 'Verificados', value: `${totalRecords}`, subtitle: 'Registros activos', icon: 'verified', color: COLORS.success },
    { title: 'Reservas', value: '—', subtitle: 'Pendiente backend', icon: 'event-available', color: COLORS.info },
    { title: 'Pagos', value: '—', subtitle: 'Pendiente backend', icon: 'payments', color: COLORS.warning },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
        <HeroPanel />

        {/* Metrics grid */}
        {[0, 2].map((start) => (
          <View key={start} style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
            {metrics.slice(start, start + 2).map((m) => (
              <MetricCard key={m.title} {...m} />
            ))}
          </View>
        ))}

        {/* Services */}
        <SectionHeader
          title="Servicios para administrar"
          subtitle="Cada servicio cuenta con un registro activo."
          actionLabel="Configurar"
          actionIcon="tune"
          onAction={() => router.push('/(provider)/services')}
        />
        <View style={{ height: 10 }} />
        {enabledDefs.map((def) => (
          <ServiceSummaryRow
            key={def.id}
            serviceId={def.id}
            count={records[def.id]?.length ?? 0}
            onPress={() => router.push(`/(provider)/services?tab=${def.id}` as any)}
          />
        ))}

        {/* Operations */}
        <View style={{ height: 8 }} />
        <SectionHeader title="Centro de operación" subtitle="Herramientas de administración diaria." />
        <View style={{ height: 10 }} />
        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
          <OperationShortcut
            title="Reservaciones"
            subtitle="Solicitudes, cupos y confirmaciones."
            icon="event-available"
            color={COLORS.success}
            onPress={() => router.push('/(provider)/reservations')}
          />
          <OperationShortcut
            title="Calendario"
            subtitle="Disponibilidad y bloqueos."
            icon="calendar-month"
            color={COLORS.info}
            onPress={() => router.push('/(provider)/calendar')}
          />
        </View>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <OperationShortcut
            title="Pagos"
            subtitle="Cobros e historial."
            icon="payments"
            color={COLORS.warning}
            onPress={() => router.push('/(provider)/payments')}
          />
          <OperationShortcut
            title="Mensajes"
            subtitle="Comunicación con clientes."
            icon="chat-bubble-outline"
            color={COLORS.ocean}
            onPress={() => router.push('/(provider)/chat/general' as any)}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

import React from 'react';
import { ScrollView, View, Text, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { COLORS, MONTH_NAMES } from '@/lib/constants';
import { useAuthStore } from '@/stores/authStore';
import { CardBox } from '@/components/ui/CardBox';
import { InfoBox } from '@/components/ui/InfoBox';

// ─── Weather card (placeholder – calls Edge Function get-weather) ─────────────
function WeatherCard() {
  const today = new Date();
  return (
    <CardBox>
      <View className="flex-row items-center gap-3">
        <View
          style={{
            width: 52,
            height: 52,
            borderRadius: 16,
            backgroundColor: `${COLORS.info}20`,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <MaterialIcons name="wb-sunny" size={28} color={COLORS.info} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontWeight: '800', color: '#0F172A', fontSize: 17 }}>
            Zihuatanejo, Guerrero
          </Text>
          <Text style={{ color: '#0F172A99', fontSize: 13 }}>
            {today.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}
          </Text>
        </View>
        <View className="items-end">
          <Text style={{ fontSize: 28, fontWeight: '800', color: '#0F172A' }}>29°C</Text>
          <Text style={{ color: '#0F172A99', fontSize: 12 }}>Cielo despejado</Text>
        </View>
      </View>
      <View style={{ height: 1, backgroundColor: '#E2E8F0', marginVertical: 12 }} />
      <View className="flex-row gap-4">
        <View className="flex-row items-center gap-1">
          <MaterialIcons name="air" size={16} color="#64748B" />
          <Text style={{ color: '#0F172A99', fontSize: 12 }}>Viento 18 km/h</Text>
        </View>
        <View className="flex-row items-center gap-1">
          <MaterialIcons name="water" size={16} color="#64748B" />
          <Text style={{ color: '#0F172A99', fontSize: 12 }}>Olas 0.8 m</Text>
        </View>
        <View className="flex-row items-center gap-1">
          <MaterialIcons name="thermostat" size={16} color="#64748B" />
          <Text style={{ color: '#0F172A99', fontSize: 12 }}>Mar 27°C</Text>
        </View>
      </View>
    </CardBox>
  );
}

// ─── Fish of the month card ───────────────────────────────────────────────────
function FishOfMonth() {
  const month = new Date().getMonth();
  const fish = ['Pez vela', 'Dorado', 'Atún aleta amarilla', 'Marlín azul'];
  return (
    <CardBox>
      <View className="flex-row items-center gap-2 mb-3">
        <MaterialIcons name="set-meal" size={22} color={COLORS.success} />
        <Text style={{ fontWeight: '800', color: '#0F172A', fontSize: 15 }}>
          Peces del mes · {MONTH_NAMES[month]}
        </Text>
      </View>
      <View className="flex-row flex-wrap gap-2">
        {fish.map((f) => (
          <View
            key={f}
            style={{
              backgroundColor: `${COLORS.success}15`,
              borderRadius: 999,
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderWidth: 1,
              borderColor: `${COLORS.success}30`,
            }}
          >
            <Text style={{ color: COLORS.success, fontWeight: '700', fontSize: 13 }}>{f}</Text>
          </View>
        ))}
      </View>
    </CardBox>
  );
}

// ─── Quick access grid ────────────────────────────────────────────────────────
interface QuickItem {
  label: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  color: string;
  route: string;
}

const QUICK_ITEMS: QuickItem[] = [
  { label: 'Mapa', icon: 'map', color: COLORS.ocean, route: '/(client)/map' },
  { label: 'Temporadas', icon: 'calendar-month', color: COLORS.success, route: '/(client)/seasons' },
  { label: 'Servicios', icon: 'storefront', color: COLORS.warning, route: '/(client)/services' },
  { label: 'Reservar', icon: 'event-available', color: COLORS.info, route: '/(client)/reservations' },
  { label: 'Favoritos', icon: 'favorite', color: COLORS.danger, route: '/(client)/favorites' },
  { label: 'SOS', icon: 'sos', color: COLORS.danger, route: '/(client)/sos' },
];

function QuickAccess({ router }: { router: ReturnType<typeof useRouter> }) {
  return (
    <View className="flex-row flex-wrap gap-3">
      {QUICK_ITEMS.map((item) => (
        <TouchableOpacity
          key={item.label}
          onPress={() => router.push(item.route as any)}
          style={{
            flex: 1,
            minWidth: '45%',
            backgroundColor: '#fff',
            borderRadius: 18,
            borderWidth: 1,
            borderColor: '#E2E8F0',
            padding: 14,
            alignItems: 'center',
            gap: 8,
            shadowColor: '#0F172A',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.05,
            shadowRadius: 10,
            elevation: 2,
          }}
        >
          <View
            style={{
              width: 48,
              height: 48,
              borderRadius: 16,
              backgroundColor: `${item.color}20`,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <MaterialIcons name={item.icon} size={26} color={item.color} />
          </View>
          <Text style={{ fontWeight: '800', color: '#0F172A', fontSize: 14 }}>{item.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

// ─── SOS floating button ──────────────────────────────────────────────────────
export function SOSFloatingButton({ onPress }: { onPress: () => void }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        position: 'absolute',
        bottom: 88,
        right: 16,
        width: 56,
        height: 56,
        borderRadius: 99,
        backgroundColor: COLORS.danger,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: COLORS.danger,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 8,
        zIndex: 999,
      }}
    >
      <MaterialIcons name="sos" size={26} color="#fff" />
    </TouchableOpacity>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function ClientDashboard() {
  const router = useRouter();
  const { user } = useAuthStore();
  const firstName = user?.user_metadata?.full_name?.split(' ')[0] ?? 'Pescador';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 80 }}>
        {/* Hero greeting */}
        <LinearGradient
          colors={['#0F172A', '#0F766E']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ borderRadius: 24, padding: 22, marginBottom: 14 }}
        >
          <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14, fontWeight: '600' }}>
            ¡Buen día!
          </Text>
          <Text style={{ color: '#fff', fontSize: 24, fontWeight: '800', marginTop: 2 }}>
            {firstName}
          </Text>
          <Text style={{ color: 'rgba(255,255,255,0.75)', marginTop: 6, fontSize: 14 }}>
            Condiciones perfectas para salir a pescar hoy.
          </Text>
        </LinearGradient>

        <WeatherCard />
        <FishOfMonth />

        <Text style={{ fontWeight: '800', color: '#0F172A', fontSize: 17, marginBottom: 10, marginTop: 4 }}>
          Accesos rápidos
        </Text>
        <QuickAccess router={router} />

        <InfoBox text="Activa el botón SOS (esquina inferior derecha) en cualquier pantalla si necesitas asistencia de emergencia en el mar." />
      </ScrollView>

      {/* Global SOS button */}
      <SOSFloatingButton onPress={() => router.push('/(client)/sos')} />
    </SafeAreaView>
  );
}

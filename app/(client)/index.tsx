import React, { useEffect, useState } from 'react';
import { ScrollView, View, Text, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, MONTH_NAMES } from '@/lib/constants';
import { useAuthStore } from '@/stores/authStore';
import { useWeather } from '@/hooks/useWeather';
import { CardBox } from '@/components/ui/CardBox';

// ─── Tipos ────────────────────────────────────────────────────────────────────
interface UserPrefs {
  interests: string[];
  level: string | null;
}

// ─── Greeting ─────────────────────────────────────────────────────────────────
function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return '¡Buenos días';
  if (h < 19) return '¡Buenas tardes';
  return '¡Buenas noches';
}

// ─── Weather strip ─────────────────────────────────────────────────────────────
function WeatherStrip() {
  const { data } = useWeather();
  const temp  = data?.temperature ?? 29;
  const wind  = data?.windspeed   ?? 18;
  const code  = data?.weathercode ?? 0;
  const icon  = code === 0 ? 'wb-sunny' : code <= 3 ? 'cloud' : 'grain';
  const condition = code === 0 ? 'Cielo despejado' : code <= 3 ? 'Parcialmente nublado' : 'Lluvia ligera';
  const windOk = wind < 30;

  return (
    <CardBox>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: `${COLORS.info}20`, alignItems: 'center', justifyContent: 'center' }}>
          <MaterialIcons name={icon as any} size={26} color={COLORS.info} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontWeight: '800', color: '#0F172A', fontSize: 15 }}>Zihuatanejo, Guerrero</Text>
          <Text style={{ color: '#64748B', fontSize: 12 }}>{condition}</Text>
        </View>
        <Text style={{ fontSize: 26, fontWeight: '800', color: '#0F172A' }}>{Math.round(temp)}°C</Text>
      </View>
      <View style={{ height: 1, backgroundColor: '#F1F5F9', marginVertical: 10 }} />
      <View style={{ flexDirection: 'row', gap: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <MaterialIcons name="air" size={15} color={windOk ? COLORS.success : COLORS.danger} />
          <Text style={{ color: windOk ? COLORS.success : COLORS.danger, fontSize: 12, fontWeight: '700' }}>
            {Math.round(wind)} km/h · {windOk ? 'Viento suave' : 'Viento fuerte'}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <MaterialIcons name="waves" size={15} color={COLORS.ocean} />
          <Text style={{ color: COLORS.ocean, fontSize: 12, fontWeight: '700' }}>
            {windOk ? 'Mar en calma' : 'Mar agitado'}
          </Text>
        </View>
      </View>
      {!windOk && (
        <View style={{ marginTop: 8, backgroundColor: `${COLORS.danger}10`, borderRadius: 10, padding: 8, flexDirection: 'row', gap: 6 }}>
          <MaterialIcons name="warning" size={16} color={COLORS.danger} />
          <Text style={{ color: COLORS.danger, fontSize: 12, fontWeight: '700', flex: 1 }}>
            Condiciones adversas. Se recomienda no salir a mar abierto.
          </Text>
        </View>
      )}
    </CardBox>
  );
}

// ─── Sección personalizada según intereses ────────────────────────────────────
interface QuickCard {
  label: string;
  sub: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  color: string;
  route: string;
}

function buildQuickCards(prefs: UserPrefs): QuickCard[] {
  const cards: QuickCard[] = [];
  const { interests, level } = prefs;

  // Siempre incluir mapa
  cards.push({ label: 'Mapa', sub: 'Zonas de pesca cerca', icon: 'map', color: COLORS.ocean, route: '/(client)/map' });

  if (interests.includes('learn') || level === 'beginner' || level === 'tourist') {
    cards.push({ label: 'Tutoriales', sub: 'Aprende a pescar', icon: 'play-circle-outline', color: COLORS.purple, route: '/(client)/tutorials' });
    cards.push({ label: 'Equipo', sub: 'Qué llevar', icon: 'straighten', color: COLORS.warning, route: '/(client)/equipment' });
  }
  if (interests.includes('boat') || interests.includes('provider')) {
    cards.push({ label: 'Servicios', sub: 'Lanchas y guías', icon: 'directions-boat', color: COLORS.info, route: '/(client)/services' });
  }
  if (interests.includes('restaurant')) {
    cards.push({ label: 'Restaurantes', sub: 'Mariscos verificados', icon: 'restaurant', color: COLORS.brown, route: '/(client)/services' });
  }
  if (interests.includes('gear') || interests.includes('fishmarket')) {
    cards.push({ label: 'Tiendas', sub: 'Equipo y pescaderías', icon: 'storefront', color: COLORS.success, route: '/(client)/services' });
  }
  if (interests.includes('transport')) {
    cards.push({ label: 'Transporte', sub: 'Turístico', icon: 'airport-shuttle', color: COLORS.olive ?? '#4D7C0F', route: '/(client)/services' });
  }

  // Siempre incluir estos
  cards.push({ label: 'Temporadas', sub: 'Especies del mes', icon: 'calendar-month', color: COLORS.success, route: '/(client)/seasons' });
  cards.push({ label: 'Reservas', sub: 'Mis solicitudes', icon: 'event-available', color: COLORS.warning, route: '/(client)/reservations' });
  cards.push({ label: 'Favoritos', sub: 'Zonas guardadas', icon: 'favorite', color: COLORS.danger, route: '/(client)/favorites' });
  cards.push({ label: 'Normas', sub: 'Licencias y vedas', icon: 'gavel', color: COLORS.navy ?? '#0F172A', route: '/(client)/normas-pesca' });
  cards.push({ label: 'Comunidad', sub: 'Capturas y tips', icon: 'people', color: COLORS.ocean, route: '/(client)/community' });

  // Deduplica y limita
  const seen = new Set<string>();
  return cards.filter((c) => { if (seen.has(c.label)) return false; seen.add(c.label); return true; });
}

// ─── Zonas destacadas (seed) ───────────────────────────────────────────────────
const FEATURED_ZONES = [
  { id: 'z2', name: 'La Ropa', level: 'principiante', type: 'Playa', risk: 'Bajo', species: 'Jurel, Robalo' },
  { id: 'z4', name: 'Bahía de Zihuatanejo', level: 'principiante', type: 'Bahía', risk: 'Bajo', species: 'Huachinango, Mojarra' },
  { id: 'z1', name: 'Bajo de Chila', level: 'intermedio', type: 'Offshore', risk: 'Medio', species: 'Pez vela, Dorado' },
];

const LEVEL_COLOR: Record<string, string> = {
  principiante: COLORS.success,
  intermedio:   COLORS.warning,
  avanzado:     COLORS.danger,
};

// ─── Mes actual ───────────────────────────────────────────────────────────────
const SPECIES_BY_MONTH: Record<number, string[]> = {
  0:  ['Pez vela', 'Marlín azul'],
  1:  ['Dorado', 'Wahoo'],
  2:  ['Atún aleta amarilla', 'Dorado'],
  3:  ['Pez vela', 'Dorado'],
  4:  ['Marlín rayado', 'Pez vela'],
  5:  ['Huachinango', 'Robalo'],
  6:  ['Jurel', 'Sierra'],
  7:  ['Pez vela', 'Dorado'],
  8:  ['Atún', 'Wahoo'],
  9:  ['Marlín azul', 'Dorado'],
  10: ['Pez vela', 'Marlín'],
  11: ['Huachinango', 'Robalo'],
};

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function ClientDashboard() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [prefs, setPrefs] = useState<UserPrefs>({ interests: [], level: null });

  const firstName = user?.fullName?.split(' ')[0] ?? 'Pescador';
  const month     = new Date().getMonth();
  const species   = SPECIES_BY_MONTH[month] ?? [];
  const cards     = buildQuickCards(prefs);

  useEffect(() => {
    AsyncStorage.getItem('costa:user_prefs').then((raw) => {
      if (raw) setPrefs(JSON.parse(raw));
    });
  }, []);

  const levelLabel: Record<string, string> = {
    beginner: 'Principiante', mid: 'Intermedio', advanced: 'Avanzado',
    tourist: 'Turista', local: 'Pescador local',
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>

        {/* Hero */}
        <LinearGradient
          colors={['#0F172A', '#0F766E']}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={{ borderRadius: 24, padding: 22, marginBottom: 14 }}
        >
          <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: 13, fontWeight: '600' }}>
            {getGreeting()},
          </Text>
          <Text style={{ color: '#fff', fontSize: 26, fontWeight: '800', marginTop: 2 }}>
            {firstName} 🎣
          </Text>
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
            {prefs.level && (
              <View style={{ backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 }}>
                <Text style={{ color: '#fff', fontWeight: '700', fontSize: 12 }}>
                  ⭐ {levelLabel[prefs.level] ?? prefs.level}
                </Text>
              </View>
            )}
            {prefs.interests.slice(0, 2).map((i) => (
              <View key={i} style={{ backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 }}>
                <Text style={{ color: 'rgba(255,255,255,0.85)', fontWeight: '600', fontSize: 11 }}>
                  {i === 'boat' ? '⛵ Lancha' : i === 'learn' ? '📚 Aprender' : i === 'beach' ? '🏖 Playa' : i === 'restaurant' ? '🍽 Restaurantes' : i}
                </Text>
              </View>
            ))}
            {prefs.interests.length === 0 && (
              <TouchableOpacity
                onPress={() => router.push('/auth/onboarding' as any)}
                style={{ backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, flexDirection: 'row', alignItems: 'center', gap: 4 }}
              >
                <MaterialIcons name="tune" size={13} color="#fff" />
                <Text style={{ color: '#fff', fontWeight: '700', fontSize: 12 }}>Personalizar</Text>
              </TouchableOpacity>
            )}
          </View>
        </LinearGradient>

        {/* Clima */}
        <WeatherStrip />

        {/* Especies del mes */}
        <CardBox>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <MaterialIcons name="set-meal" size={20} color={COLORS.success} />
            <Text style={{ fontWeight: '800', color: '#0F172A', fontSize: 15 }}>
              Especies del mes · {MONTH_NAMES[month]}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {species.map((s) => (
              <View key={s} style={{ backgroundColor: `${COLORS.success}15`, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 5, borderWidth: 1, borderColor: `${COLORS.success}30` }}>
                <Text style={{ color: COLORS.success, fontWeight: '700', fontSize: 13 }}>🐟 {s}</Text>
              </View>
            ))}
          </View>
          <TouchableOpacity
            onPress={() => router.push('/(client)/seasons' as any)}
            style={{ marginTop: 10, flexDirection: 'row', alignItems: 'center', gap: 4 }}
          >
            <Text style={{ color: COLORS.ocean, fontWeight: '700', fontSize: 13 }}>Ver todas las temporadas</Text>
            <MaterialIcons name="arrow-forward" size={16} color={COLORS.ocean} />
          </TouchableOpacity>
        </CardBox>

        {/* Zonas destacadas */}
        <Text style={{ fontWeight: '800', color: '#0F172A', fontSize: 16, marginBottom: 10, marginTop: 4 }}>
          Zonas recomendadas
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
          <View style={{ flexDirection: 'row', gap: 12, paddingRight: 16 }}>
            {FEATURED_ZONES.filter((z) =>
              prefs.level === 'advanced' || !['avanzado'].includes(z.level)
            ).map((z) => (
              <TouchableOpacity
                key={z.id}
                onPress={() => router.push('/(client)/map' as any)}
                style={{
                  width: 180, backgroundColor: '#fff', borderRadius: 16,
                  padding: 14, borderWidth: 1, borderColor: '#E2E8F0',
                  shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                  <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: `${LEVEL_COLOR[z.level]}20`, alignItems: 'center', justifyContent: 'center' }}>
                    <MaterialIcons name="place" size={18} color={LEVEL_COLOR[z.level]} />
                  </View>
                  <View style={{ backgroundColor: `${LEVEL_COLOR[z.level]}20`, borderRadius: 999, paddingHorizontal: 6, paddingVertical: 2 }}>
                    <Text style={{ color: LEVEL_COLOR[z.level], fontSize: 10, fontWeight: '800' }}>
                      {z.level.charAt(0).toUpperCase() + z.level.slice(1)}
                    </Text>
                  </View>
                </View>
                <Text style={{ fontWeight: '800', color: '#0F172A', fontSize: 14, marginBottom: 4 }}>{z.name}</Text>
                <Text style={{ color: '#64748B', fontSize: 11 }}>{z.type}</Text>
                <Text style={{ color: COLORS.success, fontSize: 11, fontWeight: '700', marginTop: 4 }}>🐟 {z.species}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 }}>
                  <MaterialIcons name="security" size={13} color={z.risk === 'Bajo' ? COLORS.success : COLORS.warning} />
                  <Text style={{ color: z.risk === 'Bajo' ? COLORS.success : COLORS.warning, fontSize: 11, fontWeight: '700' }}>
                    Riesgo {z.risk}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* Accesos rápidos personalizados */}
        <Text style={{ fontWeight: '800', color: '#0F172A', fontSize: 16, marginBottom: 10 }}>
          Accesos rápidos
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          {cards.slice(0, 8).map((item) => (
            <TouchableOpacity
              key={item.label}
              onPress={() => router.push(item.route as any)}
              style={{
                width: '47%', backgroundColor: '#fff', borderRadius: 16,
                borderWidth: 1, borderColor: '#E2E8F0', padding: 14, gap: 6,
                shadowColor: '#0F172A', shadowOffset: { width: 0, height: 3 },
                shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
              }}
            >
              <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: `${item.color}18`, alignItems: 'center', justifyContent: 'center' }}>
                <MaterialIcons name={item.icon} size={24} color={item.color} />
              </View>
              <Text style={{ fontWeight: '800', color: '#0F172A', fontSize: 13 }}>{item.label}</Text>
              <Text style={{ color: '#94A3B8', fontSize: 11 }}>{item.sub}</Text>
            </TouchableOpacity>
          ))}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

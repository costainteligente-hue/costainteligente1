/**
 * Pantalla de Inicio — Cliente
 * Rediseño completo: hero inmersivo, clima, especies del mes con fotos,
 * zonas recomendadas, accesos rápidos y sección SOS
 */
import React, { useEffect, useState } from 'react';
import {
  ScrollView, View, Text, TouchableOpacity, Image,
  Dimensions, ImageBackground,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, MONTH_NAMES } from '@/lib/constants';
import { useAuthStore } from '@/stores/authStore';
import { useWeather } from '@/hooks/useWeather';
import { ZONE_ID_TO_PHOTO } from '@/lib/zone-photos';

const { width: SCREEN_W } = Dimensions.get('window');

// ─── Helpers ──────────────────────────────────────────────────────────────────
interface UserPrefs { interests: string[]; level: string | null; }

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 6)  return 'Madrugada';
  if (h < 12) return 'Buenos días';
  if (h < 19) return 'Buenas tardes';
  return 'Buenas noches';
}

function getGreetingEmoji(): string {
  const h = new Date().getHours();
  if (h < 6)  return '🌙';
  if (h < 12) return '☀️';
  if (h < 19) return '🎣';
  return '🌊';
}

// ─── Foto de especie desde Wikimedia ─────────────────────────────────────────
const SPECIES_WIKIMEDIA: Record<string, string> = {
  'Pez vela':            'Indo-Pacific sailfish',
  'Marlín azul':         'Atlantic blue marlin',
  'Marlín rayado':       'Striped marlin Pacific',
  'Marlín':              'Atlantic blue marlin',
  'Dorado':              'Mahi-mahi',
  'Atún aleta amarilla': 'Yellowfin tuna',
  'Atún':                'Yellowfin tuna',
  'Wahoo':               'Wahoo (fish)',
  'Sierra':              'Pacific king mackerel',
  'Jurel':               'Amberjack',
  'Robalo':              'Common snook',
  'Huachinango':         'Red snapper',
  'Mojarra':             'Eucinostomus',
};
const wikiCache: Record<string, string | null> = {};
async function fetchSpeciesPhoto(name: string): Promise<string | null> {
  const term = SPECIES_WIKIMEDIA[name] ?? name + ' fish';
  if (term in wikiCache) return wikiCache[term];
  try {
    const res  = await fetch(`https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(term)}&prop=pageimages&format=json&pithumbsize=600&origin=*`);
    const data = await res.json();
    const page = Object.values(data?.query?.pages ?? {})[0] as any;
    wikiCache[term] = page?.thumbnail?.source ?? null;
    return wikiCache[term];
  } catch { wikiCache[term] = null; return null; }
}
function useSpeciesPhoto(name: string) {
  const [photo, setPhoto] = useState<string | null>(null);
  useEffect(() => { fetchSpeciesPhoto(name).then(setPhoto); }, [name]);
  return photo;
}

// ─── Datos del mes ────────────────────────────────────────────────────────────
const SPECIES_BY_MONTH: Record<number, string[]> = {
  0:  ['Pez vela', 'Marlín rayado'],
  1:  ['Marlín azul', 'Wahoo'],
  2:  ['Dorado', 'Atún aleta amarilla'],
  3:  ['Sierra', 'Jurel'],
  4:  ['Pez vela', 'Dorado', 'Marlín azul'],
  5:  ['Pez vela', 'Marlín azul'],
  6:  ['Pez vela', 'Dorado'],
  7:  ['Pez vela', 'Dorado'],
  8:  ['Atún aleta amarilla', 'Pez vela'],
  9:  ['Pez vela', 'Atún'],
  10: ['Huachinango', 'Robalo'],
  11: ['Pez vela', 'Marlín rayado'],
};

const FEATURED_ZONES = [
  { id: 'z2',  name: 'Playa La Ropa',         level: 'principiante', type: 'Orilla',   species: 'Jurel, Robalo',         risk: 'Bajo'  },
  { id: 'z4',  name: 'Bahía de Zihuatanejo',  level: 'principiante', type: 'Bahía',    species: 'Huachinango, Mojarra',  risk: 'Bajo'  },
  { id: 'z1',  name: 'Bajo de Chila',         level: 'intermedio',   type: 'Offshore', species: 'Pez vela, Dorado',      risk: 'Medio' },
  { id: 'z19', name: 'Bahía de Banderas',      level: 'intermedio',   type: 'Bahía',    species: 'Marlín, Dorado, Atún',  risk: 'Medio' },
  { id: 'z25', name: 'Cabo San Lucas',         level: 'avanzado',     type: 'Offshore', species: 'Marlín, Pez vela',      risk: 'Alto'  },
];

const LEVEL_COLOR: Record<string, string> = {
  principiante: COLORS.success,
  intermedio:   COLORS.warning,
  avanzado:     COLORS.danger,
};

// ─── Chip de especie con foto ─────────────────────────────────────────────────
function SpeciesChip({ name }: { name: string }) {
  const photo = useSpeciesPhoto(name);
  return (
    <TouchableOpacity style={{ alignItems: 'center', width: 96 }}>
      <View style={{ width: 80, height: 80, borderRadius: 16, overflow: 'hidden', backgroundColor: `${COLORS.success}15`, borderWidth: 2, borderColor: `${COLORS.success}30`, marginBottom: 6 }}>
        {photo
          ? <Image source={{ uri: photo }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
          : <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><Text style={{ fontSize: 28 }}>🐟</Text></View>
        }
      </View>
      <Text style={{ color: '#0F172A', fontWeight: '700', fontSize: 11, textAlign: 'center' }} numberOfLines={2}>{name}</Text>
    </TouchableOpacity>
  );
}

// ─── Tarjeta de zona ──────────────────────────────────────────────────────────
function ZoneCard({ zone, onPress }: { zone: typeof FEATURED_ZONES[0]; onPress: () => void }) {
  const photo = ZONE_ID_TO_PHOTO[zone.id] ?? null;
  const color = LEVEL_COLOR[zone.level];
  return (
    <TouchableOpacity onPress={onPress} style={{ width: 200, borderRadius: 20, overflow: 'hidden', marginRight: 12,
      shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 10, elevation: 4 }}>
      <View style={{ height: 130, backgroundColor: `${color}20` }}>
        {photo
          ? <Image source={photo} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
          : <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><MaterialIcons name="place" size={36} color={color} /></View>
        }
        <LinearGradient colors={['transparent', 'rgba(15,23,42,0.85)']} style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 70 }} />
        <View style={{ position: 'absolute', top: 10, left: 10, backgroundColor: color, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 }}>
          <Text style={{ color: '#fff', fontSize: 10, fontWeight: '800' }}>{zone.level}</Text>
        </View>
        <View style={{ position: 'absolute', bottom: 8, left: 12, right: 12 }}>
          <Text style={{ color: '#fff', fontWeight: '900', fontSize: 14 }} numberOfLines={1}>{zone.name}</Text>
        </View>
      </View>
      <View style={{ backgroundColor: '#fff', padding: 12 }}>
        <Text style={{ color: '#64748B', fontSize: 11 }}>{zone.type}</Text>
        <Text style={{ color: COLORS.success, fontSize: 11, fontWeight: '700', marginTop: 3 }}>🐟 {zone.species}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 5 }}>
          <MaterialIcons name="security" size={11} color={zone.risk === 'Bajo' ? COLORS.success : zone.risk === 'Medio' ? COLORS.warning : COLORS.danger} />
          <Text style={{ fontSize: 10, fontWeight: '700', color: zone.risk === 'Bajo' ? COLORS.success : zone.risk === 'Medio' ? COLORS.warning : COLORS.danger }}>Riesgo {zone.risk}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ─── Acceso rápido ────────────────────────────────────────────────────────────
function QuickButton({ icon, label, color, onPress }: {
  icon: keyof typeof MaterialIcons.glyphMap; label: string; color: string; onPress: () => void;
}) {
  return (
    <TouchableOpacity onPress={onPress} style={{ alignItems: 'center', width: 72 }}>
      <View style={{ width: 56, height: 56, borderRadius: 18, backgroundColor: `${color}15`, alignItems: 'center', justifyContent: 'center', marginBottom: 6,
        shadowColor: color, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.2, shadowRadius: 6, elevation: 3 }}>
        <MaterialIcons name={icon} size={26} color={color} />
      </View>
      <Text style={{ color: '#374151', fontWeight: '700', fontSize: 10, textAlign: 'center' }} numberOfLines={2}>{label}</Text>
    </TouchableOpacity>
  );
}

// ─── Clima compacto ───────────────────────────────────────────────────────────
function WeatherCard() {
  const { data } = useWeather();
  const temp   = data?.temperature ?? 29;
  const wind   = data?.windspeed   ?? 18;
  const code   = data?.weathercode ?? 0;
  const icon   = code === 0 ? 'wb-sunny' : code <= 3 ? 'partly-cloudy-day' : 'grain';
  const cond   = code === 0 ? 'Despejado' : code <= 3 ? 'Nublado parcial' : 'Lluvia';
  const windOk = wind < 30;
  const seaOk  = wind < 25;

  return (
    <LinearGradient colors={windOk ? ['#0369A1', '#0891B2'] : ['#9F1239', '#DC2626']}
      start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
      style={{ borderRadius: 20, padding: 18, marginBottom: 16 }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
        <View>
          <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: 12, fontWeight: '600' }}>Condición actual</Text>
          <Text style={{ color: '#fff', fontSize: 13, fontWeight: '700', marginTop: 2 }}>Zihuatanejo, Gro.</Text>
          <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 13, marginTop: 4 }}>{cond}</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={{ color: '#fff', fontSize: 44, fontWeight: '900', letterSpacing: -1 }}>{Math.round(temp)}°</Text>
          <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: 11 }}>Celsius</Text>
        </View>
      </View>
      {/* Stats row */}
      <View style={{ flexDirection: 'row', gap: 10 }}>
        {[
          { icon: 'air' as const,   label: `${Math.round(wind)} km/h`, sub: windOk ? 'Viento OK' : 'Viento fuerte' },
          { icon: 'waves' as const, label: seaOk ? 'En calma' : 'Agitado', sub: 'Estado del mar' },
          { icon: 'thermostat' as const, label: `${Math.round(temp)}°C`, sub: 'Temperatura' },
        ].map((s) => (
          <View key={s.sub} style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 12, padding: 10, alignItems: 'center' }}>
            <MaterialIcons name={s.icon} size={18} color="#fff" />
            <Text style={{ color: '#fff', fontWeight: '800', fontSize: 12, marginTop: 3 }}>{s.label}</Text>
            <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 9, marginTop: 1 }}>{s.sub}</Text>
          </View>
        ))}
      </View>
      {!windOk && (
        <View style={{ marginTop: 12, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 10, padding: 10, flexDirection: 'row', gap: 6 }}>
          <MaterialIcons name="warning" size={16} color="#FCD34D" />
          <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700', flex: 1 }}>
            ⚠ Condiciones adversas. No se recomienda salir a mar abierto.
          </Text>
        </View>
      )}
    </LinearGradient>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function ClientDashboard() {
  const router  = useRouter();
  const { user } = useAuthStore();
  const [prefs, setPrefs] = useState<UserPrefs>({ interests: [], level: null });

  const firstName = user?.fullName?.split(' ')[0] ?? 'Pescador';
  const month     = new Date().getMonth();
  const species   = SPECIES_BY_MONTH[month] ?? [];

  useEffect(() => {
    AsyncStorage.getItem('costa:user_prefs').then((raw) => {
      if (raw) setPrefs(JSON.parse(raw));
    });
  }, []);

  const levelLabel: Record<string, string> = {
    beginner: 'Principiante', mid: 'Intermedio', advanced: 'Avanzado',
    tourist: 'Turista', local: 'Pescador local',
  };

  // Solo accesos que NO están en la barra inferior (que ya tiene: Inicio, Mapa, Servicios, Temporadas, Comunidad, Perfil)
  const QUICK_ACTIONS = [
    { icon: 'event-available' as const,       label: 'Reservas',    color: COLORS.warning, route: '/(client)/reservations' },
    { icon: 'favorite' as const,              label: 'Favoritos',   color: COLORS.danger,  route: '/(client)/favorites' },
    { icon: 'gps-fixed' as const,             label: 'Coordenadas', color: COLORS.ocean,   route: '/(client)/fishing-coords' },
    { icon: 'play-circle-outline' as const,   label: 'Tutoriales',  color: '#7C3AED',      route: '/(client)/tutorials' },
    { icon: 'gavel' as const,                 label: 'Normas',      color: '#0F172A',      route: '/(client)/normas-pesca' },
    { icon: 'report-problem' as const,        label: 'Reportar',    color: COLORS.danger,  route: '/(client)/reportar' },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }} edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }} showsVerticalScrollIndicator={false}>

        {/* ── HERO ──────────────────────────────────────────────────────────── */}
        <LinearGradient colors={['#0F172A', '#0F766E', '#14B8A6']}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 28 }}>

          {/* Top row */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <View>
              <Text style={{ color: 'rgba(255,255,255,0.65)', fontSize: 12, fontWeight: '600' }}>
                {getGreeting()} {getGreetingEmoji()}
              </Text>
              <Text style={{ color: '#fff', fontSize: 24, fontWeight: '900', letterSpacing: -0.5, marginTop: 2 }}>
                {firstName}
              </Text>
            </View>
            <TouchableOpacity onPress={() => router.push('/(client)/sos' as any)}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8 }}>
              <MaterialIcons name="local-phone" size={16} color="#fff" />
              <Text style={{ color: '#fff', fontWeight: '900', fontSize: 13 }}>Emergencia</Text>
            </TouchableOpacity>
          </View>

          {/* Tags de perfil */}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
            {prefs.level && (
              <View style={{ backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Text style={{ fontSize: 12 }}>⭐</Text>
                <Text style={{ color: '#fff', fontWeight: '700', fontSize: 12 }}>{levelLabel[prefs.level] ?? prefs.level}</Text>
              </View>
            )}
            {['boat', 'learn', 'beach', 'restaurant'].filter((i) => prefs.interests.includes(i)).slice(0, 2).map((i) => (
              <View key={i} style={{ backgroundColor: 'rgba(255,255,255,0.10)', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 }}>
                <Text style={{ color: 'rgba(255,255,255,0.85)', fontWeight: '600', fontSize: 11 }}>
                  {i === 'boat' ? '⛵ Lancha' : i === 'learn' ? '📚 Aprender' : i === 'beach' ? '🏖 Playa' : '🍽 Restaurantes'}
                </Text>
              </View>
            ))}
            {!prefs.level && (
              <TouchableOpacity onPress={() => router.push('/auth/onboarding' as any)}
                style={{ backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <MaterialIcons name="tune" size={13} color="#fff" />
                <Text style={{ color: '#fff', fontWeight: '700', fontSize: 12 }}>Personalizar perfil</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Quick actions en el hero */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
            {QUICK_ACTIONS.map((a) => (
              <TouchableOpacity key={a.label} onPress={() => router.push(a.route as any)}
                style={{ alignItems: 'center', gap: 5 }}>
                <View style={{ width: 50, height: 50, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' }}>
                  <MaterialIcons name={a.icon} size={24} color="#fff" />
                </View>
                <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 10, fontWeight: '700' }}>{a.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </LinearGradient>

        <View style={{ paddingHorizontal: 16, paddingTop: 16 }}>

          {/* ── CLIMA ─────────────────────────────────────────────────────── */}
          <WeatherCard />

          {/* ── ESPECIES DEL MES ─────────────────────────────────────────── */}
          <View style={{ marginBottom: 20 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <View>
                <Text style={{ fontWeight: '900', color: '#0F172A', fontSize: 18, letterSpacing: -0.3 }}>
                  🐟 Especies del mes
                </Text>
                <Text style={{ color: '#64748B', fontSize: 12, marginTop: 2 }}>{MONTH_NAMES[month]} · Más activas ahora</Text>
              </View>
              <TouchableOpacity onPress={() => router.push('/(client)/seasons' as any)}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: `${COLORS.success}12`, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6 }}>
                <Text style={{ color: COLORS.success, fontWeight: '800', fontSize: 12 }}>Ver todo</Text>
                <MaterialIcons name="arrow-forward" size={14} color={COLORS.success} />
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
              {species.map((s) => <SpeciesChip key={s} name={s} />)}
            </ScrollView>
          </View>

          {/* ── ZONAS RECOMENDADAS ────────────────────────────────────────── */}
          <View style={{ marginBottom: 20 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <View>
                <Text style={{ fontWeight: '900', color: '#0F172A', fontSize: 18, letterSpacing: -0.3 }}>
                  📍 Zonas recomendadas
                </Text>
                <Text style={{ color: '#64748B', fontSize: 12, marginTop: 2 }}>Pacífico, Golfo y Caribe</Text>
              </View>
              <TouchableOpacity onPress={() => router.push('/(client)/map' as any)}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: `${COLORS.ocean}12`, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6 }}>
                <Text style={{ color: COLORS.ocean, fontWeight: '800', fontSize: 12 }}>Ver mapa</Text>
                <MaterialIcons name="map" size={14} color={COLORS.ocean} />
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 16 }}>
              {FEATURED_ZONES.map((z) => (
                <ZoneCard key={z.id} zone={z} onPress={() => router.push('/(client)/map' as any)} />
              ))}
            </ScrollView>
          </View>

          {/* ── ACCESOS RÁPIDOS GRID ─────────────────────────────────────── */}
          <View style={{ marginBottom: 20 }}>
            <Text style={{ fontWeight: '900', color: '#0F172A', fontSize: 18, letterSpacing: -0.3, marginBottom: 4 }}>⚡ Accesos rápidos</Text>
            <Text style={{ color: '#64748B', fontSize: 12, marginBottom: 14 }}>Todo en un solo lugar</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16, justifyContent: 'space-between' }}>
              {QUICK_ACTIONS.map((a) => (
                <QuickButton key={a.label} icon={a.icon} label={a.label} color={a.color} onPress={() => router.push(a.route as any)} />
              ))}
            </View>
          </View>

          {/* ── BANNER CONTACTOS DE EMERGENCIA ───────────────────────────── */}
          <TouchableOpacity onPress={() => router.push('/(client)/sos' as any)}>
            <View style={{ borderRadius: 20, padding: 18, flexDirection: 'row', alignItems: 'center', gap: 14,
              backgroundColor: '#fff', borderWidth: 1, borderColor: '#E2E8F0',
              shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 }}>
              <View style={{ width: 52, height: 52, borderRadius: 99, backgroundColor: `${COLORS.info}15`, alignItems: 'center', justifyContent: 'center' }}>
                <MaterialIcons name="local-phone" size={28} color={COLORS.info} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: '#0F172A', fontWeight: '900', fontSize: 15, letterSpacing: -0.3 }}>Contactos de emergencia</Text>
                <Text style={{ color: '#64748B', fontSize: 12, marginTop: 3 }}>
                  SEMAR · Cruz Roja · Capitanía de Puerto
                </Text>
              </View>
              <MaterialIcons name="chevron-right" size={22} color="#CBD5E1" />
            </View>
          </TouchableOpacity>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

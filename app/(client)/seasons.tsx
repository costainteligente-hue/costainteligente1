import React, { useState, useEffect } from 'react';
import {
  ScrollView, View, Text, TouchableOpacity, Image,
  ImageBackground, Dimensions,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, MONTH_NAMES } from '@/lib/constants';
import { InfoBox } from '@/components/ui/InfoBox';

const { width: SCREEN_W } = Dimensions.get('window');
const CARD_W = SCREEN_W * 0.62;

// ─── Wikimedia photo cache ────────────────────────────────────────────────────
const photoCache: Record<string, string | null> = {};
async function fetchPhoto(term: string): Promise<string | null> {
  if (term in photoCache) return photoCache[term];
  try {
    const res  = await fetch(`https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(term)}&prop=pageimages&format=json&pithumbsize=600&origin=*`);
    const data = await res.json();
    const page = Object.values(data?.query?.pages ?? {})[0] as any;
    const url  = page?.thumbnail?.source ?? null;
    photoCache[term] = url;
    return url;
  } catch { photoCache[term] = null; return null; }
}

// ─── Datos enriquecidos de especies ──────────────────────────────────────────
interface SpeciesInfo {
  name: string;
  wikimedia: string;       // término de búsqueda en Wikipedia
  weight: string;          // peso promedio de captura
  technique: string;       // técnica recomendada
  emoji: string;
}

const SPECIES_INFO: Record<string, SpeciesInfo> = {
  'Pez vela':            { name: 'Pez vela',            wikimedia: 'Atlantic sailfish',        weight: '20-45 kg', technique: 'Tróleo / carnada viva',    emoji: '🐟' },
  'Marlín azul':         { name: 'Marlín azul',          wikimedia: 'Blue marlin',              weight: '80-200 kg',technique: 'Tróleo de altura',          emoji: '🐋' },
  'Marlín rayado':       { name: 'Marlín rayado',        wikimedia: 'Striped marlin',           weight: '30-90 kg', technique: 'Tróleo / curricán',         emoji: '🐟' },
  'Marlín':              { name: 'Marlín',               wikimedia: 'Marlin fish',              weight: '50-150 kg',technique: 'Tróleo de altura',          emoji: '🐋' },
  'Dorado':              { name: 'Dorado',               wikimedia: 'Mahi-mahi',                weight: '5-20 kg',  technique: 'Curricán / jigging',        emoji: '🐠' },
  'Atún aleta amarilla': { name: 'Atún aleta amarilla',  wikimedia: 'Yellowfin tuna',           weight: '20-80 kg', technique: 'Jigging / curricán',        emoji: '🐟' },
  'Atún':                { name: 'Atún',                 wikimedia: 'Yellowfin tuna',           weight: '20-80 kg', technique: 'Jigging / curricán',        emoji: '🐟' },
  'Wahoo':               { name: 'Wahoo',                wikimedia: 'Wahoo fish',               weight: '10-40 kg', technique: 'Tróleo rápido',             emoji: '🐡' },
  'Sierra':              { name: 'Sierra',               wikimedia: 'Pacific sierra mackerel',  weight: '2-8 kg',   technique: 'Curricán / cuchara',        emoji: '🐟' },
  'Jurel':               { name: 'Jurel',                wikimedia: 'Yellowtail amberjack',     weight: '3-15 kg',  technique: 'Jigging / carnada',         emoji: '🐟' },
  'Robalo':              { name: 'Robalo',               wikimedia: 'Snook fish',               weight: '2-10 kg',  technique: 'Carnada viva / señuelo',    emoji: '🐟' },
  'Huachinango':         { name: 'Huachinango',          wikimedia: 'Red snapper fish',         weight: '1-5 kg',   technique: 'Fondo / carnada',           emoji: '🐡' },
  'Mojarra':             { name: 'Mojarra',              wikimedia: 'Mojarra fish',             weight: '0.5-2 kg', technique: 'Orilla / carnada',          emoji: '🐠' },
  'Pargo':               { name: 'Pargo',                wikimedia: 'Mangrove snapper',         weight: '1-5 kg',   technique: 'Fondo / curricán',          emoji: '🐡' },
  'Mero':                { name: 'Mero',                 wikimedia: 'Goliath grouper',          weight: '5-30 kg',  technique: 'Fondo / carnada viva',      emoji: '🐟' },
};

function getInfo(name: string): SpeciesInfo {
  return SPECIES_INFO[name] ?? { name, wikimedia: name + ' fish', weight: '—', technique: '—', emoji: '🐟' };
}

// ─── Tarjeta de especie grande con foto ──────────────────────────────────────
function SpeciesCard({ name, badge, badgeColor }: { name: string; badge: string; badgeColor: string }) {
  const [photo, setPhoto] = useState<string | null>(null);
  const info = getInfo(name);

  useEffect(() => { fetchPhoto(info.wikimedia).then(setPhoto); }, [info.wikimedia]);

  return (
    <View style={{
      width: CARD_W, borderRadius: 20, overflow: 'hidden', marginRight: 12,
      shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.15, shadowRadius: 14, elevation: 6,
    }}>
      {/* Foto de fondo */}
      <View style={{ height: 180, backgroundColor: `${badgeColor}20` }}>
        {photo
          ? <Image source={{ uri: photo }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
          : <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 52 }}>{info.emoji}</Text>
            </View>
        }
        {/* Gradiente sobre la foto */}
        <LinearGradient
          colors={['transparent', 'rgba(15,23,42,0.85)']}
          style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 90 }}
        />
        {/* Badge arriba */}
        <View style={{ position: 'absolute', top: 12, left: 12, backgroundColor: badgeColor, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 }}>
          <Text style={{ color: '#fff', fontSize: 11, fontWeight: '800' }}>{badge}</Text>
        </View>
        {/* Nombre sobre la foto */}
        <View style={{ position: 'absolute', bottom: 12, left: 14, right: 14 }}>
          <Text style={{ color: '#fff', fontWeight: '900', fontSize: 17, letterSpacing: -0.3 }}>{name}</Text>
        </View>
      </View>

      {/* Info */}
      <View style={{ backgroundColor: '#fff', padding: 14, gap: 8 }}>
        <View style={{ flexDirection: 'row', gap: 16 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: '#94A3B8', fontSize: 10, fontWeight: '700', marginBottom: 2 }}>PESO PROMEDIO</Text>
            <Text style={{ color: '#0F172A', fontWeight: '800', fontSize: 13 }}>{info.weight}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: '#94A3B8', fontSize: 10, fontWeight: '700', marginBottom: 2 }}>TÉCNICA</Text>
            <Text style={{ color: '#0F172A', fontWeight: '800', fontSize: 12 }} numberOfLines={2}>{info.technique}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

// ─── Datos de temporada ───────────────────────────────────────────────────────
const SEASON_DATA: Record<number, {
  probable: string[]; possible: string[]; zones: string[];
  vedas: { species: string; start: string; end: string }[];
  tip: string;
}> = {
  1:  { probable: ['Pez vela', 'Marlín rayado'],          possible: ['Dorado', 'Atún'],          zones: ['Bajo de Chila', 'Morro de Petatlán'],         vedas: [],                                                           tip: 'Enero es excelente para pez vela en aguas cálidas del Pacífico.' },
  2:  { probable: ['Marlín azul', 'Wahoo'],               possible: ['Pez vela', 'Mero'],        zones: ['Punta Ixtapa'],                               vedas: [],                                                           tip: 'Februero trae aguas más claras, ideal para tróleo de altura.' },
  3:  { probable: ['Dorado', 'Atún aleta amarilla'],      possible: ['Marlín', 'Wahoo'],         zones: ['Bajo de Chila'],                              vedas: [{ species: 'Sierra', start: '1 Mar', end: '30 Abr' }],       tip: 'El dorado está en su pico de temporada en aguas offshore.' },
  4:  { probable: ['Sierra', 'Jurel'],                    possible: ['Dorado'],                  zones: ['La Ropa', 'Bahía de Zihuatanejo'],            vedas: [{ species: 'Sierra', start: '1 Mar', end: '30 Abr' }],       tip: 'Abril ideal para pesca costera y de bahía desde orilla.' },
  5:  { probable: ['Pez vela', 'Dorado', 'Marlín azul'], possible: ['Atún', 'Wahoo'],           zones: ['Bajo de Chila', 'Morro de Petatlán'],         vedas: [],                                                           tip: 'Mayo es uno de los mejores meses del año para pesca deportiva.' },
  6:  { probable: ['Pez vela', 'Marlín azul'],            possible: ['Dorado', 'Atún'],          zones: ['Punta Ixtapa', 'Bajo de Chila'],              vedas: [],                                                           tip: 'Temporada alta de verano. Aguas cálidas y actividad máxima.' },
  7:  { probable: ['Pez vela', 'Dorado'],                 possible: ['Marlín', 'Wahoo', 'Atún'], zones: ['Todas las zonas'],                            vedas: [],                                                           tip: 'Julio es el mes pico. Recomendado para salidas de madrugada.' },
  8:  { probable: ['Pez vela', 'Dorado'],                 possible: ['Marlín azul', 'Wahoo'],    zones: ['Bajo de Chila', 'Morro de Petatlán'],         vedas: [],                                                           tip: 'Excelente para paquetes de pesca deportiva con catch and release.' },
  9:  { probable: ['Atún aleta amarilla', 'Pez vela'],    possible: ['Dorado', 'Wahoo'],         zones: ['Punta Ixtapa', 'Morro de Petatlán'],          vedas: [],                                                           tip: 'El atún aleta amarilla se acerca a la costa en septiembre.' },
  10: { probable: ['Pez vela', 'Atún'],                   possible: ['Huachinango', 'Robalo'],   zones: ['La Ropa', 'Bahía de Zihuatanejo'],            vedas: [],                                                           tip: 'Transición de temporada. Buena oportunidad para pesca costera.' },
  11: { probable: ['Huachinango', 'Robalo'],              possible: ['Jurel', 'Sierra'],         zones: ['Bahía de Zihuatanejo', 'La Ropa'],            vedas: [],                                                           tip: 'Noviembre trae las especies costeras más buscadas para consumo.' },
  12: { probable: ['Pez vela', 'Marlín rayado'],          possible: ['Dorado', 'Wahoo'],         zones: ['Bajo de Chila'],                              vedas: [],                                                           tip: 'Diciembre cierra el año con buena actividad de pez vela.' },
};

export default function SeasonsScreen() {
  const currentMonth = new Date().getMonth() + 1;
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const season = SEASON_DATA[selectedMonth];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }} edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>

        {/* Hero header */}
        <LinearGradient colors={['#0F172A', '#0F766E']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={{ padding: 24, paddingBottom: 28 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <View style={{ width: 48, height: 48, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' }}>
              <MaterialIcons name="calendar-month" size={26} color="#fff" />
            </View>
            <View>
              <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: 12, fontWeight: '600' }}>Guía mensual</Text>
              <Text style={{ color: '#fff', fontSize: 20, fontWeight: '900', letterSpacing: -0.3 }}>Temporadas de pesca</Text>
            </View>
          </View>
          <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13, lineHeight: 20 }}>
            Especies, vedas, técnicas y zonas recomendadas para cada mes del año en Zihuatanejo-Ixtapa.
          </Text>
        </LinearGradient>

        <View style={{ padding: 16 }}>
          {/* Selector de mes */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, marginBottom: 20 }}>
            {MONTH_NAMES.map((name, i) => {
              const month = i + 1;
              const active = selectedMonth === month;
              return (
                <TouchableOpacity key={month} onPress={() => setSelectedMonth(month)}
                  style={{ paddingHorizontal: 16, paddingVertical: 9, borderRadius: 999, minWidth: 64, alignItems: 'center',
                    backgroundColor: active ? COLORS.ocean : '#fff', borderWidth: 1.5, borderColor: active ? COLORS.ocean : '#E2E8F0' }}>
                  <Text style={{ fontWeight: '800', color: active ? '#fff' : '#0F172A', fontSize: 13 }}>{name.slice(0, 3)}</Text>
                  {month === currentMonth && (
                    <View style={{ width: 5, height: 5, borderRadius: 99, backgroundColor: active ? 'rgba(255,255,255,0.7)' : COLORS.ocean, marginTop: 3 }} />
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Título del mes */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <View>
              <Text style={{ fontSize: 24, fontWeight: '900', color: '#0F172A', letterSpacing: -0.5 }}>{MONTH_NAMES[selectedMonth - 1]}</Text>
              {selectedMonth === currentMonth && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
                  <View style={{ width: 8, height: 8, borderRadius: 99, backgroundColor: COLORS.success }} />
                  <Text style={{ color: COLORS.success, fontWeight: '700', fontSize: 12 }}>Mes actual</Text>
                </View>
              )}
            </View>
            <View style={{ backgroundColor: `${COLORS.ocean}12`, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 6 }}>
              <Text style={{ color: COLORS.ocean, fontWeight: '800', fontSize: 12 }}>
                {season.probable.length + season.possible.length} especies
              </Text>
            </View>
          </View>

          {/* Veda alert */}
          {season.vedas.length > 0 && (
            <View style={{ backgroundColor: `${COLORS.danger}10`, borderRadius: 16, borderWidth: 1, borderColor: `${COLORS.danger}30`, padding: 16, marginBottom: 16, flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
              <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: `${COLORS.danger}15`, alignItems: 'center', justifyContent: 'center' }}>
                <MaterialIcons name="warning" size={20} color={COLORS.danger} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: '800', color: COLORS.danger, fontSize: 14, marginBottom: 4 }}>⚠ Veda vigente</Text>
                {season.vedas.map((v) => (
                  <Text key={v.species} style={{ color: COLORS.danger, fontSize: 13, lineHeight: 20 }}>
                    <Text style={{ fontWeight: '800' }}>{v.species}</Text> · del {v.start} al {v.end}
                  </Text>
                ))}
              </View>
            </View>
          )}

          {/* Tip del mes */}
          <View style={{ backgroundColor: `${COLORS.info}08`, borderRadius: 14, borderWidth: 1, borderColor: `${COLORS.info}20`, padding: 14, marginBottom: 20, flexDirection: 'row', gap: 10 }}>
            <MaterialIcons name="lightbulb" size={18} color={COLORS.info} style={{ marginTop: 1 }} />
            <Text style={{ flex: 1, color: '#0F172A', fontSize: 13, lineHeight: 19 }}>{season.tip}</Text>
          </View>
        </View>

        {/* Más probables — cards grandes con foto */}
        <View style={{ paddingLeft: 16, marginBottom: 24 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: `${COLORS.success}18`, alignItems: 'center', justifyContent: 'center' }}>
              <MaterialIcons name="star" size={18} color={COLORS.success} />
            </View>
            <View>
              <Text style={{ fontWeight: '900', color: '#0F172A', fontSize: 17 }}>⭐ Más probables</Text>
              <Text style={{ color: '#64748B', fontSize: 12 }}>Alta probabilidad este mes</Text>
            </View>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 16, gap: 0 }}>
            {season.probable.map((s) => <SpeciesCard key={s} name={s} badge="Alta prob." badgeColor={COLORS.success} />)}
          </ScrollView>
        </View>

        {/* Posibles */}
        <View style={{ paddingLeft: 16, marginBottom: 24 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: `${COLORS.info}18`, alignItems: 'center', justifyContent: 'center' }}>
              <MaterialIcons name="star-half" size={18} color={COLORS.info} />
            </View>
            <View>
              <Text style={{ fontWeight: '900', color: '#0F172A', fontSize: 17 }}>🎯 Posibles</Text>
              <Text style={{ color: '#64748B', fontSize: 12 }}>Probabilidad media</Text>
            </View>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 16, gap: 0 }}>
            {season.possible.map((s) => <SpeciesCard key={s} name={s} badge="Media prob." badgeColor={COLORS.info} />)}
          </ScrollView>
        </View>

        {/* Zonas sugeridas */}
        <View style={{ paddingHorizontal: 16, marginBottom: 20 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: `${COLORS.ocean}18`, alignItems: 'center', justifyContent: 'center' }}>
              <MaterialIcons name="place" size={18} color={COLORS.ocean} />
            </View>
            <Text style={{ fontWeight: '900', color: '#0F172A', fontSize: 17 }}>📍 Zonas sugeridas</Text>
          </View>
          <View style={{ gap: 10 }}>
            {season.zones.map((z, i) => (
              <View key={z} style={{ backgroundColor: '#fff', borderRadius: 14, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: '#E2E8F0',
                shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 1 }}>
                <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: `${COLORS.success}15`, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontSize: 16 }}>{['🏖','⛵','🪨','🌊','🐠'][i % 5]}</Text>
                </View>
                <Text style={{ fontWeight: '700', color: '#0F172A', fontSize: 14, flex: 1 }}>{z}</Text>
                <MaterialIcons name="chevron-right" size={18} color="#CBD5E1" />
              </View>
            ))}
          </View>
        </View>

        <View style={{ paddingHorizontal: 16 }}>
          <InfoBox text="Los datos de temporadas se actualizan mensualmente. Las vedas oficiales siguen el calendario de CONAPESCA México." />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

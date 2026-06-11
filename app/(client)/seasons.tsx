import React, { useState } from 'react';
import { ScrollView, View, Text, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, MONTH_NAMES } from '@/lib/constants';
import { CardBox } from '@/components/ui/CardBox';
import { HeaderCard } from '@/components/ui/HeaderCard';
import { InfoBox } from '@/components/ui/InfoBox';

// ─── Seed season data ─────────────────────────────────────────────────────────
const SEASON_DATA: Record<number, {
  probable: string[];
  possible: string[];
  zones: string[];
  vedas: { species: string; start: string; end: string }[];
}> = {
  1: { probable: ['Pez vela', 'Marlín rayado'], possible: ['Dorado', 'Atún'], zones: ['Bajo de Chila', 'Morro de Petatlán'], vedas: [] },
  2: { probable: ['Marlín azul', 'Wahoo'], possible: ['Pez vela', 'Mero'], zones: ['Punta Ixtapa'], vedas: [] },
  3: { probable: ['Dorado', 'Atún aleta amarilla'], possible: ['Marlín', 'Wahoo'], zones: ['Bajo de Chila'], vedas: [{ species: 'Sierra', start: '1 Mar', end: '30 Abr' }] },
  4: { probable: ['Sierra', 'Jurel'], possible: ['Dorado'], zones: ['La Ropa', 'Bahía de Zihuatanejo'], vedas: [{ species: 'Sierra', start: '1 Mar', end: '30 Abr' }] },
  5: { probable: ['Pez vela', 'Dorado', 'Marlín azul'], possible: ['Atún', 'Wahoo'], zones: ['Bajo de Chila', 'Morro de Petatlán'], vedas: [] },
  6: { probable: ['Pez vela', 'Marlín azul'], possible: ['Dorado', 'Atún'], zones: ['Punta Ixtapa', 'Bajo de Chila'], vedas: [] },
  7: { probable: ['Pez vela', 'Dorado'], possible: ['Marlín', 'Wahoo', 'Atún'], zones: ['Todos'], vedas: [] },
  8: { probable: ['Pez vela', 'Dorado'], possible: ['Marlín azul', 'Wahoo'], zones: ['Bajo de Chila', 'Morro de Petatlán'], vedas: [] },
  9: { probable: ['Atún aleta amarilla', 'Pez vela'], possible: ['Dorado', 'Wahoo'], zones: ['Punta Ixtapa', 'Morro de Petatlán'], vedas: [] },
  10: { probable: ['Pez vela', 'Atún'], possible: ['Huachinango', 'Robalo'], zones: ['La Ropa', 'Bahía de Zihuatanejo'], vedas: [] },
  11: { probable: ['Huachinango', 'Robalo'], possible: ['Jurel', 'Sierra'], zones: ['Bahía de Zihuatanejo', 'La Ropa'], vedas: [] },
  12: { probable: ['Pez vela', 'Marlín rayado'], possible: ['Dorado', 'Wahoo'], zones: ['Bajo de Chila'], vedas: [] },
};

export default function SeasonsScreen() {
  const currentMonth = new Date().getMonth() + 1;
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const season = SEASON_DATA[selectedMonth];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
        <HeaderCard
          title="Temporadas de pesca"
          subtitle="Consulta las especies por mes, vedas vigentes y zonas sugeridas."
          icon="calendar-month"
          color={COLORS.ocean}
        />

        {/* Month selector */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, marginBottom: 16 }}
        >
          {MONTH_NAMES.map((name, i) => {
            const month = i + 1;
            const active = selectedMonth === month;
            return (
              <TouchableOpacity
                key={month}
                onPress={() => setSelectedMonth(month)}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 9,
                  borderRadius: 999,
                  backgroundColor: active ? COLORS.ocean : '#fff',
                  borderWidth: 1,
                  borderColor: active ? COLORS.ocean : '#E2E8F0',
                  minWidth: 68,
                  alignItems: 'center',
                }}
              >
                <Text
                  style={{
                    fontWeight: '800',
                    color: active ? '#fff' : '#0F172A',
                    fontSize: 13,
                  }}
                >
                  {name.slice(0, 3)}
                </Text>
                {month === currentMonth && (
                  <View
                    style={{
                      width: 5,
                      height: 5,
                      borderRadius: 99,
                      backgroundColor: active ? 'rgba(255,255,255,0.7)' : COLORS.ocean,
                      marginTop: 3,
                    }}
                  />
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Month title */}
        <Text style={{ fontSize: 20, fontWeight: '800', color: '#0F172A', marginBottom: 12 }}>
          {MONTH_NAMES[selectedMonth - 1]}
          {selectedMonth === currentMonth ? ' · Mes actual' : ''}
        </Text>

        {/* Vedas */}
        {season.vedas.length > 0 && (
          <View
            style={{
              backgroundColor: `${COLORS.danger}12`,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: `${COLORS.danger}30`,
              padding: 14,
              marginBottom: 12,
              flexDirection: 'row',
              alignItems: 'flex-start',
              gap: 10,
            }}
          >
            <MaterialIcons name="warning" size={22} color={COLORS.danger} style={{ marginTop: 1 }} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: '800', color: COLORS.danger, marginBottom: 4 }}>
                Vedas vigentes
              </Text>
              {season.vedas.map((v) => (
                <Text key={v.species} style={{ color: COLORS.danger, fontSize: 13, lineHeight: 20 }}>
                  • <Text style={{ fontWeight: '700' }}>{v.species}</Text> en veda del {v.start} al {v.end}
                </Text>
              ))}
            </View>
          </View>
        )}

        {/* Probable species */}
        <CardBox>
          <View className="flex-row items-center gap-2 mb-3">
            <MaterialIcons name="star" size={20} color={COLORS.caution} />
            <Text style={{ fontWeight: '800', color: '#0F172A', fontSize: 15 }}>Más probables</Text>
          </View>
          <View className="flex-row flex-wrap gap-2">
            {season.probable.map((s) => (
              <View
                key={s}
                style={{
                  backgroundColor: `${COLORS.success}15`,
                  borderRadius: 999,
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderWidth: 1,
                  borderColor: `${COLORS.success}30`,
                }}
              >
                <Text style={{ color: COLORS.success, fontWeight: '700', fontSize: 13 }}>{s}</Text>
              </View>
            ))}
          </View>
        </CardBox>

        {/* Possible species */}
        <CardBox>
          <View className="flex-row items-center gap-2 mb-3">
            <MaterialIcons name="star-half" size={20} color={COLORS.info} />
            <Text style={{ fontWeight: '800', color: '#0F172A', fontSize: 15 }}>Posibles</Text>
          </View>
          <View className="flex-row flex-wrap gap-2">
            {season.possible.map((s) => (
              <View
                key={s}
                style={{
                  backgroundColor: `${COLORS.info}12`,
                  borderRadius: 999,
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderWidth: 1,
                  borderColor: `${COLORS.info}30`,
                }}
              >
                <Text style={{ color: COLORS.info, fontWeight: '700', fontSize: 13 }}>{s}</Text>
              </View>
            ))}
          </View>
        </CardBox>

        {/* Suggested zones */}
        <CardBox>
          <View className="flex-row items-center gap-2 mb-3">
            <MaterialIcons name="place" size={20} color={COLORS.ocean} />
            <Text style={{ fontWeight: '800', color: '#0F172A', fontSize: 15 }}>Zonas sugeridas</Text>
          </View>
          <View className="gap-2">
            {season.zones.map((z) => (
              <View key={z} className="flex-row items-center gap-2">
                <MaterialIcons name="check-circle" size={16} color={COLORS.success} />
                <Text style={{ color: '#0F172A', fontWeight: '600' }}>{z}</Text>
              </View>
            ))}
          </View>
        </CardBox>

        <InfoBox text="Los datos de temporadas se actualizan mensualmente. Las vedas oficiales siguen el calendario de CONAPESCA México." />
      </ScrollView>
    </SafeAreaView>
  );
}

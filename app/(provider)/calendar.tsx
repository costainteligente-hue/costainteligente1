/**
 * CalendarScreen — fiel al PWA
 * Navegador de mes + grid coloreado + leyenda + disponibilidad por servicio
 */
import React, { useState } from 'react';
import { ScrollView, View, Text, TouchableOpacity, Modal } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DayStatus } from '@/types';
import { COLORS, SERVICE_DEFS, MONTH_NAMES, dateKey } from '@/lib/constants';
import { useProviderStore } from '@/stores/providerStore';
import { CardBox } from '@/components/ui/CardBox';
import { HeaderCard } from '@/components/ui/HeaderCard';

const DAY_LABELS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

function dayColor(s: DayStatus) {
  if (s === 'available') return COLORS.success;
  if (s === 'busy')      return COLORS.warning;
  return COLORS.danger;
}
function dayLabel(s: DayStatus) {
  if (s === 'available') return 'Disponible';
  if (s === 'busy')      return 'Ocupado';
  return 'Bloqueado';
}

// ─── Calendar grid ────────────────────────────────────────────────────────────
function CalGrid({ year, month, state: cs, onPress }: {
  year: number; month: number;
  state: Record<number, DayStatus>;
  onPress: (day: number, key: number) => void;
}) {
  const days   = new Date(year, month, 0).getDate();
  const first  = new Date(year, month - 1, 1).getDay();
  const offset = first === 0 ? 6 : first - 1;

  return (
    <View>
      {/* Week header */}
      <View style={{ flexDirection: 'row', marginBottom: 8 }}>
        {DAY_LABELS.map((d) => (
          <Text key={d} style={{ flex: 1, textAlign: 'center', fontWeight: '900', color: 'rgba(15,23,42,0.62)', fontSize: 12 }}>{d}</Text>
        ))}
      </View>
      {/* Day grid */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {Array.from({ length: offset + days }).map((_, i) => {
          if (i < offset) return <View key={`e${i}`} style={{ width: '14.28%', aspectRatio: 1 }} />;
          const day = i - offset + 1;
          const k   = dateKey(year, month, day);
          const s   = cs[k] ?? 'available';
          const c   = dayColor(s);
          return (
            <TouchableOpacity key={k} onPress={() => onPress(day, k)}
              style={{ width: '14.28%', aspectRatio: 1, padding: 2 }}>
              <View style={{ flex: 1, borderRadius: 12, borderWidth: 1, borderColor: c, backgroundColor: `${c}20`, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontWeight: '900', fontSize: 13, color: s === 'available' ? '#0F172A' : c }}>{day}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

// ─── Day status sheet ─────────────────────────────────────────────────────────
function DaySheet({ day, month, year, dayKey: dk, current, onSelect, onClose }: {
  day: number; month: number; year: number; dayKey: number;
  current: DayStatus; onSelect: (k: number, s: DayStatus) => void; onClose: () => void;
}) {
  const opts: { status: DayStatus; label: string; icon: keyof typeof MaterialIcons.glyphMap; color: string }[] = [
    { status: 'available', label: 'Disponible para operar',    icon: 'check-circle', color: COLORS.success },
    { status: 'busy',      label: 'Ocupado todo el día',       icon: 'event-busy',   color: COLORS.warning },
    { status: 'blocked',   label: 'No ofrecer ningún servicio', icon: 'block',        color: COLORS.danger  },
  ];
  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
        <View style={{ width: 42, height: 4, borderRadius: 999, backgroundColor: 'rgba(15,23,42,0.2)', alignSelf: 'center', marginTop: 10, marginBottom: 12 }} />
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 12 }}>
          <Text style={{ fontSize: 18, fontWeight: '900', color: '#0F172A' }}>{`${day} de ${MONTH_NAMES[month - 1]}, ${year}`}</Text>
          <TouchableOpacity onPress={onClose}><MaterialIcons name="close" size={24} color="#0F172A" /></TouchableOpacity>
        </View>
        <View style={{ padding: 16, gap: 8 }}>
          {opts.map((o) => (
            <TouchableOpacity key={o.status} onPress={() => { onSelect(dk, o.status); onClose(); }}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderRadius: 16, backgroundColor: current === o.status ? `${o.color}15` : '#fff', borderWidth: 1, borderColor: current === o.status ? o.color : '#E2E8F0' }}>
              <MaterialIcons name={o.icon} size={24} color={o.color} />
              <Text style={{ flex: 1, fontWeight: '700', color: '#0F172A', fontSize: 15 }}>{o.label}</Text>
              {current === o.status && <MaterialIcons name="check" size={20} color={o.color} />}
            </TouchableOpacity>
          ))}
        </View>
      </SafeAreaView>
    </Modal>
  );
}

export default function CalendarScreen() {
  const { selectedServices } = useProviderStore();
  const now = new Date();
  const [year,  setYear]  = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [cs, setCs]       = useState<Record<number, DayStatus>>({});
  const [sel, setSel]     = useState<{ day: number; key: number } | null>(null);

  const prev = () => month === 1  ? (setMonth(12), setYear(y => y - 1)) : setMonth(m => m - 1);
  const next = () => month === 12 ? (setMonth(1),  setYear(y => y + 1)) : setMonth(m => m + 1);

  const enabledDefs = SERVICE_DEFS.filter((s) => selectedServices.has(s.id));

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }} edges={['top']}>
      {sel && (
        <DaySheet day={sel.day} month={month} year={year} dayKey={sel.key}
          current={cs[sel.key] ?? 'available'}
          onSelect={(k, s) => setCs(p => ({ ...p, [k]: s }))}
          onClose={() => setSel(null)} />
      )}
      <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 100 }}>
        <HeaderCard title="Calendario" subtitle="Bloquea días completos o márcalos como ocupados. Toca un día para cambiar su estado." icon="calendar-month" color={COLORS.info} />

        {/* Month navigator + grid */}
        <CardBox>
          {/* Month nav */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <TouchableOpacity onPress={prev} style={{ width: 42, height: 42, alignItems: 'center', justifyContent: 'center' }}>
              <MaterialIcons name="chevron-left" size={28} color="#0F172A" />
            </TouchableOpacity>
            <Text style={{ fontSize: 17, fontWeight: '800', color: '#0F172A' }}>{MONTH_NAMES[month - 1]} {year}</Text>
            <TouchableOpacity onPress={next} style={{ width: 42, height: 42, alignItems: 'center', justifyContent: 'center' }}>
              <MaterialIcons name="chevron-right" size={28} color="#0F172A" />
            </TouchableOpacity>
          </View>
          <CalGrid year={year} month={month} state={cs} onPress={(d, k) => setSel({ day: d, key: k })} />
        </CardBox>

        {/* Legend */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginBottom: 16 }}>
          {(['available', 'busy', 'blocked'] as DayStatus[]).map((s) => (
            <View key={s} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <View style={{ width: 12, height: 12, borderRadius: 99, backgroundColor: dayColor(s) }} />
              <Text style={{ fontWeight: '850', color: '#0F172A', fontSize: 12 }}>{dayLabel(s)}</Text>
            </View>
          ))}
        </View>

        {/* Per-service availability */}
        <Text style={{ fontWeight: '900', color: '#0F172A', fontSize: 18, marginBottom: 4 }}>Disponibilidad por servicio</Text>
        <Text style={{ color: 'rgba(15,23,42,0.62)', fontSize: 13, marginBottom: 12 }}>Días y horarios que ven los clientes al consultar cada servicio.</Text>
        {enabledDefs.map((def) => (
          <CardBox key={def.id}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{ width: 44, height: 44, borderRadius: 999, backgroundColor: `${def.color}20`, alignItems: 'center', justifyContent: 'center' }}>
                <MaterialIcons name={def.icon as any} size={22} color={def.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: '800', color: '#0F172A' }}>{def.name}</Text>
                <Text style={{ color: 'rgba(15,23,42,0.62)', fontSize: 13, marginTop: 2 }}>Lun · Mié · Vie · Sáb · 08:00–10:00 · 12:00–14:00</Text>
              </View>
              <TouchableOpacity style={{ padding: 6 }}>
                <MaterialIcons name="edit-calendar" size={22} color={COLORS.ocean} />
              </TouchableOpacity>
            </View>
          </CardBox>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

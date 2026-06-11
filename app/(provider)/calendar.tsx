import React, { useState } from 'react';
import {
  ScrollView, View, Text, TouchableOpacity, Modal,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DayStatus } from '@/types';
import { COLORS, SERVICE_DEFS, MONTH_NAMES, dateKey } from '@/lib/constants';
import { useProviderStore } from '@/stores/providerStore';
import { CardBox } from '@/components/ui/CardBox';
import { HeaderCard } from '@/components/ui/HeaderCard';

// ─── Day status colors ────────────────────────────────────────────────────────
function statusColor(s: DayStatus): string {
  if (s === 'available') return COLORS.success;
  if (s === 'busy') return COLORS.warning;
  return COLORS.danger;
}

function statusLabel(s: DayStatus): string {
  if (s === 'available') return 'Disponible';
  if (s === 'busy') return 'Ocupado';
  return 'Bloqueado';
}

// ─── Calendar grid ────────────────────────────────────────────────────────────
function CalendarGrid({
  year,
  month,
  calendarState,
  onDayPress,
}: {
  year: number;
  month: number;
  calendarState: Record<number, DayStatus>;
  onDayPress: (day: number, key: number) => void;
}) {
  const daysInMonth = new Date(year, month, 0).getDate();
  const firstWeekday = new Date(year, month - 1, 1).getDay(); // 0=Sun
  // Convert to Mon-start: Sun(0)->6, Mon(1)->0 ...
  const offset = firstWeekday === 0 ? 6 : firstWeekday - 1;
  const cells = offset + daysInMonth;

  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
      {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((d, i) => (
        <View key={`hd-${i}`} style={{ width: '12.5%', alignItems: 'center' }}>
          <Text style={{ fontWeight: '800', color: '#64748B', fontSize: 11 }}>{d}</Text>
        </View>
      ))}
      {Array.from({ length: cells }).map((_, index) => {
        if (index < offset) {
          return <View key={`empty-${index}`} style={{ width: '12.5%' }} />;
        }
        const day = index - offset + 1;
        const key = dateKey(year, month, day);
        const status = calendarState[key] ?? 'available';
        const color = statusColor(status);
        return (
          <TouchableOpacity
            key={key}
            onPress={() => onDayPress(day, key)}
            style={{
              width: '12.5%',
              aspectRatio: 1,
              borderRadius: 10,
              backgroundColor: `${color}20`,
              borderWidth: 1,
              borderColor: color,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ fontWeight: '800', color: '#0F172A', fontSize: 12 }}>{day}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ─── Day status sheet ─────────────────────────────────────────────────────────
function DayStatusSheet({
  day,
  month,
  year,
  dayKey,
  current,
  onSelect,
  onClose,
}: {
  day: number;
  month: number;
  year: number;
  dayKey: number;
  current: DayStatus;
  onSelect: (key: number, status: DayStatus) => void;
  onClose: () => void;
}) {
  const options: { status: DayStatus; label: string; icon: string; color: string }[] = [
    { status: 'available', label: 'Disponible para operar', icon: 'check-circle', color: COLORS.success },
    { status: 'busy', label: 'Ocupado todo el día', icon: 'event-busy', color: COLORS.warning },
    { status: 'blocked', label: 'No ofrecer ningún servicio', icon: 'block', color: COLORS.danger },
  ];

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
        <View className="flex-row items-center justify-between px-4 pt-4 pb-2">
          <Text style={{ fontSize: 18, fontWeight: '800', color: '#0F172A' }}>
            {`${day} de ${MONTH_NAMES[month - 1]}, ${year}`}
          </Text>
          <TouchableOpacity onPress={onClose}>
            <MaterialIcons name="close" size={24} color="#0F172A" />
          </TouchableOpacity>
        </View>
        <View style={{ padding: 16, gap: 8 }}>
          {options.map((opt) => (
            <TouchableOpacity
              key={opt.status}
              onPress={() => { onSelect(dayKey, opt.status); onClose(); }}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 14,
                padding: 16,
                borderRadius: 16,
                backgroundColor: current === opt.status ? `${opt.color}15` : '#fff',
                borderWidth: 1,
                borderColor: current === opt.status ? opt.color : '#E2E8F0',
              }}
            >
              <MaterialIcons name={opt.icon as any} size={24} color={opt.color} />
              <Text style={{ fontWeight: '700', color: '#0F172A', fontSize: 15 }}>{opt.label}</Text>
              {current === opt.status && (
                <MaterialIcons name="check" size={20} color={opt.color} style={{ marginLeft: 'auto' }} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </SafeAreaView>
    </Modal>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function CalendarScreen() {
  const { selectedServices } = useProviderStore();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [calendarState, setCalendarState] = useState<Record<number, DayStatus>>({});
  const [selectedDay, setSelectedDay] = useState<{ day: number; key: number } | null>(null);

  const prevMonth = () => {
    if (month === 1) { setMonth(12); setYear((y) => y - 1); }
    else setMonth((m) => m - 1);
  };

  const nextMonth = () => {
    if (month === 12) { setMonth(1); setYear((y) => y + 1); }
    else setMonth((m) => m + 1);
  };

  const enabledDefs = SERVICE_DEFS.filter((s) => selectedServices.has(s.id));

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }} edges={['top']}>
      {selectedDay && (
        <DayStatusSheet
          day={selectedDay.day}
          month={month}
          year={year}
          dayKey={selectedDay.key}
          current={calendarState[selectedDay.key] ?? 'available'}
          onSelect={(key, status) => setCalendarState((prev) => ({ ...prev, [key]: status }))}
          onClose={() => setSelectedDay(null)}
        />
      )}

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
        <HeaderCard
          title="Calendario de disponibilidad"
          subtitle="Bloquea días completos o márcalos como ocupados. Toca un día para cambiar su estado."
          icon="calendar-month"
          color={COLORS.success}
        />

        {/* Month navigator */}
        <CardBox>
          <View className="flex-row items-center justify-between mb-4">
            <TouchableOpacity onPress={prevMonth} className="p-2">
              <MaterialIcons name="chevron-left" size={28} color="#0F172A" />
            </TouchableOpacity>
            <Text style={{ fontSize: 17, fontWeight: '800', color: '#0F172A' }}>
              {MONTH_NAMES[month - 1]} {year}
            </Text>
            <TouchableOpacity onPress={nextMonth} className="p-2">
              <MaterialIcons name="chevron-right" size={28} color="#0F172A" />
            </TouchableOpacity>
          </View>

          <CalendarGrid
            year={year}
            month={month}
            calendarState={calendarState}
            onDayPress={(day, key) => setSelectedDay({ day, key })}
          />
        </CardBox>

        {/* Legend */}
        <View className="flex-row gap-4 flex-wrap mb-4">
          {(['available', 'busy', 'blocked'] as DayStatus[]).map((s) => (
            <View key={s} className="flex-row items-center gap-2">
              <View
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: 99,
                  backgroundColor: statusColor(s),
                }}
              />
              <Text style={{ fontWeight: '700', color: '#0F172A', fontSize: 13 }}>
                {statusLabel(s)}
              </Text>
            </View>
          ))}
        </View>

        {/* Per-service availability */}
        <Text style={{ fontWeight: '800', color: '#0F172A', fontSize: 17, marginBottom: 4 }}>
          Disponibilidad por servicio
        </Text>
        <Text style={{ color: '#0F172A99', fontSize: 13, marginBottom: 12 }}>
          Días y horarios que ven los clientes al consultar cada servicio.
        </Text>

        {enabledDefs.map((def) => (
          <CardBox key={def.id}>
            <View className="flex-row items-center gap-3">
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 99,
                  backgroundColor: `${def.color}20`,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <MaterialIcons name={def.icon as any} size={22} color={def.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: '800', color: '#0F172A' }}>{def.name}</Text>
                <Text style={{ color: '#0F172A99', fontSize: 13 }}>
                  Lun · Mié · Vie · Sáb · 08:00-10:00 · 12:00-14:00
                </Text>
              </View>
              <TouchableOpacity className="p-2">
                <MaterialIcons name="edit-calendar" size={22} color={COLORS.ocean} />
              </TouchableOpacity>
            </View>
          </CardBox>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

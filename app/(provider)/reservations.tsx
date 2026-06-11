import React, { useState } from 'react';
import {
  ScrollView, View, Text, TouchableOpacity, Modal,
  TextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Reservation, ReservationStatus } from '@/types';
import { COLORS } from '@/lib/constants';
import { CardBox } from '@/components/ui/CardBox';
import { HeaderCard } from '@/components/ui/HeaderCard';
import { InfoChip } from '@/components/ui/InfoChip';
import { StatusPill } from '@/components/ui/StatusPill';
import { EmptyState } from '@/components/ui/EmptyState';

// ─── Seed reservations ────────────────────────────────────────────────────────
const INITIAL_RESERVATIONS: Reservation[] = [
  {
    id: 'r1',
    clientName: 'Carlos Mendoza',
    serviceName: 'Embarcación verificada',
    serviceId: 'boat',
    date: '18/07/2026',
    hour: '08:00 - 10:00',
    people: 4,
    amount: '$ 4,500 MXN',
    message: 'Solicita salida de pesca por la mañana. Prefiere zona de pez vela.',
    status: 'pending',
  },
  {
    id: 'r2',
    clientName: 'Ana Torres',
    serviceName: 'Restaurante verificado',
    serviceId: 'restaurant',
    date: '16/07/2026',
    hour: '14:00 - 16:00',
    people: 6,
    amount: 'Por confirmar',
    message: 'Reserva para comida familiar, solicita área con vista al mar.',
    status: 'confirmed',
  },
  {
    id: 'r3',
    clientName: 'Jorge Reyes',
    serviceName: 'Guía verificado',
    serviceId: 'guide',
    date: '10/07/2026',
    hour: '07:00 - 09:00',
    people: 2,
    amount: '$ 1,200 MXN',
    message: 'Servicio de guía completado exitosamente.',
    status: 'completed',
  },
  {
    id: 'r4',
    clientName: 'María López',
    serviceName: 'Paquete deportivo verificado',
    serviceId: 'sport',
    date: '22/07/2026',
    hour: '06:00 - 12:00',
    people: 3,
    amount: '$ 6,500 MXN',
    message: 'Solicita paquete premium con equipo incluido.',
    status: 'rescheduled',
  },
];

const STATUS_LABELS: Record<ReservationStatus, string> = {
  pending: 'Solicitud',
  confirmed: 'Confirmada',
  rejected: 'Rechazada',
  rescheduled: 'Reprogramada',
  completed: 'Completada',
  cancelled: 'Cancelada',
};

// ─── Mini stat bar ────────────────────────────────────────────────────────────
function StatsBar({ reservations }: { reservations: Reservation[] }) {
  const counts = [
    { label: 'Solicitudes', count: reservations.filter((r) => r.status === 'pending').length, color: COLORS.warning },
    { label: 'Confirmadas', count: reservations.filter((r) => r.status === 'confirmed').length, color: COLORS.success },
    { label: 'Historial', count: reservations.filter((r) => ['completed', 'rejected', 'cancelled'].includes(r.status)).length, color: COLORS.info },
  ];
  const max = Math.max(...counts.map((c) => c.count), 1);

  return (
    <CardBox>
      <Text style={{ fontWeight: '800', color: '#0F172A', fontSize: 15, marginBottom: 12 }}>
        Resumen de reservaciones
      </Text>
      {counts.map((entry) => (
        <View key={entry.label} style={{ marginBottom: 10 }}>
          <View className="flex-row justify-between mb-1.5">
            <Text style={{ fontWeight: '800', color: '#0F172A', fontSize: 13 }}>{entry.label}</Text>
            <Text style={{ fontWeight: '900', color: '#0F172A' }}>{entry.count}</Text>
          </View>
          <View style={{ height: 10, backgroundColor: '#F1F5F9', borderRadius: 99, overflow: 'hidden' }}>
            <View
              style={{
                width: `${Math.max((entry.count / max) * 100, 4)}%`,
                height: 10,
                backgroundColor: entry.color,
                borderRadius: 99,
              }}
            />
          </View>
        </View>
      ))}
    </CardBox>
  );
}

// ─── Reservation card ─────────────────────────────────────────────────────────
function ReservationCard({
  item,
  onOpen,
  onAccept,
  onReject,
  onComplete,
}: {
  item: Reservation;
  onOpen: () => void;
  onAccept?: () => void;
  onReject?: () => void;
  onComplete?: () => void;
}) {
  return (
    <CardBox>
      <TouchableOpacity onPress={onOpen}>
        <View className="flex-row items-start gap-3">
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: 99,
              backgroundColor: `${COLORS.success}20`,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <MaterialIcons name="event-available" size={22} color={COLORS.success} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontWeight: '800', color: '#0F172A' }}>{item.serviceName}</Text>
            <Text style={{ color: '#0F172A99', fontSize: 13 }}>
              {item.clientName} · {item.date} · {item.hour}
            </Text>
          </View>
          <StatusPill status={STATUS_LABELS[item.status]} />
        </View>
      </TouchableOpacity>
      <View style={{ height: 1, backgroundColor: '#E2E8F0', marginVertical: 12 }} />
      <View className="flex-row flex-wrap gap-2 items-center">
        <InfoChip icon="groups" text={`${item.people} personas`} />
        <InfoChip icon="payments" text={item.amount} />
        <View style={{ flex: 1 }} />
        {onAccept && (
          <TouchableOpacity
            onPress={onAccept}
            className="flex-row items-center gap-1.5 px-3 py-2 rounded-xl"
            style={{ backgroundColor: COLORS.success }}
          >
            <MaterialIcons name="check" size={16} color="#fff" />
            <Text style={{ color: '#fff', fontWeight: '800', fontSize: 13 }}>Confirmar</Text>
          </TouchableOpacity>
        )}
        {onReject && (
          <TouchableOpacity
            onPress={onReject}
            className="flex-row items-center gap-1.5 px-3 py-2 rounded-xl border border-line"
          >
            <MaterialIcons name="close" size={16} color={COLORS.danger} />
            <Text style={{ color: COLORS.danger, fontWeight: '800', fontSize: 13 }}>Rechazar</Text>
          </TouchableOpacity>
        )}
        {onComplete && (
          <TouchableOpacity
            onPress={onComplete}
            className="flex-row items-center gap-1.5 px-3 py-2 rounded-xl"
            style={{ backgroundColor: COLORS.info }}
          >
            <MaterialIcons name="done-all" size={16} color="#fff" />
            <Text style={{ color: '#fff', fontWeight: '800', fontSize: 13 }}>Completar</Text>
          </TouchableOpacity>
        )}
      </View>
    </CardBox>
  );
}

// ─── Reservation detail modal ─────────────────────────────────────────────────
function ReservationDetailModal({
  item,
  onClose,
  onAccept,
  onReject,
  onComplete,
}: {
  item: Reservation;
  onClose: () => void;
  onAccept?: () => void;
  onReject?: () => void;
  onComplete?: () => void;
}) {
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);

  const handleReject = () => {
    if (!showRejectInput) { setShowRejectInput(true); return; }
    if (rejectReason.trim().length < 10) return;
    onReject?.();
    onClose();
  };

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
          <View className="flex-row items-center justify-between px-4 pt-4 pb-2">
            <Text style={{ fontSize: 18, fontWeight: '800', color: '#0F172A' }}>
              Detalle de reservación
            </Text>
            <TouchableOpacity onPress={onClose}>
              <MaterialIcons name="close" size={24} color="#0F172A" />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
            <CardBox>
              <Text style={{ fontWeight: '800', fontSize: 17, color: '#0F172A', marginBottom: 12 }}>
                {item.serviceName}
              </Text>
              <View className="gap-2">
                <InfoChip icon="person-outline" text={item.clientName} />
                <InfoChip icon="calendar-month" text={item.date} />
                <InfoChip icon="schedule" text={item.hour} />
                <InfoChip icon="groups" text={`${item.people} personas`} />
                <InfoChip icon="payments" text={item.amount} />
              </View>
              <View style={{ height: 1, backgroundColor: '#E2E8F0', marginVertical: 12 }} />
              <Text style={{ color: '#0F172A99', lineHeight: 20 }}>{item.message}</Text>
            </CardBox>

            {showRejectInput && (
              <CardBox>
                <Text style={{ fontWeight: '700', color: '#0F172A', marginBottom: 8 }}>
                  Motivo del rechazo (mínimo 10 caracteres)
                </Text>
                <TextInput
                  value={rejectReason}
                  onChangeText={setRejectReason}
                  multiline
                  numberOfLines={3}
                  placeholder="Describe el motivo del rechazo..."
                  placeholderTextColor="#94A3B8"
                  style={{
                    backgroundColor: '#F8FAFC',
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: rejectReason.length > 0 && rejectReason.trim().length < 10 ? COLORS.danger : '#E2E8F0',
                    padding: 12,
                    fontSize: 14,
                    color: '#0F172A',
                    textAlignVertical: 'top',
                    minHeight: 80,
                  }}
                />
                {rejectReason.length > 0 && rejectReason.trim().length < 10 && (
                  <Text style={{ color: COLORS.danger, fontSize: 12, marginTop: 4 }}>
                    El motivo debe tener al menos 10 caracteres.
                  </Text>
                )}
              </CardBox>
            )}

            <View className="flex-row flex-wrap gap-3 mt-2">
              {onAccept && (
                <TouchableOpacity
                  onPress={() => { onAccept(); onClose(); }}
                  style={{ flex: 1, backgroundColor: COLORS.success, borderRadius: 14, padding: 14, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6 }}
                >
                  <MaterialIcons name="check" size={18} color="#fff" />
                  <Text style={{ color: '#fff', fontWeight: '800' }}>Confirmar</Text>
                </TouchableOpacity>
              )}
              {onReject && (
                <TouchableOpacity
                  onPress={handleReject}
                  style={{
                    flex: 1,
                    borderRadius: 14,
                    padding: 14,
                    alignItems: 'center',
                    flexDirection: 'row',
                    justifyContent: 'center',
                    gap: 6,
                    borderWidth: 1,
                    borderColor: COLORS.danger,
                    opacity: showRejectInput && rejectReason.trim().length < 10 ? 0.5 : 1,
                  }}
                >
                  <MaterialIcons name="close" size={18} color={COLORS.danger} />
                  <Text style={{ color: COLORS.danger, fontWeight: '800' }}>
                    {showRejectInput ? 'Confirmar rechazo' : 'Rechazar'}
                  </Text>
                </TouchableOpacity>
              )}
              {onComplete && (
                <TouchableOpacity
                  onPress={() => { onComplete(); onClose(); }}
                  style={{ flex: 1, backgroundColor: COLORS.info, borderRadius: 14, padding: 14, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6 }}
                >
                  <MaterialIcons name="done-all" size={18} color="#fff" />
                  <Text style={{ color: '#fff', fontWeight: '800' }}>Completar</Text>
                </TouchableOpacity>
              )}
            </View>
          </ScrollView>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function ReservationsScreen() {
  const [reservations, setReservations] = useState<Reservation[]>(INITIAL_RESERVATIONS);
  const [activeTab, setActiveTab] = useState<0 | 1 | 2>(0);
  const [selected, setSelected] = useState<Reservation | null>(null);

  const updateStatus = (id: string, status: ReservationStatus) => {
    setReservations((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status } : r)),
    );
    setSelected(null);
  };

  const filtered = reservations.filter((r) => {
    if (activeTab === 0) return r.status === 'pending';
    if (activeTab === 1) return r.status === 'confirmed' || r.status === 'rescheduled';
    return ['completed', 'rejected', 'cancelled'].includes(r.status);
  });

  const tabs = [
    { label: 'Solicitudes', icon: 'inbox' as const },
    { label: 'Confirmadas', icon: 'check-circle-outline' as const },
    { label: 'Historial', icon: 'history' as const },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }} edges={['top']}>
      {selected && (
        <ReservationDetailModal
          item={selected}
          onClose={() => setSelected(null)}
          onAccept={selected.status === 'pending' ? () => updateStatus(selected.id, 'confirmed') : undefined}
          onReject={selected.status === 'pending' ? () => updateStatus(selected.id, 'rejected') : undefined}
          onComplete={selected.status === 'confirmed' ? () => updateStatus(selected.id, 'completed') : undefined}
        />
      )}

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
        <HeaderCard
          title="Reservaciones"
          subtitle="Gestiona solicitudes, confirmaciones y el historial de reservas."
          icon="event-available"
          color={COLORS.success}
        />

        <StatsBar reservations={reservations} />

        {/* Tabs */}
        <View
          style={{
            flexDirection: 'row',
            backgroundColor: '#F1F5F9',
            borderRadius: 14,
            padding: 4,
            marginBottom: 16,
            gap: 4,
          }}
        >
          {tabs.map((tab, i) => (
            <TouchableOpacity
              key={tab.label}
              onPress={() => setActiveTab(i as 0 | 1 | 2)}
              style={{
                flex: 1,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 4,
                paddingVertical: 8,
                borderRadius: 12,
                backgroundColor: activeTab === i ? '#fff' : 'transparent',
              }}
            >
              <MaterialIcons
                name={tab.icon}
                size={15}
                color={activeTab === i ? COLORS.ocean : '#64748B'}
              />
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: '700',
                  color: activeTab === i ? COLORS.ocean : '#64748B',
                }}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {filtered.length === 0 ? (
          <EmptyState
            icon="event-busy"
            title="Sin reservaciones"
            message="No hay registros en esta sección."
            buttonLabel="Actualizar"
            onPress={() => {}}
          />
        ) : (
          filtered.map((item) => (
            <ReservationCard
              key={item.id}
              item={item}
              onOpen={() => setSelected(item)}
              onAccept={item.status === 'pending' ? () => updateStatus(item.id, 'confirmed') : undefined}
              onReject={item.status === 'pending' ? () => updateStatus(item.id, 'rejected') : undefined}
              onComplete={item.status === 'confirmed' ? () => updateStatus(item.id, 'completed') : undefined}
            />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

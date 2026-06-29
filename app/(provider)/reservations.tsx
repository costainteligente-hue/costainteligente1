/**
 * ReservationsScreen — fiel al PWA
 * Stats bar + Segment tabs + Search + Cards con acciones inline
 */
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
import { SegmentTabs } from '@/components/ui/SegmentTabs';
import { ChartBar } from '@/components/ui/ChartBar';

const SEED: Reservation[] = [
  { id: 'r1', clientName: 'María Fernanda López', serviceName: 'Embarcación verificada', serviceId: 'boat', date: '15/07/2026', hour: '08:00 - 10:00', people: 4, amount: '4,500 MXN', message: 'Solicita salida de pesca por la mañana. Prefiere zona de pez vela.', status: 'pending' },
  { id: 'r2', clientName: 'Jorge Ramírez Ávila', serviceName: 'Restaurante verificado', serviceId: 'restaurant', date: '16/07/2026', hour: '14:00 - 16:00', people: 6, amount: 'Por confirmar', message: 'Reserva para comida familiar, solicita área con vista al mar.', status: 'confirmed' },
  { id: 'r3', clientName: 'Pedro Castillo Vega', serviceName: 'Guía verificado', serviceId: 'guide', date: '10/07/2026', hour: '07:00 - 09:00', people: 2, amount: '1,200 MXN', message: 'Servicio de guía completado exitosamente.', status: 'completed' },
  { id: 'r4', clientName: 'María López', serviceName: 'Paquete deportivo verificado', serviceId: 'sport', date: '22/07/2026', hour: '06:00 - 12:00', people: 3, amount: '6,500 MXN', message: 'Solicita paquete premium con equipo incluido.', status: 'rescheduled' },
];

const STATUS_LABELS: Record<ReservationStatus, string> = {
  pending: 'Solicitud', confirmed: 'Confirmada', rejected: 'Rechazada',
  rescheduled: 'Reprogramada', completed: 'Finalizada', cancelled: 'Cancelada',
};

// ─── Detail modal ─────────────────────────────────────────────────────────────
function DetailModal({ item, onClose, onAccept, onReject, onComplete }: {
  item: Reservation; onClose: () => void;
  onAccept?: () => void; onReject?: () => void; onComplete?: () => void;
}) {
  const [rejectText, setRejectText] = useState('');
  const [showReject, setShowReject]   = useState(false);

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
          {/* Sheet handle */}
          <View style={{ width: 42, height: 4, borderRadius: 999, backgroundColor: 'rgba(15,23,42,0.2)', alignSelf: 'center', marginTop: 10, marginBottom: 12 }} />
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 12 }}>
            <Text style={{ fontSize: 20, fontWeight: '900', color: '#0F172A' }}>Detalle de reservación</Text>
            <TouchableOpacity onPress={onClose}><MaterialIcons name="close" size={24} color="#0F172A" /></TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
            <CardBox>
              <Text style={{ fontWeight: '800', fontSize: 17, color: '#0F172A', marginBottom: 12 }}>{item.serviceName}</Text>
              <View style={{ gap: 8 }}>
                <InfoChip icon="person-outline" text={item.clientName} />
                <InfoChip icon="calendar-month" text={item.date} />
                <InfoChip icon="schedule" text={item.hour} />
                <InfoChip icon="groups" text={`${item.people} personas`} />
                <InfoChip icon="payments" text={item.amount} />
              </View>
              <View style={{ height: 1, backgroundColor: '#E2E8F0', marginVertical: 12 }} />
              <Text style={{ color: 'rgba(15,23,42,0.62)', lineHeight: 20 }}>{item.message}</Text>
            </CardBox>

            {showReject && (
              <CardBox>
                <Text style={{ fontWeight: '700', color: '#0F172A', marginBottom: 8 }}>Motivo del rechazo (mín. 10 caracteres)</Text>
                <TextInput value={rejectText} onChangeText={setRejectText} multiline numberOfLines={3}
                  placeholder="Describe el motivo del rechazo..." placeholderTextColor="#94A3B8"
                  style={{ backgroundColor: '#F8FAFC', borderRadius: 14, borderWidth: 1, borderColor: rejectText.length > 0 && rejectText.trim().length < 10 ? COLORS.danger : '#E2E8F0', padding: 12, fontSize: 14, color: '#0F172A', textAlignVertical: 'top', minHeight: 80 }} />
                {rejectText.length > 0 && rejectText.trim().length < 10 && (
                  <Text style={{ color: COLORS.danger, fontSize: 12, marginTop: 4 }}>El motivo debe tener al menos 10 caracteres.</Text>
                )}
              </CardBox>
            )}

            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 4 }}>
              {onAccept && (
                <TouchableOpacity onPress={() => { onAccept(); onClose(); }}
                  style={{ flex: 1, backgroundColor: COLORS.success, borderRadius: 14, padding: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  <MaterialIcons name="check" size={18} color="#fff" />
                  <Text style={{ color: '#fff', fontWeight: '800' }}>Confirmar</Text>
                </TouchableOpacity>
              )}
              {onReject && (
                <TouchableOpacity
                  onPress={() => {
                    if (!showReject) { setShowReject(true); return; }
                    if (rejectText.trim().length < 10) return;
                    onReject(); onClose();
                  }}
                  style={{ flex: 1, borderRadius: 14, padding: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderWidth: 1, borderColor: COLORS.danger, opacity: showReject && rejectText.trim().length < 10 ? 0.5 : 1 }}>
                  <MaterialIcons name="close" size={18} color={COLORS.danger} />
                  <Text style={{ color: COLORS.danger, fontWeight: '800' }}>{showReject ? 'Confirmar rechazo' : 'Rechazar'}</Text>
                </TouchableOpacity>
              )}
              {onComplete && (
                <TouchableOpacity onPress={() => { onComplete(); onClose(); }}
                  style={{ flex: 1, backgroundColor: COLORS.info, borderRadius: 14, padding: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  <MaterialIcons name="done-all" size={18} color="#fff" />
                  <Text style={{ color: '#fff', fontWeight: '800' }}>Finalizar</Text>
                </TouchableOpacity>
              )}
            </View>
          </ScrollView>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Reservation card ─────────────────────────────────────────────────────────
function ResCard({ item, onOpen, onAccept, onReject, onComplete }: {
  item: Reservation; onOpen: () => void;
  onAccept?: () => void; onReject?: () => void; onComplete?: () => void;
}) {
  return (
    <CardBox>
      <TouchableOpacity onPress={onOpen} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View style={{ width: 44, height: 44, borderRadius: 999, backgroundColor: `${COLORS.success}20`, alignItems: 'center', justifyContent: 'center' }}>
          <MaterialIcons name="event-available" size={22} color={COLORS.success} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontWeight: '900', color: '#0F172A', fontSize: 15 }}>{item.serviceName}</Text>
          <Text style={{ color: 'rgba(15,23,42,0.62)', fontSize: 13, marginTop: 2 }}>
            {item.clientName} · {item.date} · {item.hour}
          </Text>
        </View>
        <StatusPill status={STATUS_LABELS[item.status]} />
      </TouchableOpacity>

      <View style={{ height: 1, backgroundColor: '#E2E8F0', marginVertical: 12 }} />

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
        <InfoChip icon="groups" text={`${item.people} personas`} />
        <InfoChip icon="payments" text={item.amount} />
        <View style={{ flex: 1 }} />
        {/* Inline actions — Ver completo */}
        <TouchableOpacity onPress={onOpen}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0' }}>
          <MaterialIcons name="open-in-new" size={14} color="#64748B" />
          <Text style={{ color: '#64748B', fontWeight: '800', fontSize: 12 }}>Ver completo</Text>
        </TouchableOpacity>
        {onAccept && (
          <TouchableOpacity onPress={onAccept}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 12, backgroundColor: COLORS.success }}>
            <MaterialIcons name="check" size={14} color="#fff" />
            <Text style={{ color: '#fff', fontWeight: '800', fontSize: 12 }}>Aceptar</Text>
          </TouchableOpacity>
        )}
        {onReject && (
          <TouchableOpacity onPress={onReject}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0' }}>
            <MaterialIcons name="close" size={14} color={COLORS.danger} />
            <Text style={{ color: COLORS.danger, fontWeight: '800', fontSize: 12 }}>Rechazar</Text>
          </TouchableOpacity>
        )}
        {onComplete && (
          <TouchableOpacity onPress={onComplete}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 12, backgroundColor: COLORS.info }}>
            <MaterialIcons name="done-all" size={14} color="#fff" />
            <Text style={{ color: '#fff', fontWeight: '800', fontSize: 12 }}>Finalizar</Text>
          </TouchableOpacity>
        )}
      </View>
    </CardBox>
  );
}

export default function ReservationsScreen() {
  const [items, setItems]     = useState<Reservation[]>(SEED);
  const [tab, setTab]         = useState(0);
  const [query, setQuery]     = useState('');
  const [selected, setSelected] = useState<Reservation | null>(null);

  const update = (id: string, status: ReservationStatus) => {
    setItems((p) => p.map((r) => r.id === id ? { ...r, status } : r));
    setSelected(null);
  };

  const pending   = items.filter((r) => r.status === 'pending').length;
  const confirmed = items.filter((r) => r.status === 'confirmed' || r.status === 'rescheduled').length;
  const history   = items.filter((r) => ['completed', 'rejected', 'cancelled'].includes(r.status)).length;

  const base = items.filter((r) =>
    tab === 0 ? r.status === 'pending'
    : tab === 1 ? r.status === 'confirmed' || r.status === 'rescheduled'
    : ['completed', 'rejected', 'cancelled'].includes(r.status),
  );

  const filtered = query.trim()
    ? base.filter((r) => [r.clientName, r.serviceName, r.date, r.amount].join(' ').toLowerCase().includes(query.toLowerCase()))
    : base;

  const chartData = [
    { label: 'Solicitudes', value: pending,   color: COLORS.warning },
    { label: 'Confirmadas', value: confirmed, color: COLORS.success },
    { label: 'Historial',   value: history,   color: COLORS.info },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }} edges={['top']}>
      {selected && (
        <DetailModal item={selected} onClose={() => setSelected(null)}
          onAccept={selected.status === 'pending' ? () => update(selected.id, 'confirmed') : undefined}
          onReject={selected.status === 'pending' ? () => update(selected.id, 'rejected') : undefined}
          onComplete={selected.status === 'confirmed' || selected.status === 'rescheduled' ? () => update(selected.id, 'completed') : undefined}
        />
      )}
      <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 100 }}>
        <HeaderCard title="Reservaciones" subtitle="Solicitudes con servicio, usuario, fecha, hora, personas, monto y acciones de confirmación." icon="event-available" color={COLORS.success} />

        {/* Stats chart */}
        <CardBox>
          <ChartBar data={chartData} />
        </CardBox>

        {/* Segment */}
        <SegmentTabs tabs={['Solicitudes', 'Confirmadas', 'Historial']} active={tab} onChange={setTab} color={COLORS.success} />

        {/* Search */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#fff', borderRadius: 14, borderWidth: 1, borderColor: '#E2E8F0', paddingHorizontal: 14, marginBottom: 14, height: 48 }}>
          <MaterialIcons name="search" size={18} color="rgba(15,23,42,0.62)" />
          <TextInput value={query} onChangeText={setQuery} placeholder="Buscar por usuario, servicio, fecha o pago"
            placeholderTextColor="#94A3B8" style={{ flex: 1, fontSize: 14, color: '#0F172A' }} />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')}>
              <MaterialIcons name="close" size={18} color="#94A3B8" />
            </TouchableOpacity>
          )}
        </View>

        {/* List */}
        <View style={{ marginTop: 0 }}>
          {filtered.length === 0 ? (
            <EmptyState icon="event-busy" title="Sin reservaciones" message="No hay registros en esta sección." />
          ) : (
            filtered.map((item) => (
              <ResCard key={item.id} item={item}
                onOpen={() => setSelected(item)}
                onAccept={item.status === 'pending' ? () => update(item.id, 'confirmed') : undefined}
                onReject={item.status === 'pending' ? () => update(item.id, 'rejected') : undefined}
                onComplete={item.status === 'confirmed' || item.status === 'rescheduled' ? () => update(item.id, 'completed') : undefined}
              />
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

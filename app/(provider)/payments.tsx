import React, { useState } from 'react';
import { ScrollView, View, Text, TouchableOpacity, Modal } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Payment } from '@/types';
import { COLORS } from '@/lib/constants';
import { CardBox } from '@/components/ui/CardBox';
import { HeaderCard } from '@/components/ui/HeaderCard';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { StatusPill } from '@/components/ui/StatusPill';
import { InfoBox } from '@/components/ui/InfoBox';
import { InfoChip } from '@/components/ui/InfoChip';

const PAYMENTS: Payment[] = [
  { id: 'p1', concept: 'Embarcación verificada – Recorrido corto', clientName: 'Carlos Mendoza', amount: '$ 4,500 MXN', status: 'Pendiente', date: '15/07/2026' },
  { id: 'p2', concept: 'Paquete deportivo – Paquete premium', clientName: 'Ana Torres', amount: '$ 8,000 MXN', status: 'Pagado', date: '12/07/2026' },
  { id: 'p3', concept: 'Guía verificado – Asesoría básica', clientName: 'Jorge Reyes', amount: '$ 1,200 MXN', status: 'Pagado', date: '10/07/2026' },
  { id: 'p4', concept: 'Transporte verificado – Ruta local', clientName: 'María López', amount: '$ 700 MXN', status: 'Fallido', date: '08/07/2026' },
];

interface MetricProps { label: string; value: string; icon: string; color: string }

function MetricCard({ label, value, icon, color }: MetricProps) {
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
        <MaterialIcons name={icon as any} size={20} color={color} />
      </View>
      <Text style={{ fontSize: 22, fontWeight: '800', color: '#0F172A' }}>{value}</Text>
      <Text style={{ fontWeight: '700', color: '#0F172A99', fontSize: 12 }}>{label}</Text>
    </View>
  );
}

function PaymentDetailModal({
  payment,
  onClose,
}: {
  payment: Payment;
  onClose: () => void;
}) {
  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
        <View className="flex-row items-center justify-between px-4 pt-4 pb-2">
          <Text style={{ fontSize: 18, fontWeight: '800', color: '#0F172A' }}>Detalle de pago</Text>
          <TouchableOpacity onPress={onClose}>
            <MaterialIcons name="close" size={24} color="#0F172A" />
          </TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
          <CardBox>
            <Text style={{ fontWeight: '800', fontSize: 16, color: '#0F172A', marginBottom: 12 }}>
              {payment.concept}
            </Text>
            <View className="gap-2 mb-4">
              <InfoChip icon="person-outline" text={payment.clientName} />
              <InfoChip icon="calendar-month" text={payment.date} />
              <InfoChip icon="payments" text={payment.amount} />
            </View>
            <StatusPill status={payment.status} />
          </CardBox>

          {payment.status === 'Pendiente' && (
            <View
              style={{
                backgroundColor: `${COLORS.warning}15`,
                borderRadius: 14,
                padding: 14,
                borderWidth: 1,
                borderColor: `${COLORS.warning}40`,
                marginBottom: 12,
              }}
            >
              <Text style={{ color: COLORS.warning, fontWeight: '700', fontSize: 13 }}>
                Este pago está pendiente. El cliente debe completarlo desde el detalle de su reservación usando el botón "Pagar ahora".
              </Text>
            </View>
          )}

          <InfoBox text="Los pagos son procesados por Mercado Pago. El cobro es iniciado manualmente por el cliente desde la pantalla de su reservación." />
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

export default function PaymentsScreen() {
  const [selected, setSelected] = useState<Payment | null>(null);

  const paid = PAYMENTS.filter((p) => p.status === 'Pagado');
  const pending = PAYMENTS.filter((p) => p.status === 'Pendiente');
  const failed = PAYMENTS.filter((p) => p.status === 'Fallido');

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }} edges={['top']}>
      {selected && (
        <PaymentDetailModal payment={selected} onClose={() => setSelected(null)} />
      )}
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
        <HeaderCard
          title="Pagos"
          subtitle="Historial de cobros, pagos pendientes y comprobantes."
          icon="payments"
          color={COLORS.warning}
        />

        {/* Metrics */}
        <View className="flex-row gap-3 mb-3">
          <MetricCard label="Pendientes" value={`${pending.length}`} icon="hourglass-bottom" color={COLORS.warning} />
          <MetricCard label="Pagados" value={`${paid.length}`} icon="check-circle-outline" color={COLORS.success} />
          <MetricCard label="Fallidos" value={`${failed.length}`} icon="cancel" color={COLORS.danger} />
        </View>

        {/* Total this month */}
        <CardBox>
          <View className="flex-row items-center gap-3">
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
              <MaterialIcons name="account-balance-wallet" size={22} color={COLORS.success} />
            </View>
            <View>
              <Text style={{ fontWeight: '800', color: '#0F172A', fontSize: 18 }}>$ 9,200 MXN</Text>
              <Text style={{ color: '#0F172A99', fontSize: 13 }}>Total pagado este mes</Text>
            </View>
          </View>
        </CardBox>

        <SectionHeader
          title="Movimientos"
          subtitle="Historial de transacciones del mes."
          actionLabel="Exportar"
          actionIcon="download"
          onAction={() => {}}
        />
        <View style={{ height: 10 }} />

        {PAYMENTS.map((p) => (
          <TouchableOpacity key={p.id} onPress={() => setSelected(p)}>
            <CardBox>
              <View className="flex-row items-center gap-3">
                <View
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 99,
                    backgroundColor: `${COLORS.warning}20`,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <MaterialIcons name="payments" size={22} color={COLORS.warning} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: '800', color: '#0F172A' }} numberOfLines={1}>
                    {p.concept}
                  </Text>
                  <Text style={{ color: '#0F172A99', fontSize: 13 }}>
                    {p.clientName} · {p.date}
                  </Text>
                </View>
                <View className="items-end gap-1">
                  <Text style={{ fontWeight: '800', color: '#0F172A', fontSize: 13 }}>{p.amount}</Text>
                  <StatusPill status={p.status} />
                </View>
              </View>
            </CardBox>
          </TouchableOpacity>
        ))}

        <InfoBox text="Para producción se conecta Mercado Pago. El cliente inicia el pago manualmente desde el detalle de su reservación confirmada." />
      </ScrollView>
    </SafeAreaView>
  );
}

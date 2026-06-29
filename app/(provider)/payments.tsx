/**
 * PaymentsScreen — Proveedor
 * Resumen de cobros, historial y configuración de métodos de pago
 */
import React, { useState } from 'react';
import {
  ScrollView, View, Text, TouchableOpacity, Modal,
  TextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '@/lib/constants';
import { CardBox } from '@/components/ui/CardBox';
import { HeaderCard } from '@/components/ui/HeaderCard';
import { InfoBox } from '@/components/ui/InfoBox';
import { StatusPill } from '@/components/ui/StatusPill';

const PAYMENTS = [
  { id: 'p1', desc: 'Reserva embarcación aceptada', user: 'Daniela Sánchez', amount: '4,500 MXN', status: 'Pendiente', date: '15/07/2026' },
  { id: 'p2', desc: 'Paquete pesca deportiva', user: 'Héctor Aguilar', amount: '6,500 MXN', status: 'Pagado', date: '12/07/2026' },
  { id: 'p3', desc: 'Guía de pesca — cita asesoría', user: 'Carlos Mendoza', amount: '1,200 MXN', status: 'Comprobante', date: '10/07/2026' },
];

const STATUS_COLOR: Record<string, string> = {
  Pendiente: COLORS.warning, Pagado: COLORS.success, Comprobante: COLORS.info,
};

function PaymentConfigModal({ bank, clabe, instructions, onSave, onClose }: {
  bank: string; clabe: string; instructions: string;
  onSave: (b: string, c: string, i: string) => void; onClose: () => void;
}) {
  const [b, setB] = useState(bank);
  const [c, setC] = useState(clabe);
  const [i, setI] = useState(instructions);

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12 }}>
            <Text style={{ fontSize: 18, fontWeight: '800', color: '#0F172A' }}>Configurar cobro</Text>
            <TouchableOpacity onPress={onClose}><MaterialIcons name="close" size={24} color="#0F172A" /></TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
            <CardBox>
              {[
                { label: 'Banco o método de cobro', value: b, set: setB, placeholder: 'Ej. BBVA / Transferencia' },
                { label: 'CLABE / cuenta / referencia', value: c, set: setC, placeholder: 'Ej. 012345678901234567', keyboard: 'numeric' as const },
                { label: 'Instrucciones para el usuario', value: i, set: setI, placeholder: 'Ej. Transferir con concepto: nombre del servicio', multiline: true },
              ].map((f) => (
                <View key={f.label} style={{ marginBottom: 14 }}>
                  <Text style={{ fontWeight: '700', color: '#0F172A', fontSize: 13, marginBottom: 6 }}>{f.label}</Text>
                  <TextInput value={f.value} onChangeText={f.set} placeholder={f.placeholder}
                    placeholderTextColor="#94A3B8" keyboardType={f.keyboard ?? 'default'} multiline={f.multiline}
                    style={{ backgroundColor: '#F8FAFC', borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', paddingHorizontal: 12, paddingVertical: 11, fontSize: 14, color: '#0F172A', textAlignVertical: f.multiline ? 'top' : 'center', minHeight: f.multiline ? 80 : undefined }} />
                </View>
              ))}
            </CardBox>
            <TouchableOpacity onPress={() => { onSave(b, c, i); onClose(); }}
              style={{ backgroundColor: COLORS.warning, borderRadius: 14, padding: 14, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8, marginTop: 8 }}>
              <MaterialIcons name="check" size={18} color="#fff" />
              <Text style={{ color: '#fff', fontWeight: '800' }}>Guardar configuración</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export default function PaymentsScreen() {
  const [showConfig, setShowConfig] = useState(false);
  const [bank, setBank]             = useState('');
  const [clabe, setClabe]           = useState('');
  const [instructions, setInstructions] = useState('');

  const pending    = PAYMENTS.filter((p) => p.status === 'Pendiente').length;
  const paid       = PAYMENTS.filter((p) => p.status === 'Pagado').length;
  const vouchers   = PAYMENTS.filter((p) => p.status === 'Comprobante').length;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }} edges={['top']}>
      {showConfig && (
        <PaymentConfigModal bank={bank} clabe={clabe} instructions={instructions}
          onSave={(b, c, i) => { setBank(b); setClabe(c); setInstructions(i); }}
          onClose={() => setShowConfig(false)} />
      )}
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        <HeaderCard title="Pagos" subtitle="Resumen de cobros, pagos pendientes, comprobantes e historial." icon="payments" color={COLORS.warning} />

        {/* Métricas */}
        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
          {[
            { label: 'Pendientes', val: pending, color: COLORS.warning },
            { label: 'Pagados', val: paid, color: COLORS.success },
            { label: 'Comprobantes', val: vouchers, color: COLORS.info },
          ].map((m) => (
            <View key={m.label} style={{ flex: 1, backgroundColor: '#fff', borderRadius: 14, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0' }}>
              <Text style={{ fontSize: 24, fontWeight: '900', color: m.color }}>{m.val}</Text>
              <Text style={{ color: '#64748B', fontSize: 11, fontWeight: '700', marginTop: 2 }}>{m.label}</Text>
            </View>
          ))}
        </View>

        {/* Config de cobro */}
        <TouchableOpacity onPress={() => setShowConfig(true)}
          style={{ backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 16, flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: '#E2E8F0' }}>
          <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: `${COLORS.warning}15`, alignItems: 'center', justifyContent: 'center' }}>
            <MaterialIcons name="account-balance" size={20} color={COLORS.warning} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontWeight: '800', color: '#0F172A', fontSize: 14 }}>
              {bank || 'Configurar método de cobro'}
            </Text>
            <Text style={{ color: '#64748B', fontSize: 12 }}>
              {clabe || 'Agrega tu banco y CLABE para recibir pagos'}
            </Text>
          </View>
          <MaterialIcons name="edit" size={18} color={COLORS.warning} />
        </TouchableOpacity>

        {/* Lista de movimientos */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <Text style={{ fontWeight: '800', color: '#0F172A', fontSize: 16 }}>Movimientos</Text>
          <Text style={{ color: '#64748B', fontSize: 12 }}>{PAYMENTS.length} registros</Text>
        </View>

        {PAYMENTS.map((p) => (
          <CardBox key={p.id}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: `${STATUS_COLOR[p.status]}15`, alignItems: 'center', justifyContent: 'center' }}>
                <MaterialIcons name="payments" size={22} color={STATUS_COLOR[p.status]} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: '800', color: '#0F172A', fontSize: 14 }}>{p.desc}</Text>
                <Text style={{ color: '#64748B', fontSize: 12, marginTop: 1 }}>{p.user} · {p.date}</Text>
              </View>
              <View style={{ alignItems: 'flex-end', gap: 4 }}>
                <Text style={{ fontWeight: '900', color: '#0F172A', fontSize: 15 }}>{p.amount}</Text>
                <StatusPill status={p.status} />
              </View>
            </View>
          </CardBox>
        ))}

        <InfoBox text="Para producción se debe conectar una pasarela como Mercado Pago o Stripe. No se deben guardar datos de tarjetas directamente en la app." />
      </ScrollView>
    </SafeAreaView>
  );
}

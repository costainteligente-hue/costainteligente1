/**
 * PaymentsScreen — fiel al PWA
 * 3 métricas + config cobro + lista movimientos (payment-row)
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
  { id: 'p1', desc: 'Reserva embarcación aceptada', user: 'Daniela Sánchez', amount: '4,500 MXN', status: 'Anticipo pendiente', date: '15/07/2026' },
  { id: 'p2', desc: 'Paquete pesca deportiva',       user: 'Héctor Aguilar',  amount: '6,500 MXN', status: 'Pagado',           date: '12/07/2026' },
  { id: 'p3', desc: 'Guía de pesca — cita asesoría', user: 'Carlos Mendoza',  amount: '1,200 MXN', status: 'Comprobante',      date: '10/07/2026' },
];

// ─── Config modal ─────────────────────────────────────────────────────────────
function ConfigSheet({ bank, clabe, instructions, onSave, onClose }: {
  bank: string; clabe: string; instructions: string;
  onSave: (b: string, c: string, i: string) => void; onClose: () => void;
}) {
  const [b, setB] = useState(bank);
  const [c, setC] = useState(clabe);
  const [i, setI] = useState(instructions);
  const inp = { backgroundColor: '#F8FAFC', borderRadius: 14, borderWidth: 1, borderColor: '#E2E8F0', paddingHorizontal: 14, paddingVertical: 13, fontSize: 15, color: '#0F172A' } as const;

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
          <View style={{ width: 42, height: 4, borderRadius: 999, backgroundColor: 'rgba(15,23,42,0.2)', alignSelf: 'center', marginTop: 10, marginBottom: 12 }} />
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 12 }}>
            <Text style={{ fontSize: 20, fontWeight: '900', color: '#0F172A' }}>Configurar cobro</Text>
            <TouchableOpacity onPress={onClose}><MaterialIcons name="close" size={24} color="#0F172A" /></TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
            <CardBox>
              {[
                { label: 'Banco o método de cobro', val: b, set: setB, ph: 'Ej. BBVA / Transferencia' },
                { label: 'CLABE / cuenta / referencia', val: c, set: setC, ph: 'Ej. 012345678901234567', kb: 'numeric' as const },
                { label: 'Instrucciones para el usuario', val: i, set: setI, ph: 'Ej. Transferir con concepto: nombre del servicio', multi: true },
              ].map((f) => (
                <View key={f.label} style={{ marginBottom: 14 }}>
                  <Text style={{ color: 'rgba(15,23,42,0.62)', fontSize: 12, fontWeight: '850', marginBottom: 8 }}>{f.label}</Text>
                  <TextInput value={f.val} onChangeText={f.set} placeholder={f.ph} placeholderTextColor="#94A3B8"
                    keyboardType={f.kb ?? 'default'} multiline={f.multi}
                    style={[inp, f.multi ? { textAlignVertical: 'top', minHeight: 90 } : {}]} />
                </View>
              ))}
            </CardBox>
            <TouchableOpacity onPress={() => { onSave(b, c, i); onClose(); }}
              style={{ backgroundColor: COLORS.warning, borderRadius: 14, padding: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 4, minHeight: 44 }}>
              <MaterialIcons name="check" size={18} color="#fff" />
              <Text style={{ color: '#fff', fontWeight: '900' }}>Guardar configuración</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export default function PaymentsScreen() {
  const [showCfg, setShowCfg] = useState(false);
  const [bank, setBank]       = useState('');
  const [clabe, setClabe]     = useState('');
  const [instr, setInstr]     = useState('Enviar comprobante desde la reservación para validar el anticipo.');

  const pending   = PAYMENTS.filter((p) => /pendiente/i.test(p.status)).length;
  const paid      = PAYMENTS.filter((p) => /pagado/i.test(p.status)).length;
  const vouchers  = PAYMENTS.filter((p) => /comprobante/i.test(p.status)).length;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }} edges={['top']}>
      {showCfg && (
        <ConfigSheet bank={bank} clabe={clabe} instructions={instr}
          onSave={(b, c, i) => { setBank(b); setClabe(c); setInstr(i); }}
          onClose={() => setShowCfg(false)} />
      )}
      <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 100 }}>
        <HeaderCard title="Pagos" subtitle="Resumen de cobros, pagos pendientes, comprobantes e historial." icon="payments" color={COLORS.warning} />

        {/* Metric grid 3 col */}
        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
          {[
            { label: 'Pendientes',   val: pending,  color: COLORS.warning },
            { label: 'Pagados',      val: paid,     color: COLORS.success },
            { label: 'Comprobantes', val: vouchers, color: COLORS.info },
          ].map((m) => (
            <View key={m.label} style={{ flex: 1, backgroundColor: '#fff', borderRadius: 18, borderWidth: 1, borderColor: '#E2E8F0', padding: 14, minHeight: 90, justifyContent: 'space-between',
              shadowColor: '#0F172A', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.07, shadowRadius: 24, elevation: 2 }}>
              <View style={{ width: 32, height: 32, borderRadius: 999, backgroundColor: `${m.color}20`, alignItems: 'center', justifyContent: 'center' }}>
                <MaterialIcons name="payments" size={16} color={m.color} />
              </View>
              <Text style={{ fontSize: 28, fontWeight: '900', color: '#0F172A' }}>{m.val}</Text>
              <Text style={{ fontWeight: '900', color: '#0F172A', fontSize: 13 }}>{m.label}</Text>
            </View>
          ))}
        </View>

        {/* Config cobro row */}
        <TouchableOpacity onPress={() => setShowCfg(true)}>
          <CardBox>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{ width: 48, height: 48, borderRadius: 999, backgroundColor: `${COLORS.warning}20`, alignItems: 'center', justifyContent: 'center' }}>
                <MaterialIcons name="account-balance" size={22} color={COLORS.warning} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: '900', color: '#0F172A', fontSize: 15 }}>{bank || 'Configurar método de cobro'}</Text>
                <Text style={{ color: 'rgba(15,23,42,0.62)', fontSize: 13, marginTop: 2 }}>{clabe || 'Agrega tu banco y CLABE para recibir pagos'}</Text>
              </View>
              <MaterialIcons name="chevron-right" size={20} color="#CBD5E1" />
            </View>
          </CardBox>
        </TouchableOpacity>

        {/* Movimientos */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <Text style={{ fontWeight: '900', color: '#0F172A', fontSize: 18 }}>Movimientos</Text>
          <Text style={{ color: 'rgba(15,23,42,0.62)', fontSize: 12 }}>{PAYMENTS.length} registros</Text>
        </View>

        {PAYMENTS.map((p) => (
          <CardBox key={p.id}>
            {/* payment-row: auto | 1fr | auto */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{ width: 48, height: 48, borderRadius: 999, backgroundColor: `${COLORS.warning}15`, alignItems: 'center', justifyContent: 'center' }}>
                <MaterialIcons name="payments" size={22} color={COLORS.warning} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: '900', color: '#0F172A', fontSize: 15 }} numberOfLines={1}>{p.desc}</Text>
                <Text style={{ color: 'rgba(15,23,42,0.62)', fontSize: 13, marginTop: 2 }}>{p.user} · {p.date}</Text>
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

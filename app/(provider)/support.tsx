/**
 * SupportScreen — fiel al PWA screenSupport()
 * Formulario: tipo reporte + prioridad + asunto + descripción
 */
import React, { useState } from 'react';
import {
  ScrollView, View, Text, TextInput, TouchableOpacity, Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '@/lib/constants';
import { CardBox } from '@/components/ui/CardBox';
import { HeaderCard } from '@/components/ui/HeaderCard';
import { InfoBox } from '@/components/ui/InfoBox';

const TIPOS = ['Error en la aplicación', 'Duda sobre el panel', 'Conflicto con usuario', 'Problema con pago', 'Problema con reservación', 'Otro'];
const PRIORIDADES = ['Baja', 'Media', 'Alta'];

function Select({ label, options, value, onChange }: {
  label: string; options: string[]; value: string; onChange: (v: string) => void;
}) {
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={{ color: 'rgba(15,23,42,0.62)', fontSize: 12, fontWeight: '850', marginBottom: 8 }}>{label}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {options.map((o) => (
          <TouchableOpacity key={o} onPress={() => onChange(o)}
            style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, borderWidth: 1,
              borderColor: value === o ? COLORS.ocean : '#E2E8F0',
              backgroundColor: value === o ? `${COLORS.ocean}15` : '#F8FAFC' }}>
            <Text style={{ fontWeight: '800', fontSize: 13, color: value === o ? COLORS.ocean : '#0F172A' }}>{o}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

export default function SupportScreen() {
  const [tipo,     setTipo]     = useState(TIPOS[0]);
  const [prio,     setPrio]     = useState('Media');
  const [asunto,   setAsunto]   = useState('');
  const [desc,     setDesc]     = useState('');
  const [sending,  setSending]  = useState(false);

  const inp = { backgroundColor: '#F8FAFC', borderRadius: 14, borderWidth: 1, borderColor: '#E2E8F0', paddingHorizontal: 14, paddingVertical: 13, fontSize: 15, color: '#0F172A' } as const;

  const send = () => {
    if (!asunto.trim()) { Alert.alert('El asunto es obligatorio.'); return; }
    if (desc.trim().length < 20) { Alert.alert('Describe el problema con al menos 20 caracteres.'); return; }
    setSending(true);
    setTimeout(() => {
      setSending(false);
      Alert.alert('Reporte enviado', 'Recibirás respuesta en tu correo registrado.');
      setAsunto(''); setDesc('');
    }, 800);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 100 }}>
        <HeaderCard title="Soporte Costa Inteligente" subtitle="Reporta errores, dudas, conflictos o problemas con pagos y reservaciones." icon="support-agent" color={COLORS.info} />

        <CardBox>
          <Select label="Tipo de reporte" options={TIPOS} value={tipo} onChange={setTipo} />
          <Select label="Prioridad" options={PRIORIDADES} value={prio} onChange={setPrio} />

          <Text style={{ color: 'rgba(15,23,42,0.62)', fontSize: 12, fontWeight: '850', marginBottom: 8 }}>Asunto</Text>
          <TextInput value={asunto} onChangeText={setAsunto} placeholder="Describe brevemente el problema"
            placeholderTextColor="#94A3B8" style={{ ...inp, marginBottom: 12 }} />

          <Text style={{ color: 'rgba(15,23,42,0.62)', fontSize: 12, fontWeight: '850', marginBottom: 8 }}>Describe el problema</Text>
          <TextInput value={desc} onChangeText={setDesc} multiline numberOfLines={5}
            placeholder="Explica el problema con detalle: qué hiciste, qué pasó, qué esperabas..." placeholderTextColor="#94A3B8"
            style={{ ...inp, textAlignVertical: 'top', minHeight: 96, marginBottom: 4 }} />
          <Text style={{ color: '#94A3B8', fontSize: 11, textAlign: 'right', marginBottom: 4 }}>{desc.length}/1000</Text>
        </CardBox>

        <TouchableOpacity onPress={send} disabled={sending}
          style={{ backgroundColor: sending ? '#94A3B8' : COLORS.info, borderRadius: 14, padding: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 44, marginBottom: 8 }}>
          <MaterialIcons name="send" size={18} color="#fff" />
          <Text style={{ color: '#fff', fontWeight: '900' }}>{sending ? 'Enviando...' : 'Enviar reporte'}</Text>
        </TouchableOpacity>

        <InfoBox text="Los tickets se registran internamente. Recibirás respuesta en el correo de tu cuenta. Para soporte urgente escribe a soporte@costainteligente.mx." />
      </ScrollView>
    </SafeAreaView>
  );
}

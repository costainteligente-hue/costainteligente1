import React, { useState } from 'react';
import {
  ScrollView, View, Text, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '@/lib/constants';
import { CardBox } from '@/components/ui/CardBox';
import { HeaderCard } from '@/components/ui/HeaderCard';
import { StatusPill } from '@/components/ui/StatusPill';
import { InfoBox } from '@/components/ui/InfoBox';

interface Alert { id: string; type: string; title: string; message: string; sentAt: string; }

const PAST_ALERTS: Alert[] = [
  { id: 'a1', type: 'weather', title: 'Alerta de viento', message: 'Vientos de hasta 55 km/h esperados mañana en la bahía. Se recomienda no salir a mar abierto.', sentAt: '10/07/2026 09:15' },
  { id: 'a2', type: 'veda', title: 'Inicio de veda', message: 'Inicia período de veda para Sierra. Del 1 al 30 de marzo. Favor de respetar la regulación.', sentAt: '01/03/2026 00:01' },
  { id: 'a3', type: 'general', title: 'Mantenimiento programado', message: 'La plataforma estará en mantenimiento el sábado de 02:00 a 04:00 AM hora CDMX.', sentAt: '05/07/2026 18:00' },
];

const TYPE_CONFIG: Record<string, { color: string; icon: keyof typeof MaterialIcons.glyphMap; label: string }> = {
  weather: { color: COLORS.info, icon: 'cloud', label: 'Clima' },
  veda: { color: COLORS.warning, icon: 'warning', label: 'Veda' },
  general: { color: COLORS.ocean, icon: 'notifications', label: 'General' },
};

export default function AlertsScreen() {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState<'weather' | 'veda' | 'general'>('general');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sent, setSent] = useState(false);
  const [alerts, setAlerts] = useState<Alert[]>(PAST_ALERTS);

  const validate = () => {
    const e: Record<string, string> = {};
    if (title.trim().length < 3) e.title = 'El título debe tener al menos 3 caracteres.';
    if (title.trim().length > 100) e.title = 'Máximo 100 caracteres.';
    if (message.trim().length < 10) e.message = 'El mensaje debe tener al menos 10 caracteres.';
    if (message.trim().length > 500) e.message = 'Máximo 500 caracteres.';
    return e;
  };

  const handlePublish = () => {
    const e = validate();
    if (Object.keys(e).length > 0) { setErrors(e); return; }
    const now = new Date();
    const alert: Alert = {
      id: Date.now().toString(),
      type,
      title: title.trim(),
      message: message.trim(),
      sentAt: now.toLocaleString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
    };
    setAlerts((prev) => [alert, ...prev]);
    setTitle('');
    setMessage('');
    setSent(true);
    setTimeout(() => setSent(false), 3000);
    setErrors({});
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }} edges={['top']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
          <HeaderCard title="Alertas y avisos" subtitle="Publica notificaciones push a todos los usuarios." icon="notifications-active" color={COLORS.ocean} />

          {/* Composer */}
          <CardBox>
            <Text style={{ fontWeight: '800', color: '#0F172A', fontSize: 15, marginBottom: 14 }}>Nuevo aviso</Text>

            {/* Type selector */}
            <Text style={{ fontWeight: '700', color: '#0F172A', marginBottom: 8, fontSize: 13 }}>Tipo de alerta</Text>
            <View className="flex-row gap-2 mb-4">
              {(['weather', 'veda', 'general'] as const).map((t) => {
                const cfg = TYPE_CONFIG[t];
                return (
                  <TouchableOpacity
                    key={t}
                    onPress={() => setType(t)}
                    style={{
                      flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4,
                      paddingVertical: 9, borderRadius: 12,
                      backgroundColor: type === t ? cfg.color : '#F1F5F9',
                      borderWidth: 1, borderColor: type === t ? cfg.color : '#E2E8F0',
                    }}
                  >
                    <MaterialIcons name={cfg.icon} size={15} color={type === t ? '#fff' : '#0F172A'} />
                    <Text style={{ fontSize: 12, fontWeight: '800', color: type === t ? '#fff' : '#0F172A' }}>{cfg.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Title */}
            <Text style={{ fontWeight: '700', color: '#0F172A', marginBottom: 6, fontSize: 13 }}>Título (3–100 caracteres)</Text>
            <TextInput
              value={title}
              onChangeText={(v) => { setTitle(v); setErrors((e) => ({ ...e, title: '' })); }}
              placeholder="Título del aviso..."
              placeholderTextColor="#94A3B8"
              style={{
                backgroundColor: '#F8FAFC', borderRadius: 12, borderWidth: 1,
                borderColor: errors.title ? COLORS.danger : '#E2E8F0',
                paddingHorizontal: 12, paddingVertical: 11, fontSize: 14, color: '#0F172A', marginBottom: 4,
              }}
            />
            {errors.title ? <Text style={{ color: COLORS.danger, fontSize: 12, marginBottom: 10 }}>{errors.title}</Text> : <View style={{ height: 12 }} />}

            {/* Message */}
            <Text style={{ fontWeight: '700', color: '#0F172A', marginBottom: 6, fontSize: 13 }}>Mensaje (10–500 caracteres)</Text>
            <TextInput
              value={message}
              onChangeText={(v) => { setMessage(v); setErrors((e) => ({ ...e, message: '' })); }}
              multiline numberOfLines={5} maxLength={500}
              placeholder="Describe el aviso para los usuarios..."
              placeholderTextColor="#94A3B8"
              style={{
                backgroundColor: '#F8FAFC', borderRadius: 12, borderWidth: 1,
                borderColor: errors.message ? COLORS.danger : '#E2E8F0',
                paddingHorizontal: 12, paddingVertical: 11, fontSize: 14, color: '#0F172A',
                textAlignVertical: 'top', minHeight: 110, marginBottom: 4,
              }}
            />
            <Text style={{ color: '#94A3B8', fontSize: 11, textAlign: 'right', marginBottom: errors.message ? 4 : 12 }}>
              {message.length}/500
            </Text>
            {errors.message ? <Text style={{ color: COLORS.danger, fontSize: 12, marginBottom: 12 }}>{errors.message}</Text> : null}

            {sent && (
              <View style={{ backgroundColor: `${COLORS.success}15`, borderRadius: 12, padding: 10, flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <MaterialIcons name="check-circle" size={18} color={COLORS.success} />
                <Text style={{ color: COLORS.success, fontWeight: '700' }}>Aviso publicado y enviado exitosamente.</Text>
              </View>
            )}

            <TouchableOpacity
              onPress={handlePublish}
              style={{ backgroundColor: COLORS.ocean, borderRadius: 14, padding: 14, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 }}
            >
              <MaterialIcons name="send" size={20} color="#fff" />
              <Text style={{ color: '#fff', fontWeight: '800' }}>Publicar y notificar</Text>
            </TouchableOpacity>
          </CardBox>

          {/* History */}
          <Text style={{ fontWeight: '800', color: '#0F172A', fontSize: 15, marginBottom: 10 }}>Historial de avisos</Text>
          {alerts.map((a) => {
            const cfg = TYPE_CONFIG[a.type] ?? TYPE_CONFIG.general;
            return (
              <CardBox key={a.id}>
                <View className="flex-row items-start gap-3">
                  <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: `${cfg.color}20`, alignItems: 'center', justifyContent: 'center' }}>
                    <MaterialIcons name={cfg.icon} size={20} color={cfg.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View className="flex-row items-center gap-2 mb-1">
                      <Text style={{ fontWeight: '800', color: '#0F172A', flex: 1 }}>{a.title}</Text>
                      <StatusPill status={cfg.label} />
                    </View>
                    <Text style={{ color: '#0F172A99', fontSize: 13, lineHeight: 18 }}>{a.message}</Text>
                    <Text style={{ color: '#94A3B8', fontSize: 11, marginTop: 4 }}>{a.sentAt}</Text>
                  </View>
                </View>
              </CardBox>
            );
          })}

          <InfoBox text="Al publicar, la Edge Function send-push-notification envía la notificación a todos los usuarios con token registrado en un plazo máximo de 60 segundos." />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

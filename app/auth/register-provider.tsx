/**
 * RegisterProviderScreen — Costa Inteligente
 */

import React, { useState } from 'react';
import {
  ScrollView, View, Text, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { eq } from 'drizzle-orm';
import { signUp } from '@/lib/services/auth.service';
import { getDb } from '@/lib/db/client';
import { providers } from '@/lib/db/schema';
import { useAuthStore } from '@/stores/authStore';
import { COLORS } from '@/lib/constants';
import { CardBox } from '@/components/ui/CardBox';
import { InfoBox } from '@/components/ui/InfoBox';

interface FormState {
  email: string;
  password: string;
  businessName: string;
  rfc: string;
  phone: string;
  address: string;
}

interface Errors extends Partial<FormState> {}

function validate(form: FormState): Errors {
  const errors: Errors = {};
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const rfcRegex = /^[A-Z&]{3,4}[0-9]{6}[A-Z0-9]{2,3}$/;

  if (!form.email.trim()) errors.email = 'El correo es obligatorio.';
  else if (!emailRegex.test(form.email.trim())) errors.email = 'Ingresa un correo válido.';
  if (form.password.length < 8) errors.password = 'La contraseña debe tener mínimo 8 caracteres.';
  if (form.businessName.trim().length < 3) errors.businessName = 'El nombre debe tener al menos 3 caracteres.';
  if (form.businessName.trim().length > 100) errors.businessName = 'Máximo 100 caracteres.';
  if (!rfcRegex.test(form.rfc.toUpperCase())) errors.rfc = 'RFC inválido. Ej: XAXX010101000';
  if (!/^\d{10}$/.test(form.phone)) errors.phone = 'El teléfono debe tener exactamente 10 dígitos.';
  if (form.address.trim().length < 10) errors.address = 'La dirección debe tener al menos 10 caracteres.';
  if (form.address.trim().length > 200) errors.address = 'Máximo 200 caracteres.';
  return errors;
}

function generateId(): string {
  const bytes = new Uint8Array(16);
  for (let i = 0; i < 16; i++) bytes[i] = Math.floor(Math.random() * 256);
  const hex = Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('');
  return [
    hex.slice(0, 8), hex.slice(8, 12),
    '4' + hex.slice(13, 16),
    ((parseInt(hex[16], 16) & 0x3) | 0x8).toString(16) + hex.slice(17, 20),
    hex.slice(20, 32),
  ].join('-');
}

function Field({
  label, value, onChangeText, error, placeholder, keyboardType, secure, autoCapitalize,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  error?: string;
  placeholder?: string;
  keyboardType?: 'default' | 'email-address' | 'phone-pad';
  secure?: boolean;
  autoCapitalize?: 'none' | 'characters' | 'words';
}) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={{ fontWeight: '700', color: '#0F172A', marginBottom: 6, fontSize: 13 }}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#94A3B8"
        keyboardType={keyboardType ?? 'default'}
        secureTextEntry={secure}
        autoCapitalize={autoCapitalize ?? 'words'}
        style={{
          backgroundColor: '#fff',
          borderRadius: 14,
          borderWidth: 1,
          borderColor: error ? COLORS.danger : '#E2E8F0',
          paddingHorizontal: 14,
          paddingVertical: 12,
          fontSize: 15,
          color: '#0F172A',
        }}
      />
      {error ? <Text style={{ color: COLORS.danger, fontSize: 12, marginTop: 3 }}>{error}</Text> : null}
    </View>
  );
}

export default function RegisterProviderScreen() {
  const router = useRouter();
  const { setLoading: setAuthLoading } = useAuthStore();
  const [form, setForm] = useState<FormState>({
    email: '', password: '', businessName: '', rfc: '', phone: '', address: '',
  });
  const [errors, setErrors] = useState<Errors>({});
  const [loading, setLoading] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);

  const update = (key: keyof FormState) => (value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleRegister = async () => {
    if (!privacyAccepted) {
      setShowPrivacy(true);
      return;
    }
    const errs = validate(form);
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});
    setLoading(true);

    try {
      // 1. Create auth user + profile
      const { session, error: signUpError } = await signUp({
        email: form.email.trim(),
        password: form.password,
        fullName: form.businessName.trim(),
        role: 'provider',
      });

      if (signUpError || !session) {
        setErrors({ email: signUpError ?? 'Error al crear la cuenta.' });
        setLoading(false);
        return;
      }

      // 2. Insert provider record with status: 'pending'
      const db = getDb();
      await db.insert(providers).values({
        id: generateId(),
        userId: session.user.id,
        businessName: form.businessName.trim(),
        serviceType: 'general',
        rfc: form.rfc.toUpperCase().trim(),
        phone: form.phone.trim(),
        address: form.address.trim(),
        status: 'pending',
      });

      setLoading(false);
      router.replace('/auth/pending-approval' as any);
    } catch (err) {
      console.error('[RegisterProvider]', err);
      setErrors({ email: 'Error de red. Verifica tu conexión e intenta de nuevo.' });
      setLoading(false);
    }
  };

  if (showPrivacy) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
        <ScrollView contentContainerStyle={{ padding: 24 }}>
          <Text style={{ fontSize: 20, fontWeight: '800', color: '#0F172A', marginBottom: 16 }}>
            Aviso de Privacidad
          </Text>
          <Text style={{ color: '#0F172A', lineHeight: 22, marginBottom: 12 }}>
            <Text style={{ fontWeight: '800' }}>Responsable:</Text> Costa Inteligente · privacidad@costainteligente.mx
          </Text>
          <Text style={{ color: '#0F172A', lineHeight: 22, marginBottom: 12 }}>
            <Text style={{ fontWeight: '800' }}>Datos recopilados:</Text> nombre, correo, teléfono, RFC, dirección y ubicación GPS (con tu consentimiento).
          </Text>
          <Text style={{ color: '#0F172A', lineHeight: 22, marginBottom: 12 }}>
            <Text style={{ fontWeight: '800' }}>Finalidades:</Text> gestión de cuenta, publicación de servicios, reservaciones, pagos y notificaciones.
          </Text>
          <Text style={{ color: '#0F172A', lineHeight: 22, marginBottom: 12 }}>
            <Text style={{ fontWeight: '800' }}>Transferencias:</Text> Mercado Pago (pagos), Expo (notificaciones push).
          </Text>
          <Text style={{ color: '#0F172A', lineHeight: 22, marginBottom: 20 }}>
            <Text style={{ fontWeight: '800' }}>Derechos ARCO:</Text> acceso, rectificación, cancelación y oposición en privacidad@costainteligente.mx.
          </Text>
          <View className="flex-row gap-3">
            <TouchableOpacity
              onPress={() => setShowPrivacy(false)}
              style={{ flex: 1, borderRadius: 14, borderWidth: 1, borderColor: '#E2E8F0', padding: 13, alignItems: 'center' }}
            >
              <Text style={{ fontWeight: '800' }}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => { setPrivacyAccepted(true); setShowPrivacy(false); handleRegister(); }}
              style={{ flex: 1, backgroundColor: COLORS.ocean, borderRadius: 14, padding: 13, alignItems: 'center' }}
            >
              <Text style={{ color: '#fff', fontWeight: '800' }}>Acepto</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 40 }}>
          <TouchableOpacity onPress={() => router.back()} className="flex-row items-center gap-2 mb-4">
            <MaterialIcons name="arrow-back" size={22} color={COLORS.ocean} />
            <Text style={{ color: COLORS.ocean, fontWeight: '700' }}>Volver</Text>
          </TouchableOpacity>

          <Text style={{ fontSize: 22, fontWeight: '800', color: '#0F172A', marginBottom: 6 }}>
            Registra tu negocio
          </Text>
          <Text style={{ color: '#0F172A99', marginBottom: 20, lineHeight: 20 }}>
            Tu cuenta quedará pendiente de verificación hasta que un administrador la apruebe.
          </Text>

          <CardBox>
            <Text style={{ fontWeight: '800', fontSize: 16, color: '#0F172A', marginBottom: 14 }}>
              Datos del negocio
            </Text>
            <Field label="Correo electrónico" value={form.email} onChangeText={update('email')} error={errors.email} placeholder="correo@negocio.com" keyboardType="email-address" autoCapitalize="none" />
            <Field label="Contraseña" value={form.password} onChangeText={update('password')} error={errors.password} placeholder="Mínimo 8 caracteres" secure autoCapitalize="none" />
            <Field label="Nombre del negocio" value={form.businessName} onChangeText={update('businessName')} error={errors.businessName} placeholder="Ej. Pescadería El Tiburón" />
            <Field label="RFC" value={form.rfc} onChangeText={update('rfc')} error={errors.rfc} placeholder="XAXX010101000" autoCapitalize="characters" />
            <Field label="Teléfono (10 dígitos)" value={form.phone} onChangeText={update('phone')} error={errors.phone} placeholder="7551234567" keyboardType="phone-pad" autoCapitalize="none" />
            <Field label="Dirección completa" value={form.address} onChangeText={update('address')} error={errors.address} placeholder="Calle, colonia, municipio, CP" />
          </CardBox>

          <InfoBox text="Al registrarte, tu cuenta tendrá estado 'Pendiente' hasta la revisión del administrador. Recibirás una notificación push al ser aprobado." />

          <TouchableOpacity
            onPress={handleRegister}
            disabled={loading}
            style={{
              backgroundColor: loading ? '#94A3B8' : COLORS.ocean,
              borderRadius: 14,
              padding: 15,
              alignItems: 'center',
              flexDirection: 'row',
              justifyContent: 'center',
              gap: 8,
              marginTop: 4,
            }}
          >
            {loading ? <ActivityIndicator color="#fff" size="small" /> : <MaterialIcons name="send" size={20} color="#fff" />}
            <Text style={{ color: '#fff', fontWeight: '800', fontSize: 16 }}>
              {loading ? 'Enviando solicitud...' : 'Enviar solicitud de registro'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

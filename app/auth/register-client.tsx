/**
 * RegisterClientScreen — Costa Inteligente
 */

import React, { useState } from 'react';
import {
  ScrollView, View, Text, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { signUp } from '@/lib/services/auth.service';
import { useAuthStore } from '@/stores/authStore';
import { COLORS } from '@/lib/constants';
import { InfoBox } from '@/components/ui/InfoBox';
import { CardBox } from '@/components/ui/CardBox';

export default function RegisterClientScreen() {
  const router = useRouter();
  const { setSession } = useAuthStore();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);

  const validate = () => {
    const e: Record<string, string> = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!fullName.trim() || fullName.trim().length < 2) e.fullName = 'Ingresa tu nombre completo.';
    if (!email.trim()) e.email = 'El correo es obligatorio.';
    else if (!emailRegex.test(email.trim())) e.email = 'Ingresa un correo válido.';
    if (password.length < 8) e.password = 'La contraseña debe tener mínimo 8 caracteres.';
    return e;
  };

  const handleRegister = async () => {
    if (!privacyAccepted) { setShowPrivacy(true); return; }
    const e = validate();
    if (Object.keys(e).length > 0) { setErrors(e); return; }
    setErrors({});
    setLoading(true);

    const { session, error } = await signUp({
      email: email.trim(),
      password,
      fullName: fullName.trim(),
      role: 'client',
    });

    setLoading(false);
    if (error || !session) {
      setErrors({ email: error ?? 'No se pudo completar el registro. Intenta de nuevo.' });
      return;
    }

    setSession(session, 'client');
    router.replace('/(client)' as any);
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
            <Text style={{ fontWeight: '800' }}>Datos recopilados:</Text> nombre, correo, ubicación GPS (con consentimiento explícito) y fotos de capturas.
          </Text>
          <Text style={{ color: '#0F172A', lineHeight: 22, marginBottom: 12 }}>
            <Text style={{ fontWeight: '800' }}>Finalidades:</Text> prestación del servicio, reservaciones, comunidad y notificaciones.
          </Text>
          <Text style={{ color: '#0F172A', lineHeight: 22, marginBottom: 12 }}>
            <Text style={{ fontWeight: '800' }}>Transferencias:</Text> Mercado Pago y Expo (notificaciones push).
          </Text>
          <Text style={{ color: '#0F172A', lineHeight: 22, marginBottom: 20 }}>
            <Text style={{ fontWeight: '800' }}>Derechos ARCO:</Text> privacidad@costainteligente.mx. Retención: mientras la cuenta esté activa.
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
            Crear cuenta
          </Text>
          <Text style={{ color: '#0F172A99', marginBottom: 20 }}>
            Únete como pescador o turista.
          </Text>

          <CardBox>
            {/* Name */}
            <View style={{ marginBottom: 14 }}>
              <Text style={{ fontWeight: '700', color: '#0F172A', marginBottom: 6, fontSize: 13 }}>
                Nombre completo
              </Text>
              <TextInput
                value={fullName}
                onChangeText={(v) => { setFullName(v); setErrors((e) => ({ ...e, fullName: '' })); }}
                placeholder="Tu nombre"
                placeholderTextColor="#94A3B8"
                style={{
                  backgroundColor: '#F8FAFC',
                  borderRadius: 14,
                  borderWidth: 1,
                  borderColor: errors.fullName ? COLORS.danger : '#E2E8F0',
                  paddingHorizontal: 14,
                  paddingVertical: 12,
                  fontSize: 15,
                  color: '#0F172A',
                }}
              />
              {errors.fullName ? (
                <Text style={{ color: COLORS.danger, fontSize: 12, marginTop: 3 }}>{errors.fullName}</Text>
              ) : null}
            </View>

            {/* Email */}
            <View style={{ marginBottom: 14 }}>
              <Text style={{ fontWeight: '700', color: '#0F172A', marginBottom: 6, fontSize: 13 }}>
                Correo electrónico
              </Text>
              <TextInput
                value={email}
                onChangeText={(v) => { setEmail(v); setErrors((e) => ({ ...e, email: '' })); }}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholder="correo@ejemplo.com"
                placeholderTextColor="#94A3B8"
                style={{
                  backgroundColor: '#F8FAFC',
                  borderRadius: 14,
                  borderWidth: 1,
                  borderColor: errors.email ? COLORS.danger : '#E2E8F0',
                  paddingHorizontal: 14,
                  paddingVertical: 12,
                  fontSize: 15,
                  color: '#0F172A',
                }}
              />
              {errors.email ? (
                <Text style={{ color: COLORS.danger, fontSize: 12, marginTop: 3 }}>{errors.email}</Text>
              ) : null}
            </View>

            {/* Password */}
            <View>
              <Text style={{ fontWeight: '700', color: '#0F172A', marginBottom: 6, fontSize: 13 }}>
                Contraseña
              </Text>
              <View style={{ position: 'relative' }}>
                <TextInput
                  value={password}
                  onChangeText={(v) => { setPassword(v); setErrors((e) => ({ ...e, password: '' })); }}
                  secureTextEntry={!showPass}
                  autoCapitalize="none"
                  placeholder="Mínimo 8 caracteres"
                  placeholderTextColor="#94A3B8"
                  style={{
                    backgroundColor: '#F8FAFC',
                    borderRadius: 14,
                    borderWidth: 1,
                    borderColor: errors.password ? COLORS.danger : '#E2E8F0',
                    paddingHorizontal: 14,
                    paddingVertical: 12,
                    paddingRight: 48,
                    fontSize: 15,
                    color: '#0F172A',
                  }}
                />
                <TouchableOpacity
                  onPress={() => setShowPass((v) => !v)}
                  style={{ position: 'absolute', right: 14, top: 12 }}
                >
                  <MaterialIcons name={showPass ? 'visibility-off' : 'visibility'} size={22} color="#94A3B8" />
                </TouchableOpacity>
              </View>
              {errors.password ? (
                <Text style={{ color: COLORS.danger, fontSize: 12, marginTop: 3 }}>{errors.password}</Text>
              ) : null}
            </View>
          </CardBox>

          <InfoBox text="Al registrarte aceptarás nuestro aviso de privacidad conforme a la LFPDPPP. Tus datos se usan para prestación del servicio." />

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
            }}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <MaterialIcons name="person-add" size={20} color="#fff" />
            )}
            <Text style={{ color: '#fff', fontWeight: '800', fontSize: 16 }}>
              {loading ? 'Creando cuenta...' : 'Crear cuenta'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/**
 * ForgotPasswordScreen — Costa Inteligente
 * El usuario ingresa su correo y recibe un link de recuperación.
 */
import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { COLORS } from '@/lib/constants';

const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? '';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail]     = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent]       = useState(false);
  const [error, setError]     = useState('');

  const handleSend = async () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) { setError('Ingresa tu correo electrónico.'); return; }
    if (!emailRegex.test(email.trim())) { setError('Ingresa un correo válido.'); return; }

    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/api/auth/forgot-password`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      // Siempre mostramos éxito aunque el correo no exista (seguridad)
      setSent(true);
    } catch {
      setError('Error de conexión. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
        <View style={{ width: 80, height: 80, borderRadius: 99, backgroundColor: `${COLORS.success}18`, alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
          <MaterialIcons name="mark-email-read" size={40} color={COLORS.success} />
        </View>
        <Text style={{ fontSize: 22, fontWeight: '800', color: '#0F172A', textAlign: 'center', marginBottom: 12 }}>
          Revisa tu correo
        </Text>
        <Text style={{ color: '#64748B', textAlign: 'center', lineHeight: 22, marginBottom: 32 }}>
          Si existe una cuenta con <Text style={{ fontWeight: '800', color: '#0F172A' }}>{email}</Text>, recibirás un enlace para restablecer tu contraseña en los próximos minutos.
        </Text>
        <View style={{ backgroundColor: `${COLORS.info}10`, borderRadius: 14, borderWidth: 1, borderColor: `${COLORS.info}25`, padding: 14, width: '100%', flexDirection: 'row', gap: 10, marginBottom: 32 }}>
          <MaterialIcons name="info-outline" size={18} color={COLORS.info} style={{ marginTop: 1 }} />
          <Text style={{ flex: 1, color: '#64748B', fontSize: 13, lineHeight: 19 }}>
            El enlace expira en 1 hora. Si no ves el correo, revisa tu carpeta de spam.
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => router.replace('/auth/login')}
          style={{ backgroundColor: COLORS.ocean, borderRadius: 14, padding: 15, width: '100%', alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 }}
        >
          <MaterialIcons name="arrow-back" size={18} color="#fff" />
          <Text style={{ color: '#fff', fontWeight: '800', fontSize: 16 }}>Volver al inicio de sesión</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ padding: 24, paddingTop: 40 }}>
          {/* Back */}
          <TouchableOpacity onPress={() => router.back()} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 32 }}>
            <MaterialIcons name="arrow-back" size={22} color={COLORS.ocean} />
            <Text style={{ color: COLORS.ocean, fontWeight: '700' }}>Volver</Text>
          </TouchableOpacity>

          {/* Ícono */}
          <View style={{ width: 72, height: 72, borderRadius: 99, backgroundColor: `${COLORS.ocean}15`, alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
            <MaterialIcons name="lock-reset" size={36} color={COLORS.ocean} />
          </View>

          <Text style={{ fontSize: 26, fontWeight: '800', color: '#0F172A', marginBottom: 8 }}>
            ¿Olvidaste tu contraseña?
          </Text>
          <Text style={{ color: '#64748B', fontSize: 15, lineHeight: 22, marginBottom: 32 }}>
            Ingresa tu correo y te enviaremos un enlace para crear una nueva contraseña.
          </Text>

          {/* Email */}
          <Text style={{ fontWeight: '700', color: '#0F172A', marginBottom: 6, fontSize: 14 }}>Correo electrónico</Text>
          <TextInput
            value={email}
            onChangeText={(v) => { setEmail(v); setError(''); }}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            placeholder="correo@ejemplo.com"
            placeholderTextColor="#94A3B8"
            style={{
              backgroundColor: '#fff', borderRadius: 14, borderWidth: 1,
              borderColor: error ? COLORS.danger : '#E2E8F0',
              paddingHorizontal: 14, paddingVertical: 13, fontSize: 15, color: '#0F172A', marginBottom: 8,
            }}
          />
          {error ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 16 }}>
              <MaterialIcons name="error-outline" size={16} color={COLORS.danger} />
              <Text style={{ color: COLORS.danger, fontSize: 13 }}>{error}</Text>
            </View>
          ) : <View style={{ height: 20 }} />}

          <TouchableOpacity
            onPress={handleSend}
            disabled={loading}
            style={{ backgroundColor: loading ? '#94A3B8' : COLORS.ocean, borderRadius: 14, padding: 15, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 }}
          >
            {loading
              ? <ActivityIndicator color="#fff" size="small" />
              : <MaterialIcons name="send" size={20} color="#fff" />
            }
            <Text style={{ color: '#fff', fontWeight: '800', fontSize: 16 }}>
              {loading ? 'Enviando...' : 'Enviar enlace de recuperación'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

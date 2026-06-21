/**
 * ResetPasswordScreen — Costa Inteligente
 * El usuario llega aquí desde el link del correo con ?token=xxx
 * Ingresa su nueva contraseña y queda actualizada.
 */
import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { COLORS } from '@/lib/constants';

const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? '';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const { token } = useLocalSearchParams<{ token: string }>();

  const [password, setPassword]     = useState('');
  const [confirm, setConfirm]       = useState('');
  const [showPass, setShowPass]     = useState(false);
  const [loading, setLoading]       = useState(false);
  const [done, setDone]             = useState(false);
  const [error, setError]           = useState('');

  const validate = () => {
    if (!token) return 'Token inválido o expirado.';
    if (password.length < 8) return 'La contraseña debe tener mínimo 8 caracteres.';
    if (password !== confirm) return 'Las contraseñas no coinciden.';
    return null;
  };

  const handleReset = async () => {
    const err = validate();
    if (err) { setError(err); return; }

    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/api/auth/reset-password`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ token, newPassword: password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'Error al restablecer contraseña.'); return; }
      setDone(true);
    } catch {
      setError('Error de conexión. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
        <MaterialIcons name="error-outline" size={48} color={COLORS.danger} />
        <Text style={{ fontSize: 18, fontWeight: '800', color: '#0F172A', textAlign: 'center', marginTop: 16, marginBottom: 8 }}>
          Enlace inválido
        </Text>
        <Text style={{ color: '#64748B', textAlign: 'center', marginBottom: 32 }}>
          Este enlace no es válido o ya expiró. Solicita uno nuevo.
        </Text>
        <TouchableOpacity onPress={() => router.replace('/auth/forgot-password')}
          style={{ backgroundColor: COLORS.ocean, borderRadius: 14, padding: 14, width: '100%', alignItems: 'center' }}>
          <Text style={{ color: '#fff', fontWeight: '800' }}>Solicitar nuevo enlace</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (done) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
        <View style={{ width: 80, height: 80, borderRadius: 99, backgroundColor: `${COLORS.success}18`, alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
          <MaterialIcons name="check-circle" size={44} color={COLORS.success} />
        </View>
        <Text style={{ fontSize: 22, fontWeight: '800', color: '#0F172A', textAlign: 'center', marginBottom: 12 }}>
          ¡Contraseña actualizada!
        </Text>
        <Text style={{ color: '#64748B', textAlign: 'center', lineHeight: 22, marginBottom: 32 }}>
          Tu contraseña fue restablecida exitosamente. Ya puedes iniciar sesión con tu nueva contraseña.
        </Text>
        <TouchableOpacity onPress={() => router.replace('/auth/login')}
          style={{ backgroundColor: COLORS.ocean, borderRadius: 14, padding: 15, width: '100%', alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 }}>
          <MaterialIcons name="login" size={18} color="#fff" />
          <Text style={{ color: '#fff', fontWeight: '800', fontSize: 16 }}>Iniciar sesión</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ padding: 24, paddingTop: 40 }}>
          <View style={{ width: 72, height: 72, borderRadius: 99, backgroundColor: `${COLORS.ocean}15`, alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
            <MaterialIcons name="lock-reset" size={36} color={COLORS.ocean} />
          </View>

          <Text style={{ fontSize: 26, fontWeight: '800', color: '#0F172A', marginBottom: 8 }}>Nueva contraseña</Text>
          <Text style={{ color: '#64748B', fontSize: 15, lineHeight: 22, marginBottom: 32 }}>
            Elige una contraseña segura de al menos 8 caracteres.
          </Text>

          {error ? (
            <View style={{ backgroundColor: `${COLORS.danger}12`, borderRadius: 12, borderWidth: 1, borderColor: `${COLORS.danger}35`, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 20 }}>
              <MaterialIcons name="error-outline" size={18} color={COLORS.danger} />
              <Text style={{ color: COLORS.danger, fontSize: 13, flex: 1, fontWeight: '600' }}>{error}</Text>
            </View>
          ) : null}

          {/* Nueva contraseña */}
          <Text style={{ fontWeight: '700', color: '#0F172A', marginBottom: 6, fontSize: 14 }}>Nueva contraseña</Text>
          <View style={{ position: 'relative', marginBottom: 16 }}>
            <TextInput
              value={password} onChangeText={(v) => { setPassword(v); setError(''); }}
              secureTextEntry={!showPass} placeholder="Mínimo 8 caracteres" placeholderTextColor="#94A3B8"
              style={{ backgroundColor: '#fff', borderRadius: 14, borderWidth: 1, borderColor: '#E2E8F0', paddingHorizontal: 14, paddingVertical: 13, paddingRight: 48, fontSize: 15, color: '#0F172A' }}
            />
            <TouchableOpacity onPress={() => setShowPass((v) => !v)} style={{ position: 'absolute', right: 14, top: 14 }}>
              <MaterialIcons name={showPass ? 'visibility-off' : 'visibility'} size={22} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          {/* Confirmar */}
          <Text style={{ fontWeight: '700', color: '#0F172A', marginBottom: 6, fontSize: 14 }}>Confirmar contraseña</Text>
          <TextInput
            value={confirm} onChangeText={(v) => { setConfirm(v); setError(''); }}
            secureTextEntry={!showPass} placeholder="Repite tu contraseña" placeholderTextColor="#94A3B8"
            style={{ backgroundColor: '#fff', borderRadius: 14, borderWidth: 1, borderColor: '#E2E8F0', paddingHorizontal: 14, paddingVertical: 13, fontSize: 15, color: '#0F172A', marginBottom: 28 }}
          />

          <TouchableOpacity onPress={handleReset} disabled={loading}
            style={{ backgroundColor: loading ? '#94A3B8' : COLORS.ocean, borderRadius: 14, padding: 15, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 }}>
            {loading ? <ActivityIndicator color="#fff" size="small" /> : <MaterialIcons name="lock-open" size={20} color="#fff" />}
            <Text style={{ color: '#fff', fontWeight: '800', fontSize: 16 }}>
              {loading ? 'Guardando...' : 'Restablecer contraseña'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

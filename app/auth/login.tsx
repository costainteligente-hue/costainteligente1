/**
 * LoginScreen — Costa Inteligente
 */

import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { signIn } from '@/lib/services/auth.service';
import { useAuthStore } from '@/stores/authStore';
import { COLORS } from '@/lib/constants';

export default function LoginScreen() {
  const router = useRouter();
  const { setSession } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [blockedUntil, setBlockedUntil] = useState<Date | null>(null);

  const isBlocked = blockedUntil && new Date() < blockedUntil;

  const validate = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) return 'Ingresa tu correo electrónico.';
    if (!emailRegex.test(email.trim())) return 'Ingresa un correo válido.';
    if (!password) return 'Ingresa tu contraseña.';
    if (password.length < 8) return 'La contraseña debe tener mínimo 8 caracteres.';
    return null;
  };

  const handleLogin = async () => {
    if (isBlocked) {
      setError('Demasiados intentos fallidos. Intenta de nuevo en 15 minutos.');
      return;
    }
    const err = validate();
    if (err) { setError(err); return; }

    setLoading(true);
    setError('');

    const { session, error: authError } = await signIn({
      email: email.trim(),
      password,
    });

    if (authError || !session) {
      const attempts = failedAttempts + 1;
      setFailedAttempts(attempts);
      if (attempts >= 5) {
        const until = new Date(Date.now() + 15 * 60 * 1000);
        setBlockedUntil(until);
        setError('Demasiados intentos fallidos. Intenta de nuevo en 15 minutos.');
      } else {
        setError(authError ?? 'Error al iniciar sesión.');
      }
      setLoading(false);
      return;
    }

    // Update auth store and redirect based on role
    setSession(session, session.user.role);
    setLoading(false);

    if (session.user.role === 'admin') {
      router.replace('/(admin)' as any);
    } else if (session.user.role === 'provider') {
      router.replace('/(provider)' as any);
    } else {
      router.replace('/(client)' as any);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ padding: 24, paddingTop: 40 }}>
          {/* Logo / hero */}
          <LinearGradient
            colors={['#0F172A', '#0F766E']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ borderRadius: 24, padding: 28, alignItems: 'center', marginBottom: 32 }}
          >
            <MaterialIcons name="sailing" size={52} color="#fff" />
            <Text style={{ color: '#fff', fontSize: 26, fontWeight: '800', marginTop: 12, letterSpacing: -0.5 }}>
              Costa Inteligente
            </Text>
            <Text style={{ color: 'rgba(255,255,255,0.8)', marginTop: 6, fontSize: 14 }}>
              Zihuatanejo · Pesca y turismo
            </Text>
          </LinearGradient>

          <Text style={{ fontSize: 22, fontWeight: '800', color: '#0F172A', marginBottom: 20 }}>
            Iniciar sesión
          </Text>

          {error ? (
            <View
              style={{
                backgroundColor: `${COLORS.danger}15`,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: `${COLORS.danger}40`,
                padding: 12,
                marginBottom: 16,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <MaterialIcons name="error-outline" size={18} color={COLORS.danger} />
              <Text style={{ color: COLORS.danger, fontSize: 13, flex: 1, fontWeight: '600' }}>
                {error}
              </Text>
            </View>
          ) : null}

          {/* Email */}
          <Text style={{ fontWeight: '700', color: '#0F172A', marginBottom: 6, fontSize: 14 }}>
            Correo electrónico
          </Text>
          <TextInput
            value={email}
            onChangeText={(v) => { setEmail(v); setError(''); }}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            placeholder="correo@ejemplo.com"
            placeholderTextColor="#94A3B8"
            style={{
              backgroundColor: '#fff',
              borderRadius: 14,
              borderWidth: 1,
              borderColor: '#E2E8F0',
              paddingHorizontal: 14,
              paddingVertical: 13,
              fontSize: 15,
              color: '#0F172A',
              marginBottom: 16,
            }}
          />

          {/* Password */}
          <Text style={{ fontWeight: '700', color: '#0F172A', marginBottom: 6, fontSize: 14 }}>
            Contraseña
          </Text>
          <View style={{ position: 'relative', marginBottom: 24 }}>
            <TextInput
              value={password}
              onChangeText={(v) => { setPassword(v); setError(''); }}
              secureTextEntry={!showPass}
              autoComplete="password"
              placeholder="Mínimo 8 caracteres"
              placeholderTextColor="#94A3B8"
              style={{
                backgroundColor: '#fff',
                borderRadius: 14,
                borderWidth: 1,
                borderColor: '#E2E8F0',
                paddingHorizontal: 14,
                paddingVertical: 13,
                paddingRight: 48,
                fontSize: 15,
                color: '#0F172A',
              }}
            />
            <TouchableOpacity
              onPress={() => setShowPass((v) => !v)}
              style={{ position: 'absolute', right: 14, top: 14 }}
            >
              <MaterialIcons name={showPass ? 'visibility-off' : 'visibility'} size={22} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            onPress={handleLogin}
            disabled={loading || !!isBlocked}
            style={{
              backgroundColor: loading || isBlocked ? '#94A3B8' : COLORS.ocean,
              borderRadius: 14,
              padding: 15,
              alignItems: 'center',
              flexDirection: 'row',
              justifyContent: 'center',
              gap: 8,
              marginBottom: 16,
            }}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <MaterialIcons name="login" size={20} color="#fff" />
            )}
            <Text style={{ color: '#fff', fontWeight: '800', fontSize: 16 }}>
              {loading ? 'Ingresando...' : 'Entrar'}
            </Text>
          </TouchableOpacity>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <View style={{ flex: 1, height: 1, backgroundColor: '#E2E8F0' }} />
            <Text style={{ color: '#94A3B8', fontWeight: '700' }}>o</Text>
            <View style={{ flex: 1, height: 1, backgroundColor: '#E2E8F0' }} />
          </View>

          {/* Google OAuth — placeholder (requiere backend propio) */}
          <TouchableOpacity
            style={{
              borderRadius: 14,
              borderWidth: 1,
              borderColor: '#E2E8F0',
              backgroundColor: '#fff',
              padding: 13,
              alignItems: 'center',
              flexDirection: 'row',
              justifyContent: 'center',
              gap: 8,
              marginBottom: 24,
            }}
          >
            <MaterialIcons name="account-circle" size={22} color="#4285F4" />
            <Text style={{ fontWeight: '800', color: '#0F172A' }}>Continuar con Google</Text>
          </TouchableOpacity>

          <View className="items-center gap-3">
            <TouchableOpacity onPress={() => router.push('/auth/register-client')}>
              <Text style={{ color: COLORS.ocean, fontWeight: '700' }}>
                ¿No tienes cuenta? <Text style={{ fontWeight: '800' }}>Regístrate como cliente</Text>
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/auth/register-provider')}>
              <Text style={{ color: COLORS.ocean, fontWeight: '700' }}>
                ¿Eres proveedor? <Text style={{ fontWeight: '800' }}>Registra tu negocio</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

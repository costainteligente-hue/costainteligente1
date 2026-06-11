import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { COLORS } from '@/lib/constants';

export default function EmailVerificationScreen() {
  const router = useRouter();
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    // Poll for email confirmation every 3 seconds
    const interval = setInterval(async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user.email_confirmed_at) {
        clearInterval(interval);
        router.replace('/(client)');
      }
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const handleResend = async () => {
    setChecking(true);
    // TODO: supabase.auth.resend({ type: 'signup', email })
    await new Promise((r) => setTimeout(r, 1000));
    setChecking(false);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
      <View
        style={{
          width: 80,
          height: 80,
          borderRadius: 99,
          backgroundColor: `${COLORS.ocean}20`,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 24,
        }}
      >
        <MaterialIcons name="mark-email-unread" size={40} color={COLORS.ocean} />
      </View>

      <Text style={{ fontSize: 22, fontWeight: '800', color: '#0F172A', textAlign: 'center', marginBottom: 12 }}>
        Verifica tu correo
      </Text>
      <Text style={{ color: '#0F172A99', textAlign: 'center', lineHeight: 22, marginBottom: 32 }}>
        Te enviamos un enlace de activación. Ábrelo desde tu correo para activar tu cuenta.{'\n\n'}
        Esta pantalla se actualizará automáticamente al confirmar.
      </Text>

      <ActivityIndicator color={COLORS.ocean} size="large" style={{ marginBottom: 24 }} />

      <TouchableOpacity
        onPress={handleResend}
        disabled={checking}
        style={{
          borderRadius: 14,
          borderWidth: 1,
          borderColor: COLORS.ocean,
          paddingHorizontal: 24,
          paddingVertical: 12,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
        }}
      >
        {checking ? <ActivityIndicator size="small" color={COLORS.ocean} /> : null}
        <Text style={{ color: COLORS.ocean, fontWeight: '800' }}>Reenviar correo</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.replace('/auth/login')} style={{ marginTop: 16 }}>
        <Text style={{ color: '#94A3B8', fontWeight: '700' }}>Volver al inicio de sesión</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

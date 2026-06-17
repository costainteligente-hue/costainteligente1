/**
 * EmailVerificationScreen — Costa Inteligente
 *
 * Con la auth local no se requiere verificación de email por defecto.
 * Esta pantalla queda como placeholder para cuando se implemente.
 * El botón "Entrar" redirige directamente al área de cliente.
 */

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { COLORS } from '@/lib/constants';

export default function EmailVerificationScreen() {
  const router = useRouter();

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
        <MaterialIcons name="mark-email-read" size={40} color={COLORS.ocean} />
      </View>

      <Text style={{ fontSize: 22, fontWeight: '800', color: '#0F172A', textAlign: 'center', marginBottom: 12 }}>
        Cuenta creada
      </Text>
      <Text style={{ color: '#0F172A99', textAlign: 'center', lineHeight: 22, marginBottom: 32 }}>
        Tu cuenta ha sido creada exitosamente. Ya puedes acceder a la plataforma.
      </Text>

      <TouchableOpacity
        onPress={() => router.replace('/(client)' as any)}
        style={{
          backgroundColor: COLORS.ocean,
          borderRadius: 14,
          paddingHorizontal: 32,
          paddingVertical: 14,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <MaterialIcons name="login" size={20} color="#fff" />
        <Text style={{ color: '#fff', fontWeight: '800', fontSize: 16 }}>Entrar a la app</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.replace('/auth/login' as any)} style={{ marginTop: 16 }}>
        <Text style={{ color: '#94A3B8', fontWeight: '700' }}>Volver al inicio de sesión</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

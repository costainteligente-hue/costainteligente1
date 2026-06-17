/**
 * PendingApprovalScreen — Costa Inteligente
 *
 * Mostrado a los proveedores después del registro mientras su cuenta
 * está pendiente de aprobación. Polling cada 10 segundos para detectar aprobación.
 */

import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { eq } from 'drizzle-orm';
import { getDb } from '@/lib/db/client';
import { providers } from '@/lib/db/schema';
import { signOut } from '@/lib/services/auth.service';
import { useAuthStore } from '@/stores/authStore';
import { COLORS } from '@/lib/constants';

export default function PendingApprovalScreen() {
  const router = useRouter();
  const { user, clear } = useAuthStore();

  useEffect(() => {
    if (!user?.id) return;

    // Poll for status changes every 10 seconds
    const interval = setInterval(async () => {
      try {
        const db = getDb();
        const rows = await db
          .select({ status: providers.status })
          .from(providers)
          .where(eq(providers.userId, user.id));
        const provider = rows[0];

        if (provider?.status === 'approved') {
          clearInterval(interval);
          router.replace('/(provider)' as any);
        }
      } catch (err) {
        console.warn('[PendingApproval] Poll error:', err);
      }
    }, 10_000);

    return () => clearInterval(interval);
  }, [user?.id]);

  const handleLogout = async () => {
    await signOut();
    clear();
    router.replace('/auth/login' as any);
  };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: '#F8FAFC', alignItems: 'center', justifyContent: 'center', padding: 32 }}
    >
      <View
        style={{
          width: 90,
          height: 90,
          borderRadius: 99,
          backgroundColor: `${COLORS.warning}20`,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 24,
        }}
      >
        <MaterialIcons name="hourglass-bottom" size={48} color={COLORS.warning} />
      </View>

      <Text style={{ fontSize: 22, fontWeight: '800', color: '#0F172A', textAlign: 'center', marginBottom: 12 }}>
        Cuenta en revisión
      </Text>

      <Text style={{ color: '#0F172A99', textAlign: 'center', lineHeight: 22, marginBottom: 12 }}>
        Tu solicitud de registro ha sido recibida. Un administrador revisará la información
        de tu negocio y recibirás una notificación push cuando sea aprobada.
      </Text>

      <View
        style={{
          backgroundColor: `${COLORS.info}10`,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: `${COLORS.info}30`,
          padding: 16,
          width: '100%',
          marginBottom: 24,
          flexDirection: 'row',
          alignItems: 'flex-start',
          gap: 10,
        }}
      >
        <MaterialIcons name="info-outline" size={20} color={COLORS.info} style={{ marginTop: 1 }} />
        <Text style={{ flex: 1, color: '#0F172A99', fontSize: 13, lineHeight: 20 }}>
          Este proceso puede tomar hasta 24–48 horas hábiles. Esta pantalla se actualizará
          automáticamente cuando tu estado cambie.
        </Text>
      </View>

      <ActivityIndicator color={COLORS.warning} size="large" style={{ marginBottom: 24 }} />

      <TouchableOpacity
        onPress={handleLogout}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          padding: 12,
          borderRadius: 14,
          borderWidth: 1,
          borderColor: '#E2E8F0',
        }}
      >
        <MaterialIcons name="logout" size={18} color="#64748B" />
        <Text style={{ color: '#64748B', fontWeight: '700' }}>Cerrar sesión</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

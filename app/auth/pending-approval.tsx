/**
 * PendingApprovalScreen — Costa Inteligente
 * Mostrado a proveedores pendientes o rechazados.
 * Polling cada 15s para detectar aprobación automáticamente.
 */
import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { signOut } from '@/lib/services/auth.service';
import { useAuthStore } from '@/stores/authStore';
import { COLORS } from '@/lib/constants';

const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? '';

async function checkProviderStatus(userId: string): Promise<'pending' | 'approved' | 'rejected' | null> {
  try {
    if (typeof window !== 'undefined') {
      const res = await fetch(`${API_BASE}/api/auth/provider-status?userId=${userId}`);
      if (!res.ok) return null;
      const data = await res.json();
      return data.status ?? null;
    }
    const { getDb }    = await import('@/lib/db/client');
    const { providers } = await import('@/lib/db/schema');
    const { eq }       = await import('drizzle-orm');
    const rows = await getDb().select({ status: providers.status }).from(providers).where(eq(providers.userId, userId));
    return (rows[0]?.status as any) ?? null;
  } catch { return null; }
}

export default function PendingApprovalScreen() {
  const router = useRouter();
  const { user, clear } = useAuthStore();
  const [status, setStatus] = useState<'pending' | 'rejected' | null>('pending');

  useEffect(() => {
    if (!user?.id) return;

    // Verificar estado inicial
    checkProviderStatus(user.id).then((s) => {
      if (s === 'approved') { router.replace('/(provider)' as any); return; }
      if (s === 'rejected') setStatus('rejected');
    });

    // Polling cada 15 segundos
    const interval = setInterval(async () => {
      const s = await checkProviderStatus(user.id!);
      if (s === 'approved') {
        clearInterval(interval);
        router.replace('/(provider)' as any);
      } else if (s === 'rejected') {
        setStatus('rejected');
      }
    }, 15_000);

    return () => clearInterval(interval);
  }, [user?.id]);

  const handleLogout = async () => {
    await signOut();
    clear();
    router.replace('/auth/login' as any);
  };

  const isRejected = status === 'rejected';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
      {/* Ícono */}
      <View style={{ width: 90, height: 90, borderRadius: 99, backgroundColor: `${isRejected ? COLORS.danger : COLORS.warning}20`, alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
        <MaterialIcons name={isRejected ? 'cancel' : 'hourglass-bottom'} size={48} color={isRejected ? COLORS.danger : COLORS.warning} />
      </View>

      <Text style={{ fontSize: 22, fontWeight: '800', color: '#0F172A', textAlign: 'center', marginBottom: 12 }}>
        {isRejected ? 'Solicitud rechazada' : 'Cuenta en revisión'}
      </Text>

      <Text style={{ color: '#64748B', textAlign: 'center', lineHeight: 22, marginBottom: 16 }}>
        {isRejected
          ? 'Tu solicitud de registro no fue aprobada. Por favor revisa los datos y vuelve a intentarlo, o contacta al soporte.'
          : 'Tu solicitud ha sido recibida. Un administrador revisará la información de tu negocio y recibirás una notificación cuando sea aprobada.'}
      </Text>

      {/* Info box */}
      <View style={{ backgroundColor: `${isRejected ? COLORS.danger : COLORS.info}10`, borderRadius: 16, borderWidth: 1, borderColor: `${isRejected ? COLORS.danger : COLORS.info}30`, padding: 16, width: '100%', marginBottom: 28, flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
        <MaterialIcons name={isRejected ? 'info' : 'info-outline'} size={20} color={isRejected ? COLORS.danger : COLORS.info} style={{ marginTop: 1 }} />
        <Text style={{ flex: 1, color: '#0F172A99', fontSize: 13, lineHeight: 20 }}>
          {isRejected
            ? 'Si crees que fue un error, escríbenos a soporte@costainteligente.mx con tus datos y la documentación requerida.'
            : 'Este proceso puede tomar hasta 24-48 horas hábiles. Esta pantalla se actualizará automáticamente cuando tu estado cambie.'}
        </Text>
      </View>

      {!isRejected && (
        <ActivityIndicator color={COLORS.warning} size="large" style={{ marginBottom: 24 }} />
      )}

      <View style={{ width: '100%', gap: 12 }}>
        {isRejected && (
          <TouchableOpacity
            onPress={() => router.replace('/auth/register-provider' as any)}
            style={{ backgroundColor: COLORS.ocean, borderRadius: 14, padding: 14, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 }}
          >
            <MaterialIcons name="refresh" size={18} color="#fff" />
            <Text style={{ color: '#fff', fontWeight: '800' }}>Volver a registrarse</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          onPress={handleLogout}
          style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 13, borderRadius: 14, borderWidth: 1, borderColor: '#E2E8F0' }}
        >
          <MaterialIcons name="logout" size={18} color="#64748B" />
          <Text style={{ color: '#64748B', fontWeight: '700' }}>Cerrar sesión</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

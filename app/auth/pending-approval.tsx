import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { COLORS } from '@/lib/constants';

/**
 * Shown to providers after registration while their account is pending approval.
 * Also shown if their account was rejected, with a rejection reason.
 * Subscribes via Realtime to providers.status and auto-redirects on approval.
 */
export default function PendingApprovalScreen() {
  const router = useRouter();
  const { user } = useAuthStore();

  useEffect(() => {
    if (!user?.id) return;

    // Subscribe to provider status changes for this user
    const channel = supabase
      .channel(`provider_status_${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'providers',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newStatus = payload.new?.status;
          if (newStatus === 'approved') {
            router.replace('/(provider)');
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace('/auth/login');
  };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: '#F8FAFC', alignItems: 'center', justifyContent: 'center', padding: 32 }}
    >
      {/* Icon */}
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

      {/* Title */}
      <Text
        style={{ fontSize: 22, fontWeight: '800', color: '#0F172A', textAlign: 'center', marginBottom: 12 }}
      >
        Cuenta en revisión
      </Text>

      {/* Description */}
      <Text
        style={{
          color: '#0F172A99',
          textAlign: 'center',
          lineHeight: 22,
          marginBottom: 12,
        }}
      >
        Tu solicitud de registro ha sido recibida. Un administrador revisará la información
        de tu negocio y recibirás una notificación push cuando sea aprobada.
      </Text>

      {/* Info card */}
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

      {/* Spinner */}
      <ActivityIndicator color={COLORS.warning} size="large" style={{ marginBottom: 24 }} />

      {/* Logout */}
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

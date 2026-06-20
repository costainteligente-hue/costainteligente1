import { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';
import { COLORS } from '@/lib/constants';

const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? '';

async function fetchProviderStatus(userId: string): Promise<'pending' | 'approved' | 'rejected' | null> {
  try {
    if (typeof window !== 'undefined') {
      const res = await fetch(`${API_BASE}/api/auth/provider-status?userId=${userId}`);
      if (!res.ok) return null;
      const data = await res.json();
      return data.status ?? null;
    }
    const { getDb } = await import('@/lib/db/client');
    const { providers } = await import('@/lib/db/schema');
    const { eq } = await import('drizzle-orm');
    const db   = getDb();
    const rows = await db.select({ status: providers.status }).from(providers).where(eq(providers.userId, userId));
    return (rows[0]?.status as any) ?? null;
  } catch {
    return null;
  }
}

export default function Index() {
  const { role, user, isLoading } = useAuthStore();
  const [providerStatus, setProviderStatus] = useState<'pending' | 'approved' | 'rejected' | 'checking' | null>(
    role === 'provider' ? 'checking' : null,
  );

  useEffect(() => {
    if (role === 'provider' && user?.id) {
      setProviderStatus('checking');
      fetchProviderStatus(user.id).then((status) => {
        setProviderStatus(status ?? 'pending');
      });
    }
  }, [role, user?.id]);

  if (isLoading || (role === 'provider' && providerStatus === 'checking')) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8FAFC' }}>
        <ActivityIndicator size="large" color={COLORS.ocean} />
      </View>
    );
  }

  if (!role) return <Redirect href="/auth/login" />;
  if (role === 'admin') return <Redirect href="/(admin)" />;

  if (role === 'provider') {
    if (providerStatus === 'approved') return <Redirect href="/(provider)" />;
    if (providerStatus === 'rejected') return <Redirect href="/auth/pending-approval" />;
    // pending o null → pantalla de espera
    return <Redirect href="/auth/pending-approval" />;
  }

  return <Redirect href="/(client)" />;
}

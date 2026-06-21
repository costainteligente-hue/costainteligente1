/**
 * Root Layout — Costa Inteligente
 */

import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator } from 'react-native';
import { QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import '../global.css';
import { initDatabase } from '@/lib/db/client';
import { getSession } from '@/lib/services/auth.service';
import { useAuthStore } from '@/stores/authStore';
import { queryClient } from '@/lib/queryClient';
import { COLORS } from '@/lib/constants';

export default function RootLayout() {
  const { setSession, setLoading } = useAuthStore();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    async function bootstrap() {
      try {
        await initDatabase();
        const { session } = await getSession();
        if (session) {
          setSession(session, session.user.role);
        } else {
          setLoading(false);
        }
      } catch (err) {
        console.error('[App] Bootstrap error:', err);
        setLoading(false);
      } finally {
        setReady(true);
      }
    }
    bootstrap();
  }, []);

  // Renderiza siempre el Stack — la navegación ocurre DENTRO de index.tsx
  // no en el layout, para evitar "navigate before mounting"
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="auth/login" />
          <Stack.Screen name="auth/register-client" />
          <Stack.Screen name="auth/register-provider" />
          <Stack.Screen name="auth/email-verification" />
          <Stack.Screen name="auth/pending-approval" />
          <Stack.Screen name="auth/onboarding" />
          <Stack.Screen name="auth/forgot-password" />
          <Stack.Screen name="auth/reset-password" />
          <Stack.Screen name="(client)" />
          <Stack.Screen name="(provider)" />
          <Stack.Screen name="(admin)" />
        </Stack>
        <StatusBar style="auto" />
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}

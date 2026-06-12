import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import '../global.css';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { UserRole } from '@/types';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 2,
    },
  },
});

export default function RootLayout() {
  const { setSession, setLoading } = useAuthStore();

  useEffect(() => {
    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session) {
          // Get user role from profiles table
          // Use the access token to ensure RLS context is set
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', session.user.id)
            .single();

          // Fallback: read role from user_metadata if profile query fails
          const role = (profile?.role as UserRole)
            ?? (session.user.user_metadata?.role as UserRole)
            ?? 'client';

          setSession(session, role);
        } else {
          setSession(null, null);
        }
      },
    );

    // Check existing session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [setSession, setLoading]);

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
          <Stack.Screen name="(client)" />
          <Stack.Screen name="(provider)" />
          <Stack.Screen name="(admin)" />
        </Stack>
        <StatusBar style="auto" />
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}

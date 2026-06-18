import { View, ActivityIndicator } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';
import { COLORS } from '@/lib/constants';

export default function Index() {
  const { role, isLoading } = useAuthStore();

  // Mientras carga la sesión mostramos spinner
  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8FAFC' }}>
        <ActivityIndicator size="large" color={COLORS.ocean} />
      </View>
    );
  }

  // Redirect es declarativo — no navega antes de que el navigator esté montado
  if (!role) return <Redirect href="/auth/login" />;
  if (role === 'admin') return <Redirect href="/(admin)" />;
  if (role === 'provider') return <Redirect href="/(provider)" />;
  return <Redirect href="/(client)" />;
}

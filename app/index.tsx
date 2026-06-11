import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';
import { COLORS } from '@/lib/constants';

export default function Index() {
  const router = useRouter();
  const { role, isLoading } = useAuthStore();

  useEffect(() => {
    if (isLoading) return;
    if (!role) {
      router.replace('/auth/login');
    } else if (role === 'admin') {
      router.replace('/(admin)');
    } else if (role === 'provider') {
      router.replace('/(provider)');
    } else {
      router.replace('/(client)');
    }
  }, [role, isLoading]);

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8FAFC' }}>
      <ActivityIndicator size="large" color={COLORS.ocean} />
    </View>
  );
}

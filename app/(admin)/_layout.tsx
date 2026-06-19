import { Stack } from 'expo-router';
import { COLORS } from '@/lib/constants';

export default function AdminLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#F8FAFC' },
        headerTitleStyle: { fontWeight: '800', fontSize: 18, color: '#0F172A' },
        headerShadowVisible: false,
        headerTintColor: COLORS.ocean,
      }}
    >
      <Stack.Screen name="index" options={{ headerTitle: 'Panel de administración' }} />
      <Stack.Screen name="verification" options={{ headerTitle: 'Verificación de proveedores' }} />
      <Stack.Screen name="users" options={{ headerTitle: 'Usuarios registrados' }} />
      <Stack.Screen name="zones" options={{ headerTitle: 'Zonas de pesca' }} />
      <Stack.Screen name="reports" options={{ headerTitle: 'Reportes' }} />
      <Stack.Screen name="alerts" options={{ headerTitle: 'Alertas' }} />
      <Stack.Screen name="audit" options={{ headerTitle: 'Logs de auditoría' }} />
    </Stack>
  );
}

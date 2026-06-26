import { Tabs } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS } from '@/lib/constants';

export default function ProviderLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: COLORS.ocean,
        tabBarInactiveTintColor: '#64748B',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopColor: '#E2E8F0',
          height: 68,
          paddingBottom: 10,
        },
        tabBarLabelStyle: { fontWeight: '700', fontSize: 11 },
        headerStyle: { backgroundColor: '#F8FAFC' },
        headerTitleStyle: { fontWeight: '800', fontSize: 18, color: '#0F172A' },
        headerShadowVisible: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inicio',
          tabBarLabel: 'Inicio',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="dashboard" size={size} color={color} />
          ),
          headerTitle: 'Panel del proveedor',
        }}
      />
      <Tabs.Screen
        name="services"
        options={{
          title: 'Servicios',
          tabBarLabel: 'Servicios',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="storefront" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="reservations"
        options={{
          title: 'Reservas',
          tabBarLabel: 'Reservas',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="event-available" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: 'Agenda',
          tabBarLabel: 'Agenda',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="calendar-month" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Ajustes',
          tabBarLabel: 'Ajustes',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="settings" size={size} color={color} />
          ),
        }}
      />
      {/* Hidden routes (accessible via navigation, not tab bar) */}
      <Tabs.Screen name="payments" options={{ href: null, title: 'Pagos' }} />
      <Tabs.Screen name="chat/[reservationId]" options={{ href: null, title: 'Chat' }} />
      <Tabs.Screen name="chat/general" options={{ href: null, title: 'Mensajes' }} />
      <Tabs.Screen name="reviews" options={{ href: null, title: 'Reseñas' }} />
      <Tabs.Screen name="promotions" options={{ href: null, title: 'Promociones' }} />
      <Tabs.Screen name="service-form" options={{ href: null, title: 'Registrar servicio' }} />
    </Tabs>
  );
}

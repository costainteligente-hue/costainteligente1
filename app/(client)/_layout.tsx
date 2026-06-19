import { Tabs } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS } from '@/lib/constants';

export default function ClientLayout() {
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
          tabBarIcon: ({ color, size }) => <MaterialIcons name="home" size={size} color={color} />,
          headerTitle: 'Costa Inteligente',
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: 'Mapa',
          tabBarLabel: 'Mapa',
          tabBarIcon: ({ color, size }) => <MaterialIcons name="map" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="services/index"
        options={{
          title: 'Servicios',
          tabBarLabel: 'Servicios',
          tabBarIcon: ({ color, size }) => <MaterialIcons name="storefront" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="seasons"
        options={{
          title: 'Temporadas',
          tabBarLabel: 'Temporadas',
          tabBarIcon: ({ color, size }) => <MaterialIcons name="calendar-month" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="community"
        options={{
          title: 'Comunidad',
          tabBarLabel: 'Comunidad',
          tabBarIcon: ({ color, size }) => <MaterialIcons name="people" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarLabel: 'Perfil',
          tabBarIcon: ({ color, size }) => <MaterialIcons name="person" size={size} color={color} />,
        }}
      />
      {/* Hidden routes */}
      <Tabs.Screen name="sos" options={{ href: null, title: 'SOS' }} />
      <Tabs.Screen name="favorites" options={{ href: null, title: 'Favoritos' }} />
      <Tabs.Screen name="zones/[id]" options={{ href: null, title: 'Zona de pesca' }} />
      <Tabs.Screen name="equipment" options={{ href: null, title: 'Equipo' }} />
      <Tabs.Screen name="tutorials" options={{ href: null, title: 'Tutoriales' }} />
      <Tabs.Screen name="services/[id]" options={{ href: null, title: 'Detalle de servicio' }} />
      <Tabs.Screen name="reservations/index" options={{ href: null, title: 'Mis reservaciones' }} />
      <Tabs.Screen name="reservations/book/[serviceId]" options={{ href: null, title: 'Reservar' }} />
      <Tabs.Screen name="chat/[reservationId]" options={{ href: null, title: 'Chat' }} />
      <Tabs.Screen name="normas-pesca" options={{ href: null, title: 'Normas de Pesca' }} />
      <Tabs.Screen name="reportar" options={{ href: null, title: 'Reportar' }} />
      <Tabs.Screen name="sugerir-zona" options={{ href: null, title: 'Sugerir zona' }} />
    </Tabs>
  );
}

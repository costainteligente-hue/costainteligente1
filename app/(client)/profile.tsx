import React, { useState } from 'react';
import { ScrollView, View, Text, TouchableOpacity, Switch, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { signOut } from '@/lib/services/auth.service';
import { useAuthStore } from '@/stores/authStore';
import { COLORS } from '@/lib/constants';
import { CardBox } from '@/components/ui/CardBox';
import { InfoBox } from '@/components/ui/InfoBox';

export default function ClientProfileScreen() {
  const router = useRouter();
  const { user, clear } = useAuthStore();
  const [weatherAlerts, setWeatherAlerts] = useState(true);
  const [vedaAlerts, setVedaAlerts] = useState(true);
  const [generalAlerts, setGeneralAlerts] = useState(true);

  const name = user?.fullName ?? 'Usuario';
  const email = user?.email ?? '—';

  const handleLogout = async () => {
    await signOut();
    clear();
    router.replace('/auth/login');
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        {/* Avatar + info */}
        <CardBox>
          <View className="flex-row items-center gap-4">
            <View
              style={{
                width: 64,
                height: 64,
                borderRadius: 99,
                backgroundColor: `${COLORS.ocean}20`,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <MaterialIcons name="person" size={36} color={COLORS.ocean} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: '800', color: '#0F172A', fontSize: 18 }}>{name}</Text>
              <Text style={{ color: '#0F172A99', fontSize: 14 }}>{email}</Text>
              <View
                style={{
                  marginTop: 6,
                  backgroundColor: `${COLORS.ocean}15`,
                  borderRadius: 999,
                  paddingHorizontal: 10,
                  paddingVertical: 3,
                  alignSelf: 'flex-start',
                }}
              >
                <Text style={{ color: COLORS.ocean, fontWeight: '800', fontSize: 11 }}>Cliente</Text>
              </View>
            </View>
          </View>
        </CardBox>

        {/* Quick actions */}
        <CardBox>
          <Text style={{ fontWeight: '800', color: '#0F172A', fontSize: 15, marginBottom: 10 }}>Accesos rápidos</Text>
          {[
            { icon: 'favorite', label: 'Mis favoritos', onPress: () => router.push('/(client)/favorites') },
            { icon: 'history', label: 'Mis reservaciones', onPress: () => router.push('/(client)/reservations' as any) },
            { icon: 'storefront', label: 'Explorar servicios', onPress: () => router.push('/(client)/services' as any) },
            { icon: 'straighten', label: 'Equipo recomendado', onPress: () => router.push('/(client)/equipment' as any) },
            { icon: 'play-circle-outline', label: 'Tutoriales', onPress: () => router.push('/(client)/tutorials' as any) },
            { icon: 'people', label: 'Comunidad', onPress: () => router.push('/(client)/community') },
          ].map((item) => (
            <TouchableOpacity
              key={item.label}
              onPress={item.onPress}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                paddingVertical: 10,
                borderBottomWidth: 1,
                borderBottomColor: '#F1F5F9',
              }}
            >
              <MaterialIcons name={item.icon as any} size={22} color={COLORS.ocean} />
              <Text style={{ flex: 1, fontWeight: '700', color: '#0F172A' }}>{item.label}</Text>
              <MaterialIcons name="chevron-right" size={20} color="#94A3B8" />
            </TouchableOpacity>
          ))}
        </CardBox>

        {/* Notification preferences */}
        <CardBox>
          <Text style={{ fontWeight: '800', color: '#0F172A', fontSize: 15, marginBottom: 4 }}>
            Preferencias de notificaciones
          </Text>
          <Text style={{ color: '#0F172A99', fontSize: 13, marginBottom: 12 }}>
            Gestiona qué alertas deseas recibir.
          </Text>

          {[
            { label: 'Alertas de clima', subtitle: 'Viento fuerte, lluvias y condiciones adversas.', value: weatherAlerts, onValueChange: setWeatherAlerts },
            { label: 'Vedas', subtitle: 'Inicio y fin de períodos de veda por especie.', value: vedaAlerts, onValueChange: setVedaAlerts },
            { label: 'Avisos generales', subtitle: 'Noticias, actualizaciones y comunicados.', value: generalAlerts, onValueChange: setGeneralAlerts },
          ].map((item) => (
            <View key={item.label} className="flex-row items-center gap-3 py-3">
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: '800', color: '#0F172A' }}>{item.label}</Text>
                <Text style={{ color: '#0F172A99', fontSize: 12 }}>{item.subtitle}</Text>
              </View>
              <Switch
                value={item.value}
                onValueChange={item.onValueChange}
                trackColor={{ false: '#E2E8F0', true: `${COLORS.ocean}60` }}
                thumbColor={item.value ? COLORS.ocean : '#fff'}
              />
            </View>
          ))}
        </CardBox>

        <InfoBox text="Tus preferencias de notificaciones se sincronizan en la nube. Puedes cambiarlas en cualquier momento." />

        {/* Logout */}
        <TouchableOpacity
          onPress={handleLogout}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            padding: 14,
            borderRadius: 14,
            borderWidth: 1,
            borderColor: COLORS.danger,
            marginTop: 4,
          }}
        >
          <MaterialIcons name="logout" size={20} color={COLORS.danger} />
          <Text style={{ color: COLORS.danger, fontWeight: '800' }}>Cerrar sesión</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

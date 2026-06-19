import React, { useState } from 'react';
import { ScrollView, View, Text, TouchableOpacity, Switch, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { signOut } from '@/lib/services/auth.service';
import { useAuthStore } from '@/stores/authStore';
import { useWeather } from '@/hooks/useWeather';
import { COLORS, ZIHUATANEJO } from '@/lib/constants';
import { CardBox } from '@/components/ui/CardBox';

// ─── Helpers clima ────────────────────────────────────────────────────────────
function getWeatherIcon(code: number): keyof typeof MaterialIcons.glyphMap {
  if (code === 0) return 'wb-sunny';
  if (code <= 3) return 'cloud';
  if (code <= 67) return 'grain';
  if (code <= 77) return 'ac-unit';
  return 'thunderstorm';
}

function getWeatherLabel(code: number): string {
  if (code === 0) return 'Despejado';
  if (code <= 2) return 'Parcialmente nublado';
  if (code === 3) return 'Nublado';
  if (code <= 51) return 'Llovizna';
  if (code <= 67) return 'Lluvia';
  if (code <= 77) return 'Nieve';
  return 'Tormenta';
}

function getWindLabel(speed: number): { label: string; color: string } {
  if (speed < 15) return { label: 'Viento suave', color: COLORS.success };
  if (speed < 30) return { label: 'Viento moderado', color: COLORS.caution };
  if (speed < 50) return { label: 'Viento fuerte', color: COLORS.warning };
  return { label: 'Viento peligroso', color: COLORS.danger };
}

function getSeaCondition(windspeed: number): { label: string; color: string; icon: keyof typeof MaterialIcons.glyphMap } {
  if (windspeed < 15) return { label: 'Mar en calma', color: COLORS.success, icon: 'waves' };
  if (windspeed < 30) return { label: 'Mar moderado', color: COLORS.caution, icon: 'waves' };
  return { label: 'Mar agitado', color: COLORS.danger, icon: 'warning' };
}

// ─── Widget de clima ──────────────────────────────────────────────────────────
function WeatherWidget() {
  const { data, isLoading } = useWeather();

  if (isLoading) {
    return (
      <LinearGradient
        colors={['#0F172A', '#0F766E']}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={{ borderRadius: 20, padding: 20, marginBottom: 14, alignItems: 'center' }}
      >
        <ActivityIndicator color="#fff" />
      </LinearGradient>
    );
  }

  const temp   = data?.temperature ?? 0;
  const wind   = data?.windspeed   ?? 0;
  const code   = data?.weathercode ?? 0;
  const windInfo = getWindLabel(wind);
  const seaInfo  = getSeaCondition(wind);

  return (
    <LinearGradient
      colors={['#0F172A', '#0F766E']}
      start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
      style={{ borderRadius: 20, padding: 20, marginBottom: 14 }}
    >
      {/* Encabezado */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 16 }}>
        <MaterialIcons name="location-on" size={16} color="rgba(255,255,255,0.7)" />
        <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: '700' }}>
          Zihuatanejo · Pacífico
        </Text>
      </View>

      {/* Temperatura principal */}
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16 }}>
        <MaterialIcons name={getWeatherIcon(code)} size={52} color="#fff" style={{ marginRight: 12, marginTop: 4 }} />
        <View>
          <Text style={{ color: '#fff', fontSize: 52, fontWeight: '800', lineHeight: 56 }}>
            {Math.round(temp)}°
          </Text>
          <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 15, fontWeight: '600' }}>
            {getWeatherLabel(code)}
          </Text>
        </View>
      </View>

      {/* Grid de datos */}
      <View style={{ flexDirection: 'row', gap: 10 }}>
        {/* Viento */}
        <View style={{
          flex: 1, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 14,
          padding: 12, alignItems: 'center', gap: 4,
        }}>
          <MaterialIcons name="air" size={22} color="#fff" />
          <Text style={{ color: '#fff', fontWeight: '800', fontSize: 18 }}>{Math.round(wind)}</Text>
          <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 10, fontWeight: '700' }}>km/h</Text>
          <View style={{
            backgroundColor: windInfo.color + '40', borderRadius: 999,
            paddingHorizontal: 8, paddingVertical: 2,
          }}>
            <Text style={{ color: '#fff', fontSize: 10, fontWeight: '800' }}>{windInfo.label}</Text>
          </View>
        </View>

        {/* Mar */}
        <View style={{
          flex: 1, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 14,
          padding: 12, alignItems: 'center', gap: 4,
        }}>
          <MaterialIcons name={seaInfo.icon} size={22} color="#fff" />
          <Text style={{ color: '#fff', fontWeight: '800', fontSize: 14, textAlign: 'center' }}>
            {seaInfo.label}
          </Text>
          <View style={{
            backgroundColor: seaInfo.color + '40', borderRadius: 999,
            paddingHorizontal: 8, paddingVertical: 2,
          }}>
            <Text style={{ color: '#fff', fontSize: 10, fontWeight: '800' }}>Estado del mar</Text>
          </View>
        </View>

        {/* Temperatura */}
        <View style={{
          flex: 1, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 14,
          padding: 12, alignItems: 'center', gap: 4,
        }}>
          <MaterialIcons name="thermostat" size={22} color="#fff" />
          <Text style={{ color: '#fff', fontWeight: '800', fontSize: 18 }}>{Math.round(temp)}°C</Text>
          <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 10, fontWeight: '700' }}>Temperatura</Text>
          <View style={{
            backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 999,
            paddingHorizontal: 8, paddingVertical: 2,
          }}>
            <Text style={{ color: '#fff', fontSize: 10, fontWeight: '800' }}>Ambiente</Text>
          </View>
        </View>
      </View>

      {/* Aviso si hay viento fuerte */}
      {wind >= 30 && (
        <View style={{
          marginTop: 12, backgroundColor: `${COLORS.danger}30`, borderRadius: 12,
          padding: 10, flexDirection: 'row', alignItems: 'center', gap: 8,
          borderWidth: 1, borderColor: `${COLORS.danger}60`,
        }}>
          <MaterialIcons name="warning" size={18} color={COLORS.danger} />
          <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700', flex: 1 }}>
            Condiciones adversas. Se recomienda no salir a mar abierto.
          </Text>
        </View>
      )}
    </LinearGradient>
  );
}

// ─── Pantalla de perfil ───────────────────────────────────────────────────────
export default function ClientProfileScreen() {
  const router = useRouter();
  const { user, clear } = useAuthStore();
  const [weatherAlerts, setWeatherAlerts] = useState(true);
  const [vedaAlerts, setVedaAlerts]       = useState(true);
  const [generalAlerts, setGeneralAlerts] = useState(true);

  const name  = user?.fullName ?? 'Usuario';
  const email = user?.email    ?? '—';

  const handleLogout = async () => {
    await signOut();
    clear();
    router.replace('/auth/login');
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>

        {/* Widget de clima en tiempo real */}
        <WeatherWidget />

        {/* Avatar + info */}
        <CardBox>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
            <LinearGradient
              colors={[COLORS.ocean, COLORS.aqua]}
              style={{ width: 70, height: 70, borderRadius: 99, alignItems: 'center', justifyContent: 'center' }}
            >
              <MaterialIcons name="person" size={38} color="#fff" />
            </LinearGradient>
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: '800', color: '#0F172A', fontSize: 20 }}>{name}</Text>
              <Text style={{ color: '#0F172A99', fontSize: 13, marginTop: 2 }}>{email}</Text>
              <View style={{
                marginTop: 8, flexDirection: 'row', gap: 6,
              }}>
                <View style={{
                  backgroundColor: `${COLORS.ocean}15`, borderRadius: 999,
                  paddingHorizontal: 10, paddingVertical: 4,
                }}>
                  <Text style={{ color: COLORS.ocean, fontWeight: '800', fontSize: 11 }}>🎣 Cliente</Text>
                </View>
                <View style={{
                  backgroundColor: `${COLORS.success}15`, borderRadius: 999,
                  paddingHorizontal: 10, paddingVertical: 4,
                }}>
                  <Text style={{ color: COLORS.success, fontWeight: '800', fontSize: 11 }}>Verificado</Text>
                </View>
              </View>
            </View>
          </View>
        </CardBox>

        {/* Accesos rápidos */}
        <CardBox>
          <Text style={{ fontWeight: '800', color: '#0F172A', fontSize: 15, marginBottom: 10 }}>
            Accesos rápidos
          </Text>
          {[
            { icon: 'gavel',            label: 'Normas de pesca',   sublabel: 'Licencias, vedas y reglamentos', onPress: () => router.push('/(client)/normas-pesca' as any),  badge: 'Nuevo' },
            { icon: 'favorite',         label: 'Mis favoritos',     sublabel: 'Zonas guardadas',                onPress: () => router.push('/(client)/favorites') },
            { icon: 'history',          label: 'Mis reservaciones', sublabel: 'Historial y activas',            onPress: () => router.push('/(client)/reservations' as any) },
            { icon: 'report-problem',   label: 'Reportar problema', sublabel: 'Enviar reporte al admin',        onPress: () => router.push('/(client)/reportar' as any) },
            { icon: 'add-location-alt', label: 'Sugerir zona',      sublabel: 'Proponer nueva zona de pesca',   onPress: () => router.push('/(client)/sugerir-zona' as any) },
            { icon: 'storefront',       label: 'Explorar servicios', sublabel: 'Lanchas, guías, restaurantes',  onPress: () => router.push('/(client)/services' as any) },
            { icon: 'straighten',       label: 'Equipo recomendado', sublabel: 'Por nivel de experiencia',     onPress: () => router.push('/(client)/equipment' as any) },
            { icon: 'play-circle-outline', label: 'Tutoriales',     sublabel: 'Videos de técnicas',            onPress: () => router.push('/(client)/tutorials' as any) },
            { icon: 'people',           label: 'Comunidad',         sublabel: 'Fotos y capturas',              onPress: () => router.push('/(client)/community') },
          ].map((item) => (
            <TouchableOpacity
              key={item.label}
              onPress={item.onPress}
              style={{
                flexDirection: 'row', alignItems: 'center', gap: 12,
                paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
              }}
            >
              <View style={{
                width: 40, height: 40, borderRadius: 12,
                backgroundColor: `${COLORS.ocean}12`,
                alignItems: 'center', justifyContent: 'center',
              }}>
                <MaterialIcons name={item.icon as any} size={20} color={COLORS.ocean} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: '700', color: '#0F172A', fontSize: 14 }}>{item.label}</Text>
                <Text style={{ color: '#94A3B8', fontSize: 12 }}>{item.sublabel}</Text>
              </View>
              {item.badge && (
                <View style={{ backgroundColor: COLORS.ocean, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3, marginRight: 6 }}>
                  <Text style={{ color: '#fff', fontSize: 10, fontWeight: '800' }}>{item.badge}</Text>
                </View>
              )}
              <MaterialIcons name="chevron-right" size={20} color="#94A3B8" />
            </TouchableOpacity>
          ))}
        </CardBox>

        {/* Preferencias de notificaciones */}
        <CardBox>
          <Text style={{ fontWeight: '800', color: '#0F172A', fontSize: 15, marginBottom: 4 }}>
            Notificaciones
          </Text>
          <Text style={{ color: '#0F172A99', fontSize: 13, marginBottom: 12 }}>
            Gestiona qué alertas deseas recibir.
          </Text>
          {[
            { label: 'Alertas de clima', subtitle: 'Viento fuerte y condiciones adversas.', value: weatherAlerts, onValueChange: setWeatherAlerts, icon: 'cloud' },
            { label: 'Vedas', subtitle: 'Inicio y fin de períodos de veda.', value: vedaAlerts, onValueChange: setVedaAlerts, icon: 'block' },
            { label: 'Avisos generales', subtitle: 'Noticias y comunicados.', value: generalAlerts, onValueChange: setGeneralAlerts, icon: 'notifications' },
          ].map((item) => (
            <View key={item.label} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 }}>
              <MaterialIcons name={item.icon as any} size={20} color={COLORS.ocean} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: '700', color: '#0F172A' }}>{item.label}</Text>
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

        {/* Cerrar sesión */}
        <TouchableOpacity
          onPress={handleLogout}
          style={{
            flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
            gap: 8, padding: 14, borderRadius: 14, borderWidth: 1,
            borderColor: COLORS.danger, marginTop: 4,
          }}
        >
          <MaterialIcons name="logout" size={20} color={COLORS.danger} />
          <Text style={{ color: COLORS.danger, fontWeight: '800' }}>Cerrar sesión</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

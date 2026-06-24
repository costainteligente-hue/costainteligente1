import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Linking, ActivityIndicator, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, EMERGENCY_CONTACTS } from '@/lib/constants';

type GPSState = 'idle' | 'requesting' | 'granted' | 'timeout' | 'denied';

export default function SOSScreen() {
  const [gpsState, setGpsState] = useState<GPSState>('idle');
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null);

  useEffect(() => {
    requestGPS();
  }, []);

  const requestGPS = async () => {
    setGpsState('requesting');

    // On web, use the browser Geolocation API directly
    if (Platform.OS === 'web') {
      if (!navigator.geolocation) {
        setGpsState('denied');
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude });
          setGpsState('granted');
        },
        () => setGpsState('denied'),
        { timeout: 10000 },
      );
      return;
    }

    // Native: use expo-location via dynamic import
    try {
      const Location = await import('expo-location');
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'denied') {
        setGpsState('denied');
        return;
      }
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        timeInterval: 10000,
      });
      setCoords({ lat: location.coords.latitude, lon: location.coords.longitude });
      setGpsState('granted');
    } catch {
      setGpsState('timeout');
    }
  };

  const callContact = (phone: string) => {
    Linking.openURL(`tel:${phone}`);
  };

  const shareLocation = () => {
    if (!coords) return;
    const url = `https://maps.google.com/?q=${coords.lat},${coords.lon}`;
    Linking.openURL(url);
  };

  const openSettings = () => {
    if (Platform.OS === 'web') {
      // Browsers don't allow opening settings — just show info
      setGpsState('timeout');
      return;
    }
    Linking.openSettings();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFF1F2' }} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        {/* Header */}
        <View
          style={{
            backgroundColor: COLORS.danger,
            borderRadius: 24,
            padding: 24,
            alignItems: 'center',
            marginBottom: 20,
          }}
        >
          <MaterialIcons name="local-phone" size={56} color="#fff" />
          <Text style={{ color: '#fff', fontSize: 24, fontWeight: '800', marginTop: 8 }}>
            Contactos de emergencia
          </Text>
          <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 13, marginTop: 8, textAlign: 'center', lineHeight: 20 }}>
            Llama directamente a los servicios de emergencia oficiales.{'\n'}
            Esta app no envía alertas automáticas — solo marca el número.
          </Text>
        </View>

        {/* GPS coordinates */}
        <View
          style={{
            backgroundColor: '#fff',
            borderRadius: 20,
            padding: 16,
            marginBottom: 16,
            borderWidth: 1,
            borderColor: '#E2E8F0',
          }}
        >
          <View className="flex-row items-center gap-2 mb-3">
            <MaterialIcons name="my-location" size={22} color={COLORS.info} />
            <Text style={{ fontWeight: '800', color: '#0F172A', fontSize: 15 }}>
              Tu ubicación actual
            </Text>
          </View>

          {gpsState === 'requesting' && (
            <View className="flex-row items-center gap-3 py-2">
              <ActivityIndicator color={COLORS.ocean} />
              <Text style={{ color: '#0F172A99' }}>Obteniendo coordenadas GPS…</Text>
            </View>
          )}

          {gpsState === 'granted' && coords && (
            <View className="gap-3">
              <View
                style={{
                  backgroundColor: '#F8FAFC',
                  borderRadius: 12,
                  padding: 12,
                  borderWidth: 1,
                  borderColor: '#E2E8F0',
                }}
              >
                <Text style={{ fontFamily: 'monospace', color: '#0F172A', fontWeight: '700', fontSize: 16 }}>
                  {coords.lat.toFixed(6)}° N
                </Text>
                <Text style={{ fontFamily: 'monospace', color: '#0F172A', fontWeight: '700', fontSize: 16 }}>
                  {Math.abs(coords.lon).toFixed(6)}° O
                </Text>
              </View>
              <TouchableOpacity
                onPress={shareLocation}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  backgroundColor: `${COLORS.info}15`,
                  borderRadius: 12,
                  padding: 11,
                  borderWidth: 1,
                  borderColor: `${COLORS.info}30`,
                }}
              >
                <MaterialIcons name="share" size={18} color={COLORS.info} />
                <Text style={{ color: COLORS.info, fontWeight: '800' }}>Compartir ubicación en mapa</Text>
              </TouchableOpacity>
            </View>
          )}

          {gpsState === 'timeout' && (
            <View
              style={{
                backgroundColor: `${COLORS.warning}12`,
                borderRadius: 12,
                padding: 12,
                borderWidth: 1,
                borderColor: `${COLORS.warning}30`,
              }}
            >
              <Text style={{ color: COLORS.warning, fontWeight: '700' }}>
                Ubicación no disponible. Muestra esta pantalla a los servicios de emergencia e indica tu posición aproximada.
              </Text>
              <TouchableOpacity
                onPress={requestGPS}
                style={{ marginTop: 8 }}
              >
                <Text style={{ color: COLORS.ocean, fontWeight: '800' }}>Reintentar</Text>
              </TouchableOpacity>
            </View>
          )}

          {gpsState === 'denied' && (
            <View
              style={{
                backgroundColor: `${COLORS.danger}10`,
                borderRadius: 12,
                padding: 12,
                borderWidth: 1,
                borderColor: `${COLORS.danger}25`,
              }}
            >
              <Text style={{ color: COLORS.danger, fontWeight: '700' }}>
                Permiso de ubicación denegado. Activa los permisos de ubicación en la configuración de tu dispositivo para compartir tu posición.
              </Text>
              <TouchableOpacity
                onPress={openSettings}
                style={{ marginTop: 8 }}
              >
                <Text style={{ color: COLORS.ocean, fontWeight: '800' }}>Abrir configuración</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Emergency contacts */}
        <Text style={{ fontWeight: '800', color: '#0F172A', fontSize: 17, marginBottom: 12 }}>
          Contactos de emergencia
        </Text>

        {EMERGENCY_CONTACTS.map((contact) => (
          <View
            key={contact.id}
            style={{
              backgroundColor: '#fff',
              borderRadius: 20,
              borderWidth: 1,
              borderColor: '#E2E8F0',
              padding: 16,
              marginBottom: 12,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 14,
            }}
          >
            <View
              style={{
                width: 50,
                height: 50,
                borderRadius: 99,
                backgroundColor: `${COLORS.danger}18`,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <MaterialIcons name="local-phone" size={26} color={COLORS.danger} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: '800', color: '#0F172A', fontSize: 15 }}>
                {contact.name}
              </Text>
              <Text style={{ color: '#0F172A99', fontSize: 14, marginTop: 2 }}>
                {contact.phone.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3')}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => callContact(contact.phone)}
              style={{
                backgroundColor: COLORS.danger,
                borderRadius: 14,
                paddingHorizontal: 16,
                paddingVertical: 10,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <MaterialIcons name="call" size={18} color="#fff" />
              <Text style={{ color: '#fff', fontWeight: '800' }}>Llamar</Text>
            </TouchableOpacity>
          </View>
        ))}

        {/* Safety note */}
        <View
          style={{
            backgroundColor: `${COLORS.caution}12`,
            borderRadius: 16,
            padding: 14,
            borderWidth: 1,
            borderColor: `${COLORS.caution}30`,
            flexDirection: 'row',
            gap: 10,
          }}
        >
          <MaterialIcons name="info" size={20} color={COLORS.caution} style={{ marginTop: 1 }} />
          <Text style={{ flex: 1, color: COLORS.caution, fontSize: 13, lineHeight: 20, fontWeight: '600' }}>
            En caso de emergencia marítima, llama primero a la SEMAR o Capitanía de Puerto. Proporciona tu posición GPS, número de personas a bordo y tipo de emergencia.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

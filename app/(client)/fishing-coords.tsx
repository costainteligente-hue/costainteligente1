/**
 * FishingCoordsScreen — Coordenadas de Pesca (Cliente)
 * Muestra la lista de coordenadas. Preparado para sistema de unlock futuro.
 */
import React, { useState } from 'react';
import {
  ScrollView, View, Text, TouchableOpacity, Image, Modal, Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '@/lib/constants';
import { useFishingCoordsStore } from '@/stores/fishingCoordsStore';
import { CardBox } from '@/components/ui/CardBox';
import { InfoBox } from '@/components/ui/InfoBox';
import type { FishingCoordinate } from '@/types/fishing-coords';

// ─── Mini mapa estático vía OSM tile ─────────────────────────────────────────
function CoordMap({ lat, lon }: { lat: number; lon: number }) {
  const zoom = 13;
  const html = `<!DOCTYPE html><html><head>
    <meta charset="utf-8"/>
    <meta name="viewport" content="width=device-width,initial-scale=1"/>
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <style>*{margin:0;padding:0}html,body,#m{width:100%;height:100%}</style>
  </head><body>
    <div id="m"></div>
    <script>
      var map = L.map('m',{zoomControl:false,attributionControl:false}).setView([${lat},${lon}],${zoom});
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
      L.circleMarker([${lat},${lon}],{radius:10,color:'#fff',fillColor:'${COLORS.ocean}',fillOpacity:0.92,weight:3}).addTo(map);
    </script>
  </body></html>`;

  if (Platform.OS === 'web') {
    return <iframe srcDoc={html} style={{ width: '100%', height: 180, border: 'none' } as any} sandbox="allow-scripts allow-same-origin" />;
  }
  const { WebView } = require('react-native-webview');
  return (
    <View style={{ height: 180 }}>
      <WebView source={{ html }} style={{ flex: 1 }} javaScriptEnabled originWhitelist={['*']} scrollEnabled={false} />
    </View>
  );
}

// ─── Detail modal ─────────────────────────────────────────────────────────────
function CoordDetail({ coord, onClose }: { coord: FishingCoordinate; onClose: () => void }) {
  const date = new Date(coord.registeredAt).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
        <View style={{ width: 42, height: 4, borderRadius: 999, backgroundColor: 'rgba(15,23,42,0.2)', alignSelf: 'center', marginTop: 10, marginBottom: 12 }} />
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 12 }}>
          <Text style={{ fontSize: 20, fontWeight: '900', color: '#0F172A', flex: 1 }} numberOfLines={2}>{coord.name}</Text>
          <TouchableOpacity onPress={onClose}><MaterialIcons name="close" size={24} color="#0F172A" /></TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
          {/* Foto */}
          {coord.photoUrl ? (
            <Image source={{ uri: coord.photoUrl }} style={{ width: '100%', height: 200 }} resizeMode="cover" />
          ) : (
            <View style={{ width: '100%', height: 120, backgroundColor: `${COLORS.ocean}12`, alignItems: 'center', justifyContent: 'center' }}>
              <MaterialIcons name="photo-camera" size={40} color={`${COLORS.ocean}60`} />
            </View>
          )}

          <View style={{ padding: 16 }}>
            {/* Coordenadas */}
            <CardBox>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <View style={{ width: 40, height: 40, borderRadius: 999, backgroundColor: `${COLORS.ocean}20`, alignItems: 'center', justifyContent: 'center' }}>
                  <MaterialIcons name="gps-fixed" size={20} color={COLORS.ocean} />
                </View>
                <View>
                  <Text style={{ fontWeight: '900', color: '#0F172A', fontSize: 15 }}>Coordenadas GPS</Text>
                  <Text style={{ color: 'rgba(15,23,42,0.62)', fontSize: 13 }}>
                    {coord.latitude.toFixed(6)}° N · {Math.abs(coord.longitude).toFixed(6)}° O
                  </Text>
                </View>
              </View>

              {/* Mini mapa */}
              <View style={{ borderRadius: 14, overflow: 'hidden' }}>
                <CoordMap lat={coord.latitude} lon={coord.longitude} />
              </View>
            </CardBox>

            {/* Descripción */}
            <CardBox>
              <Text style={{ fontWeight: '900', color: '#0F172A', fontSize: 15, marginBottom: 8 }}>Descripción</Text>
              <Text style={{ color: 'rgba(15,23,42,0.62)', fontSize: 14, lineHeight: 22 }}>{coord.description}</Text>
              <View style={{ height: 1, backgroundColor: '#E2E8F0', marginVertical: 12 }} />
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <MaterialIcons name="calendar-today" size={14} color="rgba(15,23,42,0.62)" />
                <Text style={{ color: 'rgba(15,23,42,0.62)', fontSize: 12 }}>Registrada el {date}</Text>
              </View>
            </CardBox>

            {/* Future unlock notice */}
            <View style={{ backgroundColor: `${COLORS.success}10`, borderRadius: 14, borderWidth: 1, borderColor: `${COLORS.success}25`, padding: 14, flexDirection: 'row', gap: 10 }}>
              <MaterialIcons name="lock-open" size={18} color={COLORS.success} style={{ marginTop: 1 }} />
              <Text style={{ flex: 1, color: 'rgba(15,23,42,0.62)', fontSize: 13, lineHeight: 19 }}>
                Esta coordenada es accesible de forma gratuita. En futuras actualizaciones, algunas coordenadas especiales requerirán suscripción.
              </Text>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

// ─── Coord card ───────────────────────────────────────────────────────────────
function CoordCard({ coord, onPress }: { coord: FishingCoordinate; onPress: () => void }) {
  const date = new Date(coord.registeredAt).toLocaleDateString('es-MX', { month: 'short', day: 'numeric', year: 'numeric' });
  return (
    <TouchableOpacity onPress={onPress}>
      <CardBox>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
          {/* Foto o placeholder */}
          <View style={{ width: 72, height: 72, borderRadius: 14, overflow: 'hidden', backgroundColor: `${COLORS.ocean}12`, flexShrink: 0 }}>
            {coord.photoUrl ? (
              <Image source={{ uri: coord.photoUrl }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
            ) : (
              <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                <MaterialIcons name="place" size={28} color={COLORS.ocean} />
              </View>
            )}
          </View>

          <View style={{ flex: 1 }}>
            <Text style={{ fontWeight: '900', color: '#0F172A', fontSize: 15, lineHeight: 20 }}>{coord.name}</Text>
            <Text style={{ color: 'rgba(15,23,42,0.62)', fontSize: 12, marginTop: 2 }}>
              {coord.latitude.toFixed(4)}° N · {Math.abs(coord.longitude).toFixed(4)}° O
            </Text>
            <Text style={{ color: 'rgba(15,23,42,0.62)', fontSize: 12, marginTop: 4, lineHeight: 17 }} numberOfLines={2}>
              {coord.description}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 }}>
              <MaterialIcons name="calendar-today" size={12} color="rgba(15,23,42,0.62)" />
              <Text style={{ color: 'rgba(15,23,42,0.62)', fontSize: 11 }}>{date}</Text>
              <View style={{ marginLeft: 6, backgroundColor: `${COLORS.success}15`, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2, flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                <MaterialIcons name="lock-open" size={10} color={COLORS.success} />
                <Text style={{ color: COLORS.success, fontWeight: '800', fontSize: 10 }}>Libre</Text>
              </View>
            </View>
          </View>

          <MaterialIcons name="chevron-right" size={20} color="#CBD5E1" />
        </View>
      </CardBox>
    </TouchableOpacity>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function FishingCoordsScreen() {
  const { coords } = useFishingCoordsStore();
  const [selected, setSelected] = useState<FishingCoordinate | null>(null);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }} edges={['top']}>
      {selected && <CoordDetail coord={selected} onClose={() => setSelected(null)} />}

      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Hero */}
        <LinearGradient colors={['#0F172A', '#0F766E']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={{ padding: 20, paddingBottom: 28 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <View style={{ width: 48, height: 48, borderRadius: 99, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' }}>
              <MaterialIcons name="gps-fixed" size={26} color="#fff" />
            </View>
            <View>
              <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: '600' }}>Perfil · Cliente</Text>
              <Text style={{ color: '#fff', fontSize: 22, fontWeight: '900', letterSpacing: -0.4 }}>Coordenadas de Pesca</Text>
            </View>
          </View>
          <Text style={{ color: 'rgba(255,255,255,0.84)', fontSize: 14, lineHeight: 21 }}>
            Puntos GPS exactos de las mejores zonas de pesca. Cada coordenada incluye descripción, foto y fecha de registro.
          </Text>
          <View style={{ marginTop: 14, flexDirection: 'row', gap: 8 }}>
            <View style={{ backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5, flexDirection: 'row', alignItems: 'center', gap: 5 }}>
              <MaterialIcons name="lock-open" size={12} color="#fff" />
              <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700' }}>Acceso libre</Text>
            </View>
            <View style={{ backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 }}>
              <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700' }}>{coords.length} coordenadas</Text>
            </View>
          </View>
        </LinearGradient>

        <View style={{ padding: 16 }}>
          {/* Future unlock notice */}
          <View style={{ backgroundColor: `${COLORS.info}10`, borderRadius: 14, borderWidth: 1, borderColor: `${COLORS.info}25`, padding: 14, marginBottom: 16, flexDirection: 'row', gap: 10 }}>
            <MaterialIcons name="info-outline" size={18} color={COLORS.info} style={{ marginTop: 1 }} />
            <Text style={{ flex: 1, color: 'rgba(15,23,42,0.62)', fontSize: 13, lineHeight: 19 }}>
              Actualmente todas las coordenadas son accesibles de forma gratuita. Próximamente se habilitará un sistema de suscripción para coordenadas exclusivas.
            </Text>
          </View>

          {coords.length === 0 ? (
            <View style={{ alignItems: 'center', paddingVertical: 40 }}>
              <MaterialIcons name="gps-off" size={48} color="#CBD5E1" />
              <Text style={{ fontWeight: '900', color: '#0F172A', fontSize: 16, marginTop: 12 }}>Sin coordenadas registradas</Text>
              <Text style={{ color: 'rgba(15,23,42,0.62)', textAlign: 'center', marginTop: 6, lineHeight: 20 }}>
                El administrador aún no ha registrado coordenadas de pesca.
              </Text>
            </View>
          ) : (
            coords.map((c) => <CoordCard key={c.id} coord={c} onPress={() => setSelected(c)} />)
          )}

          <InfoBox text="Las coordenadas son publicadas por el equipo de Costa Inteligente. Si quieres sugerir un punto, usa la sección 'Sugerir zona' en tu perfil." />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

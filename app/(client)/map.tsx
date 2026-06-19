import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, Modal, Platform,
  Dimensions, LayoutChangeEvent, Image, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { COLORS } from '@/lib/constants';
import { CardBox } from '@/components/ui/CardBox';
import { StatusPill } from '@/components/ui/StatusPill';

// ─── Zonas de pesca (13 zonas, Zihuatanejo-Ixtapa y alrededores) ──────────────
const ALL_ZONES = [
  {
    id: 'z1',  name: 'Bajo de Chila',        level: 'intermedio',   type: 'Offshore',
    latitude: 17.58,  longitude: -101.62,
    description: 'Zona de aguas profundas ideal para pez vela y marlín.',
    species: ['Pez vela', 'Marlín azul', 'Dorado'],
    wikimedia: 'Zihuatanejo',
  },
  {
    id: 'z2',  name: 'Playa La Ropa',         level: 'principiante', type: 'Playa',
    latitude: 17.6280, longitude: -101.5510,
    description: 'Playa protegida perfecta para principiantes y pesca desde la orilla.',
    species: ['Jurel', 'Sierra', 'Robalo'],
    wikimedia: 'Playa_La_Ropa',
  },
  {
    id: 'z3',  name: 'Punta Ixtapa',          level: 'avanzado',     type: 'Rocas',
    latitude: 17.6720, longitude: -101.6440,
    description: 'Zona rocosa con corrientes fuertes. Requiere experiencia y equipo adecuado.',
    species: ['Atún aleta amarilla', 'Wahoo', 'Pez vela'],
    wikimedia: 'Ixtapa',
  },
  {
    id: 'z4',  name: 'Bahía de Zihuatanejo',  level: 'principiante', type: 'Bahía',
    latitude: 17.6380, longitude: -101.5520,
    description: 'Bahía tranquila ideal para pesca recreativa y avistamiento de fauna.',
    species: ['Huachinango', 'Robalo', 'Mojarra'],
    wikimedia: 'Bahía_de_Zihuatanejo',
  },
  {
    id: 'z5',  name: 'Morro de Petatlán',     level: 'avanzado',     type: 'Offshore',
    latitude: 17.5200, longitude: -101.7100,
    description: 'Zona de pesca de altura con gran diversidad de especies pelágicas.',
    species: ['Marlín rayado', 'Atún', 'Dorado', 'Wahoo'],
    wikimedia: 'Petatlán',
  },
  {
    id: 'z6',  name: 'Playa Las Gatas',       level: 'principiante', type: 'Playa',
    latitude: 17.6220, longitude: -101.5480,
    description: 'Zona muy conocida para pesca desde orilla y snorkel en aguas tranquilas.',
    species: ['Pargo', 'Mojarra', 'Cabrilla'],
    wikimedia: 'Playa_Las_Gatas',
  },
  {
    id: 'z7',  name: 'Playa Larga',           level: 'principiante', type: 'Playa',
    latitude: 17.6050, longitude: -101.5650,
    description: 'Playa extensa ideal para pesca recreativa y acceso vehicular.',
    species: ['Robalo', 'Sierra', 'Jurel'],
    wikimedia: 'Zihuatanejo',
  },
  {
    id: 'z8',  name: 'Playa Quieta',          level: 'principiante', type: 'Playa',
    latitude: 17.6650, longitude: -101.6200,
    description: 'Aguas tranquilas protegidas, perfecta para principiantes y familias.',
    species: ['Mojarra', 'Robalo', 'Trucha marina'],
    wikimedia: 'Ixtapa_Island',
  },
  {
    id: 'z9',  name: 'Isla Ixtapa',           level: 'intermedio',   type: 'Isla',
    latitude: 17.6750, longitude: -101.6530,
    description: 'Zona de buceo y pesca de orilla alrededor de la isla, rica en fauna marina.',
    species: ['Pargo', 'Cabrilla', 'Barracuda'],
    wikimedia: 'Ixtapa_Island',
  },
  {
    id: 'z10', name: 'Playa Linda (Embarcadero)', level: 'intermedio', type: 'Embarcadero',
    latitude: 17.6600, longitude: -101.6050,
    description: 'Principal embarcadero para lancheros y tours de pesca deportiva.',
    species: ['Pez vela', 'Marlín', 'Dorado', 'Atún'],
    wikimedia: 'Ixtapa',
  },
  {
    id: 'z11', name: 'Playa Majahua',         level: 'intermedio',   type: 'Playa',
    latitude: 17.5980, longitude: -101.5880,
    description: 'Zona de pesca artesanal local con alto volumen de capturas.',
    species: ['Sierra', 'Robalo', 'Huachinango'],
    wikimedia: 'Zihuatanejo',
  },
  {
    id: 'z12', name: 'Banco de Papanoa',      level: 'avanzado',     type: 'Offshore',
    latitude: 17.3200, longitude: -101.0200,
    description: 'Banco offshore reconocido a 40 km al sureste, con gran diversidad pelágica.',
    species: ['Marlín', 'Atún', 'Dorado', 'Wahoo', 'Pez vela'],
    wikimedia: 'Papanoa',
  },
  {
    id: 'z13', name: 'El Pericón (Petatlán)', level: 'principiante', type: 'Costera',
    latitude: 17.5400, longitude: -101.2700,
    description: 'Zona costera de pesca artesanal con acceso desde tierra.',
    species: ['Robalo', 'Huachinango', 'Mojarra', 'Sierra'],
    wikimedia: 'Petatlán',
  },
];

type Zone = typeof ALL_ZONES[0];
type Level = 'todos' | 'principiante' | 'intermedio' | 'avanzado';
type MapLayer = 'zones' | 'wind' | 'waves' | 'currents' | 'temp';

const LEVEL_COLORS: Record<string, string> = {
  principiante: COLORS.success,
  intermedio:   COLORS.warning,
  avanzado:     COLORS.danger,
};
const LEVEL_EMOJI: Record<string, string> = {
  principiante: '🟢',
  intermedio:   '🟡',
  avanzado:     '🔴',
};

// ─── Distancia en km entre dos coordenadas (fórmula Haversine) ────────────────
function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function fmtKm(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  if (km < 10) return `${km.toFixed(1)} km`;
  return `${Math.round(km)} km`;
}

// ─── Foto desde Wikimedia Commons (API pública, sin key) ─────────────────────
const photoCache: Record<string, string | null> = {};

async function fetchWikimediaPhoto(searchTerm: string): Promise<string | null> {
  if (searchTerm in photoCache) return photoCache[searchTerm];
  try {
    const url =
      `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(searchTerm)}` +
      `&prop=pageimages&format=json&pithumbsize=600&origin=*`;
    const res  = await fetch(url);
    const data = await res.json();
    const pages = data?.query?.pages ?? {};
    const page  = Object.values(pages)[0] as any;
    const thumb = page?.thumbnail?.source ?? null;
    photoCache[searchTerm] = thumb;
    return thumb;
  } catch {
    photoCache[searchTerm] = null;
    return null;
  }
}

// ─── Hook: foto de zona ───────────────────────────────────────────────────────
function useZonePhoto(wikimedia: string) {
  const [photo, setPhoto] = useState<string | null>(null);
  useEffect(() => {
    fetchWikimediaPhoto(wikimedia).then(setPhoto);
  }, [wikimedia]);
  return photo;
}

// ─── Mapa Leaflet + OSM ───────────────────────────────────────────────────────
const MAP_CENTER_LAT = 17.62;
const MAP_CENTER_LON = -101.60;
const MAP_ZOOM       = 9;

// OpenWeatherMap tile layers (community/public endpoints, no key required for basic use)
const OWM_TILES: Record<MapLayer, string | null> = {
  zones:    null,
  wind:     'https://tile.openweathermap.org/map/wind_new/{z}/{x}/{y}.png?appid=demo',
  waves:    null, // no public tile for waves without key — show OSM only
  currents: null,
  temp:     'https://tile.openweathermap.org/map/temp_new/{z}/{x}/{y}.png?appid=demo',
};

// We use a free, no-key wind/precipitation overlay from open-meteo-based tile servers
// Best free option: openweathermap community tiles for wind & temp, rainviewer for precipitation
const WEATHER_TILE: Record<MapLayer, { url: string; attribution: string } | null> = {
  zones:    null,
  wind:     { url: 'https://tile2.openweathermap.org/map/wind/{z}/{x}/{y}.png', attribution: '© OpenWeatherMap' },
  waves:    { url: 'https://tileserver.four-cast.nl/owm/wind/{z}/{x}/{y}.png', attribution: '© Four-cast' },
  currents: { url: 'https://tileserver.four-cast.nl/owm/wind/{z}/{x}/{y}.png', attribution: '© Four-cast' },
  temp:     { url: 'https://tile2.openweathermap.org/map/temp/{z}/{x}/{y}.png', attribution: '© OpenWeatherMap' },
};

function buildLeafletHtml(zones: Zone[], centerLat: number, centerLon: number, zoom: number, layer: MapLayer) {
  const markers = zones.map((z) => {
    const color = z.level === 'principiante' ? '#16A34A' : z.level === 'intermedio' ? '#EA580C' : '#DC2626';
    return `
      L.circleMarker([${z.latitude}, ${z.longitude}], {
        radius: 13, color: '#fff', fillColor: '${color}', fillOpacity: 0.9, weight: 3,
      }).addTo(map)
      .bindPopup('<b>${z.name}</b><br/>${z.type} · ${z.level}<br/><small>${z.species.join(', ')}</small>');
    `;
  }).join('\n');

  // Weather overlay tile (RainViewer for precipitation, otherwise generic color overlay)
  const weatherOverlays: Record<MapLayer, string> = {
    zones:    '',
    wind:     `L.tileLayer('https://tiles.openweathermap.org/map/wind_new/{z}/{x}/{y}.png?appid=439d4b804bc8187953eb36d2a8c26a02',{opacity:0.6,attribution:'© OWM'}).addTo(map);`,
    waves:    `L.tileLayer('https://tiles.openweathermap.org/map/waves_height/{z}/{x}/{y}.png?appid=439d4b804bc8187953eb36d2a8c26a02',{opacity:0.6,attribution:'© OWM'}).addTo(map);`,
    currents: `L.tileLayer('https://tiles.openweathermap.org/map/currents/{z}/{x}/{y}.png?appid=439d4b804bc8187953eb36d2a8c26a02',{opacity:0.6,attribution:'© OWM'}).addTo(map);`,
    temp:     `L.tileLayer('https://tiles.openweathermap.org/map/temp_new/{z}/{x}/{y}.png?appid=439d4b804bc8187953eb36d2a8c26a02',{opacity:0.6,attribution:'© OWM'}).addTo(map);`,
  };

  return `<!DOCTYPE html><html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>* { margin:0;padding:0;box-sizing:border-box } html,body,#map { width:100%;height:100% }</style>
</head>
<body>
  <div id="map"></div>
  <script>
    var map = L.map('map').setView([${centerLat},${centerLon}], ${zoom});
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap', maxZoom: 18,
    }).addTo(map);
    ${weatherOverlays[layer]}
    ${markers}
  </script>
</body></html>`;
}

// ─── Componente del mapa ──────────────────────────────────────────────────────
function ZoneMap({ zones, centerLat, centerLon, zoom = MAP_ZOOM, height = 380, layer = 'zones' }: {
  zones: Zone[]; centerLat: number; centerLon: number; zoom?: number; height?: number; layer?: MapLayer;
}) {
  const html = buildLeafletHtml(zones, centerLat, centerLon, zoom, layer);
  if (Platform.OS === 'web') {
    return (
      <iframe
        srcDoc={html}
        style={{ width: '100%', height, border: 'none' } as any}
        title="Mapa de zonas de pesca"
        sandbox="allow-scripts allow-same-origin"
      />
    );
  }
  const { WebView } = require('react-native-webview');
  return (
    <View style={{ height }}>
      <WebView
        source={{ html }}
        style={{ flex: 1 }}
        javaScriptEnabled
        domStorageEnabled
        originWhitelist={['*']}
        mixedContentMode="always"
        scrollEnabled={false}
      />
    </View>
  );
}

// ─── Foto de zona ─────────────────────────────────────────────────────────────
function ZonePhoto({ wikimedia, style }: { wikimedia: string; style?: any }) {
  const photo = useZonePhoto(wikimedia);
  if (!photo) {
    return (
      <View style={[{ backgroundColor: '#E2E8F0', alignItems: 'center', justifyContent: 'center' }, style]}>
        <MaterialIcons name="landscape" size={32} color="#94A3B8" />
      </View>
    );
  }
  return <Image source={{ uri: photo }} style={style} resizeMode="cover" />;
}

// ─── Modal detalle de zona ────────────────────────────────────────────────────
function ZoneDetailModal({ zone, onClose, favorited, onFavorite, distanceKm }: {
  zone: Zone; onClose: () => void; favorited: boolean; onFavorite: () => void; distanceKm?: number;
}) {
  const color = LEVEL_COLORS[zone.level];
  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 }}>
          <Text style={{ fontSize: 18, fontWeight: '800', color: '#0F172A', flex: 1 }}>{zone.name}</Text>
          <TouchableOpacity onPress={onClose}>
            <MaterialIcons name="close" size={24} color="#0F172A" />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
          {/* Foto de la playa */}
          <ZonePhoto wikimedia={zone.wikimedia} style={{ width: '100%', height: 200 }} />

          <View style={{ padding: 16 }}>
            {/* Badges */}
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
              <View style={{ backgroundColor: `${color}20`, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 5, borderWidth: 1, borderColor: `${color}40` }}>
                <Text style={{ color, fontWeight: '800', fontSize: 12 }}>
                  {LEVEL_EMOJI[zone.level]} {zone.level.charAt(0).toUpperCase() + zone.level.slice(1)}
                </Text>
              </View>
              <View style={{ backgroundColor: '#F1F5F9', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 5 }}>
                <Text style={{ color: '#0F172A', fontWeight: '700', fontSize: 12 }}>{zone.type}</Text>
              </View>
              {distanceKm !== undefined && (
                <View style={{ backgroundColor: `${COLORS.info}15`, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 5, borderWidth: 1, borderColor: `${COLORS.info}30` }}>
                  <Text style={{ color: COLORS.info, fontWeight: '800', fontSize: 12 }}>
                    📍 {fmtKm(distanceKm)} de ti
                  </Text>
                </View>
              )}
            </View>

            {/* Mini mapa */}
            <View style={{ borderRadius: 16, overflow: 'hidden', marginBottom: 14 }}>
              <ZoneMap zones={[zone]} centerLat={zone.latitude} centerLon={zone.longitude} zoom={13} height={180} />
            </View>

            <CardBox>
              <Text style={{ fontWeight: '800', color: '#0F172A', marginBottom: 6 }}>Descripción</Text>
              <Text style={{ color: '#64748B', lineHeight: 20 }}>{zone.description}</Text>
            </CardBox>

            <CardBox>
              <Text style={{ fontWeight: '800', color: '#0F172A', marginBottom: 10 }}>Especies probables</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {zone.species.map((s) => (
                  <View key={s} style={{ backgroundColor: `${COLORS.success}15`, borderRadius: 999, paddingHorizontal: 11, paddingVertical: 5, borderWidth: 1, borderColor: `${COLORS.success}30` }}>
                    <Text style={{ color: COLORS.success, fontWeight: '700', fontSize: 12 }}>🐟 {s}</Text>
                  </View>
                ))}
              </View>
            </CardBox>

            <CardBox>
              <Text style={{ fontWeight: '800', color: '#0F172A', marginBottom: 6 }}>Coordenadas</Text>
              <Text style={{ color: '#64748B', fontFamily: 'monospace' }}>
                {zone.latitude.toFixed(4)}° N, {Math.abs(zone.longitude).toFixed(4)}° O
              </Text>
            </CardBox>

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
              <TouchableOpacity
                onPress={onFavorite}
                style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: 14, borderWidth: 1, borderColor: favorited ? COLORS.danger : '#E2E8F0', padding: 13, backgroundColor: favorited ? `${COLORS.danger}10` : '#fff' }}
              >
                <MaterialIcons name={favorited ? 'favorite' : 'favorite-border'} size={20} color={favorited ? COLORS.danger : '#0F172A'} />
                <Text style={{ fontWeight: '800', color: favorited ? COLORS.danger : '#0F172A' }}>{favorited ? 'Guardado' : 'Guardar'}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={onClose}
                style={{ flex: 1, backgroundColor: COLORS.ocean, borderRadius: 14, padding: 13, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6 }}
              >
                <MaterialIcons name="navigation" size={18} color="#fff" />
                <Text style={{ color: '#fff', fontWeight: '800' }}>Navegar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

// ─── Tarjeta de zona en la lista ──────────────────────────────────────────────
function ZoneCard({ zone, distanceKm, favorited, onPress, onFavorite }: {
  zone: Zone; distanceKm?: number; favorited: boolean; onPress: () => void; onFavorite: () => void;
}) {
  const photo = useZonePhoto(zone.wikimedia);
  const color = LEVEL_COLORS[zone.level];
  return (
    <TouchableOpacity onPress={onPress} style={{ marginBottom: 12 }}>
      <View style={{ borderRadius: 16, overflow: 'hidden', backgroundColor: '#fff', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8 }}>
        {/* Foto */}
        <View style={{ height: 130, backgroundColor: '#E2E8F0' }}>
          {photo
            ? <Image source={{ uri: photo }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
            : <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                <MaterialIcons name="landscape" size={36} color="#94A3B8" />
              </View>
          }
          {/* Overlay distancia */}
          {distanceKm !== undefined && (
            <View style={{ position: 'absolute', top: 10, left: 10, backgroundColor: 'rgba(15,23,42,0.75)', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 }}>
              <Text style={{ color: '#fff', fontSize: 11, fontWeight: '800' }}>📍 {fmtKm(distanceKm)}</Text>
            </View>
          )}
          {/* Overlay nivel */}
          <View style={{ position: 'absolute', top: 10, right: 10, backgroundColor: color, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 }}>
            <Text style={{ color: '#fff', fontSize: 11, fontWeight: '800' }}>{LEVEL_EMOJI[zone.level]} {zone.level}</Text>
          </View>
        </View>

        {/* Info */}
        <View style={{ padding: 12, flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontWeight: '800', color: '#0F172A', fontSize: 14 }}>{zone.name}</Text>
            <Text style={{ color: '#64748B', fontSize: 12, marginTop: 2 }}>
              {zone.type} · {zone.species.slice(0, 2).join(', ')}
            </Text>
          </View>
          <TouchableOpacity onPress={onFavorite} style={{ padding: 6 }}>
            <MaterialIcons
              name={favorited ? 'favorite' : 'favorite-border'}
              size={22}
              color={favorited ? COLORS.danger : '#94A3B8'}
            />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ─── Banner de ubicación ──────────────────────────────────────────────────────
function LocationBanner({ status, onRequest }: { status: 'idle' | 'loading' | 'granted' | 'denied'; onRequest: () => void }) {
  if (status === 'granted') return null;
  return (
    <TouchableOpacity
      onPress={onRequest}
      style={{ marginHorizontal: 16, marginBottom: 12, backgroundColor: status === 'denied' ? `${COLORS.danger}10` : `${COLORS.info}10`, borderRadius: 14, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderColor: status === 'denied' ? `${COLORS.danger}30` : `${COLORS.info}30` }}
    >
      {status === 'loading'
        ? <ActivityIndicator size="small" color={COLORS.info} />
        : <MaterialIcons name="my-location" size={20} color={status === 'denied' ? COLORS.danger : COLORS.info} />
      }
      <View style={{ flex: 1 }}>
        <Text style={{ fontWeight: '800', color: '#0F172A', fontSize: 13 }}>
          {status === 'denied' ? 'Ubicación denegada' : 'Activar ubicación'}
        </Text>
        <Text style={{ color: '#64748B', fontSize: 11, marginTop: 1 }}>
          {status === 'denied'
            ? 'Actívala en ajustes para ver zonas cercanas'
            : 'Toca para ver las zonas de pesca más cercanas a ti'}
        </Text>
      </View>
      {status !== 'loading' && <MaterialIcons name="chevron-right" size={20} color="#94A3B8" />}
    </TouchableOpacity>
  );
}

// ─── Pantalla principal ───────────────────────────────────────────────────────
export default function MapScreen() {
  const [levelFilter, setLevelFilter]       = useState<Level>('todos');
  const [selectedZone, setSelectedZone]     = useState<Zone | null>(null);
  const [favorites, setFavorites]           = useState<Set<string>>(new Set());
  const [userLocation, setUserLocation]     = useState<{ lat: number; lon: number } | null>(null);
  const [locationStatus, setLocationStatus] = useState<'idle' | 'loading' | 'granted' | 'denied'>('idle');
  const [activeLayer, setActiveLayer]       = useState<MapLayer>('zones');

  const toggleFavorite = (id: string) =>
    setFavorites((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  // Pedir ubicación
  const requestLocation = useCallback(async () => {
    setLocationStatus('loading');
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') { setLocationStatus('denied'); return; }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setUserLocation({ lat: loc.coords.latitude, lon: loc.coords.longitude });
      setLocationStatus('granted');
    } catch {
      setLocationStatus('denied');
    }
  }, []);

  // Intentar ubicación automáticamente al montar
  useEffect(() => {
    Location.getForegroundPermissionsAsync().then(({ status }) => {
      if (status === 'granted') requestLocation();
    });
  }, []);

  // Zonas con distancia calculada y ordenadas
  const zonesWithDistance = ALL_ZONES.map((z) => ({
    ...z,
    distanceKm: userLocation
      ? haversineKm(userLocation.lat, userLocation.lon, z.latitude, z.longitude)
      : undefined,
  })).sort((a, b) => {
    if (a.distanceKm !== undefined && b.distanceKm !== undefined) return a.distanceKm - b.distanceKm;
    return 0;
  });

  const filtered = zonesWithDistance.filter(
    (z) => levelFilter === 'todos' || z.level === levelFilter,
  );

  // Centro del mapa: ubicación del usuario si disponible, sino Zihuatanejo
  const mapCenterLat = userLocation?.lat ?? MAP_CENTER_LAT;
  const mapCenterLon = userLocation?.lon ?? MAP_CENTER_LON;

  const levels: { key: Level; label: string }[] = [
    { key: 'todos',        label: 'Todos' },
    { key: 'principiante', label: '🟢 Principiante' },
    { key: 'intermedio',   label: '🟡 Intermedio' },
    { key: 'avanzado',     label: '🔴 Avanzado' },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }} edges={['top']}>
      {selectedZone && (
        <ZoneDetailModal
          zone={selectedZone}
          onClose={() => setSelectedZone(null)}
          favorited={favorites.has(selectedZone.id)}
          onFavorite={() => toggleFavorite(selectedZone.id)}
          distanceKm={zonesWithDistance.find((z) => z.id === selectedZone.id)?.distanceKm}
        />
      )}

      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        {/* Header */}
        <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 }}>
          <Text style={{ fontSize: 22, fontWeight: '800', color: '#0F172A' }}>Zonas de pesca</Text>
          <Text style={{ color: '#64748B', fontSize: 13, marginTop: 2 }}>
            {userLocation ? `${filtered.length} zonas encontradas cerca de ti` : `${filtered.length} zonas disponibles`}
          </Text>
        </View>

        {/* Banner de ubicación */}
        <LocationBanner status={locationStatus} onRequest={requestLocation} />

        {/* Mapa con todas las zonas filtradas */}
        <View style={{ marginHorizontal: 16, borderRadius: 16, overflow: 'hidden', marginBottom: 12, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 12 }}>
          <ZoneMap
            zones={filtered}
            centerLat={mapCenterLat}
            centerLon={mapCenterLon}
            zoom={userLocation ? 10 : MAP_ZOOM}
            height={380}
            layer={activeLayer}
          />
        </View>

        {/* Selector de capas meteorológicas */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 8, marginBottom: 12 }}>
          {([
            { id: 'zones',    label: '📍 Zonas',       color: COLORS.success },
            { id: 'wind',     label: '💨 Viento',       color: COLORS.info },
            { id: 'waves',    label: '🌊 Olas',         color: COLORS.ocean },
            { id: 'currents', label: '🔄 Corrientes',   color: COLORS.purple ?? '#7C3AED' },
            { id: 'temp',     label: '🌡 Temp. mar',    color: COLORS.danger },
          ] as { id: MapLayer; label: string; color: string }[]).map((l) => (
            <TouchableOpacity
              key={l.id}
              onPress={() => setActiveLayer(l.id)}
              style={{
                paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999,
                backgroundColor: activeLayer === l.id ? l.color : '#fff',
                borderWidth: 1.5, borderColor: activeLayer === l.id ? l.color : '#E2E8F0',
              }}
            >
              <Text style={{ fontWeight: '700', color: activeLayer === l.id ? '#fff' : '#0F172A', fontSize: 13 }}>
                {l.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Filtros de nivel */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 8, marginBottom: 14 }}>
          {levels.map((l) => (
            <TouchableOpacity
              key={l.key}
              onPress={() => setLevelFilter(l.key)}
              style={{ paddingHorizontal: 16, paddingVertical: 8, borderRadius: 999, backgroundColor: levelFilter === l.key ? COLORS.ocean : '#fff', borderWidth: 1, borderColor: levelFilter === l.key ? COLORS.ocean : '#E2E8F0' }}
            >
              <Text style={{ fontWeight: '700', color: levelFilter === l.key ? '#fff' : '#0F172A', fontSize: 13 }}>
                {l.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Leyenda */}
        <View style={{ flexDirection: 'row', gap: 12, paddingHorizontal: 16, marginBottom: 14 }}>
          {[['#16A34A', 'Principiante'], ['#EA580C', 'Intermedio'], ['#DC2626', 'Avanzado']].map(([c, l]) => (
            <View key={l} style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
              <View style={{ width: 12, height: 12, borderRadius: 99, backgroundColor: c }} />
              <Text style={{ color: '#64748B', fontSize: 12, fontWeight: '600' }}>{l}</Text>
            </View>
          ))}
        </View>

        {/* Lista de zonas con fotos y distancia */}
        <View style={{ paddingHorizontal: 16 }}>
          {userLocation && (
            <Text style={{ fontSize: 13, fontWeight: '700', color: '#64748B', marginBottom: 10 }}>
              Ordenadas por distancia a tu ubicación
            </Text>
          )}
          {filtered.map((zone) => (
            <ZoneCard
              key={zone.id}
              zone={zone}
              distanceKm={zone.distanceKm}
              favorited={favorites.has(zone.id)}
              onPress={() => setSelectedZone(zone)}
              onFavorite={() => toggleFavorite(zone.id)}
            />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

import React, { useState, useRef } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, Modal, Platform,
  Dimensions, LayoutChangeEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS } from '@/lib/constants';
import { CardBox } from '@/components/ui/CardBox';
import { StatusPill } from '@/components/ui/StatusPill';

const SEED_ZONES = [
  { id: 'z1', name: 'Bajo de Chila',        level: 'intermedio',   type: 'Offshore', latitude: 17.58, longitude: -101.62, description: 'Zona de aguas profundas ideal para pez vela y marlín.', species: ['Pez vela', 'Marlín azul', 'Dorado'] },
  { id: 'z2', name: 'La Ropa',              level: 'principiante', type: 'Playa',    latitude: 17.63, longitude: -101.55, description: 'Playa protegida perfecta para principiantes y pesca desde la orilla.', species: ['Jurel', 'Sierra', 'Robalo'] },
  { id: 'z3', name: 'Punta Ixtapa',         level: 'avanzado',     type: 'Rocas',    latitude: 17.67, longitude: -101.64, description: 'Zona rocosa con corrientes fuertes. Requiere experiencia y equipo adecuado.', species: ['Atún aleta amarilla', 'Wahoo', 'Pez vela'] },
  { id: 'z4', name: 'Bahía de Zihuatanejo', level: 'principiante', type: 'Bahía',    latitude: 17.64, longitude: -101.55, description: 'Bahía tranquila ideal para pesca recreativa y avistamiento de fauna.', species: ['Huachinango', 'Robalo', 'Mojarra'] },
  { id: 'z5', name: 'Morro de Petatlán',    level: 'avanzado',     type: 'Offshore', latitude: 17.52, longitude: -101.71, description: 'Zona de pesca de altura con gran diversidad de especies pelágicas.', species: ['Marlín rayado', 'Atún', 'Dorado', 'Wahoo'] },
];

type Level = 'todos' | 'principiante' | 'intermedio' | 'avanzado';

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

type MapLayer = 'wind' | 'waves' | 'currents' | 'temp' | 'zones';

// ─── Parámetros del mapa centrado en Zihuatanejo ──────────────────────────────
// zoom=9: cubre aprox ±0.2° lat/lon en pantalla de ~380px
const MAP_CENTER_LAT  = 17.62;
const MAP_CENTER_LON  = -101.60;
const MAP_ZOOM        = 9;
// tiles 256px, escala: a zoom 9, 1 tile = 360/512 grados ≈ 0.703°/tile
// pixels por grado a zoom 9 = 256 * 2^9 / 360 ≈ 364 px/°
const PX_PER_DEG_LAT  = 364;
const PX_PER_DEG_LON  = 364;

/** Convierte coordenadas geográficas a posición px relativa al centro del mapa */
function latLonToPixel(
  lat: number, lon: number,
  mapW: number, mapH: number,
): { x: number; y: number } {
  const dx = (lon - MAP_CENTER_LON) * PX_PER_DEG_LON;
  const dy = (MAP_CENTER_LAT - lat) * PX_PER_DEG_LAT;
  return { x: mapW / 2 + dx, y: mapH / 2 + dy };
}

// ─── Windy embed URL directa (sin iframe anidado) ────────────────────────────
const WINDY_OVERLAY: Record<MapLayer, string> = {
  wind:     'wind',
  waves:    'waves',
  currents: 'currents',
  temp:     'sst',
  zones:    'wind',
};

function buildWindyUrl(layer: MapLayer) {
  const overlay = WINDY_OVERLAY[layer];
  return (
    `https://embed.windy.com/embed2.html` +
    `?lat=${MAP_CENTER_LAT}&lon=${MAP_CENTER_LON}` +
    `&detailLat=${MAP_CENTER_LAT}&detailLon=${MAP_CENTER_LON}` +
    `&zoom=${MAP_ZOOM}&level=surface&overlay=${overlay}` +
    `&product=ecmwf&menu=&message=&marker=&calendar=now` +
    `&pressure=&type=map&location=coordinates&detail=` +
    `&metricWind=km%2Fh&metricTemp=%C2%B0C&radarRange=-1`
  );
}

// ─── HTML autónomo con OpenStreetMap + Leaflet (fallback para cuando Windy no carga) ─
function buildLeafletHtml(zones: typeof SEED_ZONES, layer: MapLayer) {
  const overlay = WINDY_OVERLAY[layer];
  const markers = zones.map((z) => {
    const color = z.level === 'principiante' ? '#16A34A' : z.level === 'intermedio' ? '#EA580C' : '#DC2626';
    return `
      L.circleMarker([${z.latitude}, ${z.longitude}], {
        radius: 14, color: '#fff', fillColor: '${color}',
        fillOpacity: 0.9, weight: 3,
      }).addTo(map)
      .bindPopup('<b>${z.name}</b><br/>${z.type} · ${z.level}<br/><small>${z.species.join(', ')}</small>');
    `;
  }).join('\n');

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    * { margin:0;padding:0;box-sizing:border-box }
    html,body,#map { width:100%;height:100% }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    var map = L.map('map', { zoomControl:true }).setView([${MAP_CENTER_LAT},${MAP_CENTER_LON}], ${MAP_ZOOM});
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap',
      maxZoom: 18,
    }).addTo(map);
    ${markers}
  </script>
</body>
</html>`;
}

// ─── Componente del mapa ──────────────────────────────────────────────────────
function WindyMap({
  zones, filter, layer,
  height = 380,
  showMarkers = true,
}: {
  zones: typeof SEED_ZONES;
  filter: Level;
  layer: MapLayer;
  height?: number;
  showMarkers?: boolean;
}) {
  const [mapSize, setMapSize] = useState({ w: Dimensions.get('window').width - 32, h: height });
  const filtered = zones.filter((z) => filter === 'todos' || z.level === filter);

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height: h } = e.nativeEvent.layout;
    setMapSize({ w: width, h });
  };

  // Web: iframe directo a Windy
  if (Platform.OS === 'web') {
    return (
      <View style={{ height, position: 'relative' }} onLayout={onLayout}>
        <iframe
          src={buildWindyUrl(layer)}
          style={{ width: '100%', height: '100%', border: 'none' } as any}
          title="Mapa meteorológico"
          allowFullScreen
        />
        {/* Marcadores SVG superpuestos en web */}
        <svg
          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' } as any}
        >
          {showMarkers && filtered.map((z) => {
            const { x, y } = latLonToPixel(z.latitude, z.longitude, mapSize.w, mapSize.h);
            const color = LEVEL_COLORS[z.level];
            return (
              <g key={z.id}>
                <circle cx={x} cy={y} r={12} fill={color} stroke="#fff" strokeWidth={2.5} opacity={0.92} />
              </g>
            );
          })}
        </svg>
      </View>
    );
  }

  // Native: WebView con HTML de Leaflet + OpenStreetMap (100% autónomo, sin iframes)
  const { WebView } = require('react-native-webview');
  const html = buildLeafletHtml(filtered, layer);

  return (
    <View style={{ height }} onLayout={onLayout}>
      <WebView
        source={{ html }}
        style={{ flex: 1 }}
        javaScriptEnabled
        domStorageEnabled
        originWhitelist={['*']}
        mixedContentMode="always"
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

// ─── Zone detail modal ────────────────────────────────────────────────────────
function ZoneDetailModal({
  zone,
  onClose,
  favorited,
  onFavorite,
}: {
  zone: typeof SEED_ZONES[0];
  onClose: () => void;
  favorited: boolean;
  onFavorite: () => void;
}) {
  const color = LEVEL_COLORS[zone.level];
  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 }}>
          <Text style={{ fontSize: 18, fontWeight: '800', color: '#0F172A' }}>{zone.name}</Text>
          <TouchableOpacity onPress={onClose}>
            <MaterialIcons name="close" size={24} color="#0F172A" />
          </TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
          {/* Mini mapa de la zona */}
          <View style={{ borderRadius: 16, overflow: 'hidden', marginBottom: 14 }}>
            <WindyMap
              zones={SEED_ZONES.filter((z) => z.id === zone.id)}
              filter="todos"
              layer="zones"
              height={200}
            />
          </View>

          {/* Badges */}
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
            <View style={{ backgroundColor: `${color}20`, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 5, borderWidth: 1, borderColor: `${color}40` }}>
              <Text style={{ color, fontWeight: '800', fontSize: 12 }}>
                {LEVEL_EMOJI[zone.level]} {zone.level.charAt(0).toUpperCase() + zone.level.slice(1)}
              </Text>
            </View>
            <View style={{ backgroundColor: '#F1F5F9', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 5 }}>
              <Text style={{ color: '#0F172A', fontWeight: '700', fontSize: 12 }}>{zone.type}</Text>
            </View>
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
              style={{
                flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                gap: 6, borderRadius: 14, borderWidth: 1,
                borderColor: favorited ? COLORS.danger : '#E2E8F0',
                padding: 13,
                backgroundColor: favorited ? `${COLORS.danger}10` : '#fff',
              }}
            >
              <MaterialIcons name={favorited ? 'favorite' : 'favorite-border'} size={20} color={favorited ? COLORS.danger : '#0F172A'} />
              <Text style={{ fontWeight: '800', color: favorited ? COLORS.danger : '#0F172A' }}>
                {favorited ? 'Guardado' : 'Guardar'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onClose}
              style={{ flex: 1, backgroundColor: COLORS.ocean, borderRadius: 14, padding: 13, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6 }}
            >
              <MaterialIcons name="navigation" size={18} color="#fff" />
              <Text style={{ color: '#fff', fontWeight: '800' }}>Navegar</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function MapScreen() {
  const [levelFilter, setLevelFilter]   = useState<Level>('todos');
  const [selectedZone, setSelectedZone] = useState<typeof SEED_ZONES[0] | null>(null);
  const [favorites, setFavorites]       = useState<Set<string>>(new Set());
  const [activeLayer, setActiveLayer]   = useState<MapLayer>('wind');

  const filtered = SEED_ZONES.filter((z) => levelFilter === 'todos' || z.level === levelFilter);

  const toggleFavorite = (id: string) =>
    setFavorites((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

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
        />
      )}

      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        {/* Mapa principal */}
        <View style={{
          margin: 16, borderRadius: 16, overflow: 'hidden',
          elevation: 4, shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 12,
        }}>
          <WindyMap zones={SEED_ZONES} filter={levelFilter} layer={activeLayer} height={400} />
        </View>

        {/* Selector de capas meteorológicas */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 8, marginBottom: 12 }}>
          {([
            { id: 'wind',     label: '💨 Viento',     color: COLORS.info },
            { id: 'waves',    label: '🌊 Olas',       color: COLORS.ocean },
            { id: 'currents', label: '🔄 Corrientes', color: COLORS.purple },
            { id: 'temp',     label: '🌡 Temp. mar',  color: COLORS.danger },
            { id: 'zones',    label: '📍 Solo zonas', color: COLORS.success },
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

        {/* Leyenda colores de nivel */}
        <View style={{ flexDirection: 'row', gap: 12, paddingHorizontal: 16, marginBottom: 12 }}>
          {[['#16A34A', 'Principiante'], ['#EA580C', 'Intermedio'], ['#DC2626', 'Avanzado']].map(([c, l]) => (
            <View key={l} style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
              <View style={{ width: 12, height: 12, borderRadius: 99, backgroundColor: c }} />
              <Text style={{ color: '#64748B', fontSize: 12, fontWeight: '600' }}>{l}</Text>
            </View>
          ))}
        </View>

        {/* Filtros de nivel */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 8, marginBottom: 14 }}>
          {levels.map((l) => (
            <TouchableOpacity
              key={l.key}
              onPress={() => setLevelFilter(l.key)}
              style={{
                paddingHorizontal: 16, paddingVertical: 8, borderRadius: 999,
                backgroundColor: levelFilter === l.key ? COLORS.ocean : '#fff',
                borderWidth: 1, borderColor: levelFilter === l.key ? COLORS.ocean : '#E2E8F0',
              }}
            >
              <Text style={{ fontWeight: '700', color: levelFilter === l.key ? '#fff' : '#0F172A', fontSize: 13 }}>
                {l.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Lista de zonas */}
        <View style={{ paddingHorizontal: 16 }}>
          {filtered.map((zone) => (
            <TouchableOpacity key={zone.id} onPress={() => setSelectedZone(zone)}>
              <CardBox>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <View style={{ width: 46, height: 46, borderRadius: 99, backgroundColor: `${LEVEL_COLORS[zone.level]}20`, alignItems: 'center', justifyContent: 'center' }}>
                    <MaterialIcons name="place" size={24} color={LEVEL_COLORS[zone.level]} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontWeight: '800', color: '#0F172A', fontSize: 14 }}>{zone.name}</Text>
                    <Text style={{ color: '#64748B', fontSize: 12, marginTop: 2 }}>
                      {zone.type} · {zone.species.slice(0, 2).join(', ')}
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-end', gap: 6 }}>
                    <StatusPill status={zone.level.charAt(0).toUpperCase() + zone.level.slice(1)} />
                    <TouchableOpacity onPress={() => toggleFavorite(zone.id)}>
                      <MaterialIcons
                        name={favorites.has(zone.id) ? 'favorite' : 'favorite-border'}
                        size={20}
                        color={favorites.has(zone.id) ? COLORS.danger : '#94A3B8'}
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              </CardBox>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

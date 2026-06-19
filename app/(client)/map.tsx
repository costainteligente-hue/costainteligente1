import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, Modal, Platform,
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

// ─── Windy embed + marcadores Leaflet superpuestos ────────────────────────────
function buildMapHtml(zones: typeof SEED_ZONES, filter: Level, layer: MapLayer) {
  const filtered = zones.filter((z) => filter === 'todos' || z.level === filter);

  // Parámetro de capa de Windy
  const windyOverlay: Record<MapLayer, string> = {
    wind:     'wind',
    waves:    'waves',
    currents: 'currents',
    temp:     'sst',     // sea surface temperature
    zones:    'wind',    // default cuando se muestran zonas
  };
  const overlay = windyOverlay[layer];

  const markers = filtered.map((z) => {
    const color = z.level === 'principiante' ? '#16A34A' : z.level === 'intermedio' ? '#EA580C' : '#DC2626';
    return `
      L.circleMarker([${z.latitude}, ${z.longitude}], {
        radius: 16, color: '#fff', fillColor: '${color}',
        fillOpacity: 0.9, weight: 3,
      })
      .addTo(map)
      .bindPopup(\`
        <div style="font-family:sans-serif;min-width:190px;padding:4px">
          <b style="font-size:14px;color:#0F172A">${z.name}</b><br/>
          <span style="color:#64748B;font-size:12px">${z.type} · ${z.level}</span><br/>
          <div style="margin-top:6px;font-size:12px;color:#374151">${z.description}</div>
          <div style="margin-top:8px;font-size:12px;color:${color};font-weight:700">
            🐟 ${z.species.join(' · ')}
          </div>
        </div>
      \`, { maxWidth: 230 });
    `;
  }).join('\n');

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
  <style>
    * { margin:0;padding:0;box-sizing:border-box }
    html,body { width:100%;height:100% }
    #windy { position:absolute;inset:0 }
    #overlay-map { position:absolute;inset:0;z-index:10;pointer-events:none }
    #overlay-map .leaflet-interactive { pointer-events:all }
    .leaflet-popup-content-wrapper { border-radius:12px;box-shadow:0 4px 20px rgba(0,0,0,0.15) }
    .leaflet-control-zoom { display:none }
  </style>
</head>
<body>
  <!-- Windy iframe como fondo -->
  <iframe
    id="windy"
    src="https://embed.windy.com/embed2.html?lat=17.64&lon=-101.55&detailLat=17.64&detailLon=-101.55&width=100%25&height=100%25&zoom=9&level=surface&overlay=${overlay}&product=ecmwf&menu=&message=&marker=&calendar=now&pressure=&type=map&location=coordinates&detail=&metricWind=km%2Fh&metricTemp=%C2%B0C&radarRange=-1"
    frameborder="0"
    style="width:100%;height:100%;border:none"
    allowfullscreen
  ></iframe>

  <!-- Mapa Leaflet transparente encima para los marcadores -->
  <div id="overlay-map"></div>

  <script>
    // Esperar a que cargue el iframe antes de renderizar el mapa
    window.addEventListener('load', function() {
      var map = L.map('overlay-map', {
        zoomControl: false,
        attributionControl: false,
        dragging: false,
        scrollWheelZoom: false,
        doubleClickZoom: false,
        touchZoom: false,
        boxZoom: false,
        keyboard: false,
      }).setView([17.64, -101.55], 9);

      // Tile transparente (solo para que Leaflet tenga un mapa de referencia)
      L.tileLayer('data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', {
        opacity: 0, maxZoom: 18,
      }).addTo(map);

      ${markers}
    });
  </script>
</body>
</html>`;
}

// ─── Componente del mapa ──────────────────────────────────────────────────────
function LeafletMap({ zones, filter, layer }: { zones: typeof SEED_ZONES; filter: Level; layer: MapLayer }) {
  const html = buildMapHtml(zones, filter, layer);

  if (Platform.OS === 'web') {
    return (
      <iframe
        srcDoc={html}
        style={{ width: '100%', height: 400, border: 'none', borderRadius: 16 } as any}
        title="Mapa meteorológico y zonas de pesca"
        sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
      />
    );
  }

  const { WebView } = require('react-native-webview');
  return (
    <WebView
      source={{ html }}
      style={{ height: 380, borderRadius: 16, overflow: 'hidden' }}
      javaScriptEnabled
      domStorageEnabled
      scrollEnabled={false}
      originWhitelist={['*']}
      mixedContentMode="always"
      allowsInlineMediaPlayback
      mediaPlaybackRequiresUserAction={false}
    />
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
          <View style={{ height: 200, borderRadius: 16, overflow: 'hidden', marginBottom: 14 }}>
            <LeafletMap
              zones={SEED_ZONES.filter((z) => z.id === zone.id)}
              filter="todos"
              layer="zones"
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
  const [levelFilter, setLevelFilter] = useState<Level>('todos');
  const [selectedZone, setSelectedZone]   = useState<typeof SEED_ZONES[0] | null>(null);
  const [favorites, setFavorites]         = useState<Set<string>>(new Set());
  const [activeLayer, setActiveLayer]     = useState<MapLayer>('wind');

  const filtered = SEED_ZONES.filter((z) => levelFilter === 'todos' || z.level === levelFilter);

  const toggleFavorite = (id: string) =>
    setFavorites((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const levels: { key: Level; label: string }[] = [
    { key: 'todos', label: 'Todos' },
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
        {/* Mapa real con capas meteorológicas */}
        <View style={{ margin: 16, height: 380, borderRadius: 16, overflow: 'hidden', elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 12 }}>
          <LeafletMap zones={SEED_ZONES} filter={levelFilter} layer={activeLayer} />
        </View>

        {/* Selector de capas meteorológicas */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 8, marginBottom: 12 }}>
          {([
            { id: 'wind',     label: '💨 Viento',        color: COLORS.info },
            { id: 'waves',    label: '🌊 Olas',          color: COLORS.ocean },
            { id: 'currents', label: '🔄 Corrientes',    color: COLORS.purple },
            { id: 'temp',     label: '🌡 Temp. mar',     color: COLORS.danger },
            { id: 'zones',    label: '📍 Solo zonas',    color: COLORS.success },
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

        {/* Filtros */}
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

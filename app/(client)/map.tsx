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

// ─── Leaflet map HTML (OpenStreetMap + marcadores reales) ─────────────────────
function buildMapHtml(zones: typeof SEED_ZONES, filter: Level) {
  const filtered = zones.filter((z) => filter === 'todos' || z.level === filter);
  const markers = filtered.map((z) => {
    const color = z.level === 'principiante' ? '#16A34A' : z.level === 'intermedio' ? '#EA580C' : '#DC2626';
    return `
      L.circleMarker([${z.latitude}, ${z.longitude}], {
        radius: 14, color: '${color}', fillColor: '${color}',
        fillOpacity: 0.85, weight: 3,
      })
      .addTo(map)
      .bindPopup(\`
        <div style="font-family:sans-serif;min-width:180px">
          <b style="font-size:14px;color:#0F172A">${z.name}</b><br/>
          <span style="color:#64748B;font-size:12px">${z.type} · ${z.level}</span><br/>
          <div style="margin-top:6px;font-size:12px;color:#0F172A99">${z.description}</div>
          <div style="margin-top:8px;font-size:11px;color:${color};font-weight:700">
            🐟 ${z.species.join(' · ')}
          </div>
        </div>
      \`, { maxWidth: 220 });
    `;
  }).join('\n');

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body, #map { width: 100%; height: 100%; }
    .leaflet-popup-content-wrapper { border-radius: 12px; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    var map = L.map('map', { zoomControl: true }).setView([17.6392, -101.5507], 11);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);
    ${markers}
  </script>
</body>
</html>`;
}

// ─── Componente del mapa ──────────────────────────────────────────────────────
function LeafletMap({ zones, filter }: { zones: typeof SEED_ZONES; filter: Level }) {
  const html = buildMapHtml(zones, filter);

  if (Platform.OS === 'web') {
    return (
      <iframe
        srcDoc={html}
        style={{
          width: '100%', height: 380, border: 'none',
          borderRadius: 16, overflow: 'hidden',
        } as any}
        title="Mapa de zonas de pesca"
        sandbox="allow-scripts allow-same-origin"
      />
    );
  }

  // Native: usar WebView
  const { WebView } = require('react-native-webview');
  return (
    <WebView
      source={{ html }}
      style={{ height: 340, borderRadius: 16, overflow: 'hidden' }}
      javaScriptEnabled
      domStorageEnabled
      scrollEnabled={false}
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
        {/* Mapa real */}
        <View style={{ margin: 16, borderRadius: 16, overflow: 'hidden', elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 12 }}>
          <LeafletMap zones={SEED_ZONES} filter={levelFilter} />
        </View>

        {/* Leyenda */}
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

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
import { ZONE_ID_TO_PHOTO } from '@/lib/zone-photos';

// ─── Zonas de pesca — México completo (costas Pacífico, Golfo y Caribe) ──────
const ALL_ZONES = [
  // ── GUERRERO / ZIHUATANEJO-IXTAPA ──────────────────────────────────────────
  { id: 'z1',  name: 'Bajo de Chila',           level: 'intermedio',   type: 'Offshore',    latitude: 17.58,   longitude: -101.62,  description: 'Zona de aguas profundas ideal para pez vela y marlín.',                   species: ['Pez vela', 'Marlín azul', 'Dorado'],               wikimedia: 'Zihuatanejo' },
  { id: 'z2',  name: 'Playa La Ropa',            level: 'principiante', type: 'Orilla',      latitude: 17.628,  longitude: -101.551, description: 'Playa protegida perfecta para pesca desde la orilla.',                    species: ['Jurel', 'Sierra', 'Robalo'],                       wikimedia: 'Playa_La_Ropa' },
  { id: 'z3',  name: 'Punta Ixtapa',             level: 'avanzado',     type: 'Rocas',       latitude: 17.672,  longitude: -101.644, description: 'Zona rocosa con corrientes fuertes.',                                     species: ['Atún aleta amarilla', 'Wahoo', 'Pez vela'],        wikimedia: 'Ixtapa' },
  { id: 'z4',  name: 'Bahía de Zihuatanejo',     level: 'principiante', type: 'Bahía',       latitude: 17.638,  longitude: -101.552, description: 'Bahía tranquila ideal para pesca recreativa.',                            species: ['Huachinango', 'Robalo', 'Mojarra'],                wikimedia: 'Bahía_de_Zihuatanejo' },
  { id: 'z5',  name: 'Morro de Petatlán',        level: 'avanzado',     type: 'Offshore',    latitude: 17.52,   longitude: -101.71,  description: 'Zona de pesca de altura con gran diversidad pelágica.',                  species: ['Marlín rayado', 'Atún', 'Dorado', 'Wahoo'],        wikimedia: 'Petatlán' },
  { id: 'z6',  name: 'Playa Las Gatas',          level: 'principiante', type: 'Orilla',      latitude: 17.622,  longitude: -101.548, description: 'Pesca desde orilla y snorkel en aguas tranquilas.',                      species: ['Pargo', 'Mojarra', 'Cabrilla'],                    wikimedia: 'Playa_Las_Gatas' },
  { id: 'z7',  name: 'Playa Larga',              level: 'principiante', type: 'Orilla',      latitude: 17.605,  longitude: -101.565, description: 'Playa extensa ideal para pesca recreativa desde la orilla.',             species: ['Robalo', 'Sierra', 'Jurel'],                       wikimedia: 'Zihuatanejo' },
  { id: 'z8',  name: 'Playa Majahua',            level: 'intermedio',   type: 'Orilla',      latitude: 17.598,  longitude: -101.588, description: 'Zona de pesca artesanal con alto volumen de capturas.',                 species: ['Sierra', 'Robalo', 'Huachinango'],                 wikimedia: 'Zihuatanejo' },
  { id: 'z9',  name: 'Barra de Potosí',          level: 'principiante', type: 'Laguna',      latitude: 17.467,  longitude: -101.35,  description: 'Laguna costera con pesca de laguna y desembocadura.',                   species: ['Robalo', 'Mojarra', 'Trucha marina'],              wikimedia: 'Petatlán' },
  // ── ACAPULCO ────────────────────────────────────────────────────────────────
  { id: 'z10', name: 'Bahía de Acapulco',        level: 'principiante', type: 'Bahía',       latitude: 16.855,  longitude: -99.89,   description: 'Bahía histórica con pesca deportiva y recreativa.',                     species: ['Pargo', 'Jurel', 'Robalo'],                        wikimedia: 'Acapulco' },
  { id: 'z11', name: 'Punta Diamante',           level: 'avanzado',     type: 'Offshore',    latitude: 16.78,   longitude: -99.76,   description: 'Zona offshore al sur de Acapulco, excelente para pez vela.',            species: ['Pez vela', 'Marlín', 'Dorado'],                    wikimedia: 'Acapulco' },
  { id: 'z12', name: 'Playa Pie de la Cuesta',   level: 'principiante', type: 'Orilla',      latitude: 16.902,  longitude: -99.976,  description: 'Pesca desde la orilla en la laguna de Coyuca.',                        species: ['Robalo', 'Mojarra', 'Lisa'],                       wikimedia: 'Acapulco' },
  // ── MICHOACÁN / LÁZARO CÁRDENAS ─────────────────────────────────────────────
  { id: 'z13', name: 'Playa Nexpa',              level: 'principiante', type: 'Orilla',      latitude: 18.42,   longitude: -102.93,  description: 'Playa de surf y pesca desde la orilla en Michoacán.',                  species: ['Robalo', 'Pargo', 'Sierra'],                       wikimedia: 'Nexpa_beach' },
  { id: 'z14', name: 'Caleta de Campos',         level: 'intermedio',   type: 'Bahía',       latitude: 18.46,   longitude: -102.72,  description: 'Pequeña bahía pesquera con gran diversidad de especies.',              species: ['Huachinango', 'Pargo', 'Cabrilla'],                wikimedia: 'Caleta_de_Campos' },
  { id: 'z15', name: 'Playa Azul',               level: 'principiante', type: 'Orilla',      latitude: 17.98,   longitude: -102.41,  description: 'Playa popular para pesca desde la orilla en Michoacán.',              species: ['Robalo', 'Jurel', 'Mojarra'],                      wikimedia: 'Playa_Azul_Michoacán' },
  // ── JALISCO / MANZANILLO ────────────────────────────────────────────────────
  { id: 'z16', name: 'Bahía de Navidad',         level: 'principiante', type: 'Bahía',       latitude: 19.2,    longitude: -104.7,   description: 'Bahía tranquila con laguna y pesca artesanal en Jalisco.',             species: ['Robalo', 'Pargo', 'Huachinango'],                  wikimedia: 'Barra_de_Navidad' },
  { id: 'z17', name: 'Manzanillo Offshore',      level: 'avanzado',     type: 'Offshore',    latitude: 19.05,   longitude: -104.25,  description: 'Aguas profundas con corrientes ricas en peces pelágicos.',             species: ['Atún', 'Pez vela', 'Marlín', 'Dorado'],            wikimedia: 'Manzanillo_Colima' },
  { id: 'z18', name: 'Playa La Audiencia',       level: 'principiante', type: 'Orilla',      latitude: 19.085,  longitude: -104.34,  description: 'Pequeña cala para pesca desde la orilla.',                             species: ['Pargo', 'Cabrilla', 'Mojarra'],                    wikimedia: 'Manzanillo_Colima' },
  // ── NAYARIT / RIVIERA NAYARIT ───────────────────────────────────────────────
  { id: 'z19', name: 'Bahía de Banderas',        level: 'intermedio',   type: 'Bahía',       latitude: 20.65,   longitude: -105.32,  description: 'Una de las bahías más grandes de México. Pesca deportiva de altura.',  species: ['Pez vela', 'Marlín', 'Dorado', 'Atún'],            wikimedia: 'Bahía_de_Banderas' },
  { id: 'z20', name: 'Sayulita',                 level: 'principiante', type: 'Orilla',      latitude: 20.87,   longitude: -105.44,  description: 'Pueblo pesquero con pesca desde la orilla y pangas.',                 species: ['Pargo', 'Jurel', 'Robalo'],                        wikimedia: 'Sayulita_Nayarit' },
  { id: 'z21', name: 'San Blas Marismas',        level: 'principiante', type: 'Manglar',     latitude: 21.55,   longitude: -105.31,  description: 'Zona de manglar rica en robalo, mojarra y lisa.',                      species: ['Robalo', 'Mojarra', 'Lisa', 'Camarón'],            wikimedia: 'San_Blas_Nayarit' },
  // ── SINALOA / MAZATLÁN ──────────────────────────────────────────────────────
  { id: 'z22', name: 'Puerto Mazatlán',          level: 'intermedio',   type: 'Offshore',    latitude: 23.18,   longitude: -106.45,  description: 'Capital del marlín. Torneos internacionales de pesca deportiva.',     species: ['Marlín rayado', 'Pez vela', 'Dorado'],             wikimedia: 'Mazatlán' },
  { id: 'z23', name: 'Isla de la Piedra',        level: 'principiante', type: 'Orilla',      latitude: 23.14,   longitude: -106.41,  description: 'Pesca desde la orilla y embarcaciones pequeñas.',                     species: ['Pargo', 'Huachinango', 'Robalo'],                  wikimedia: 'Mazatlán' },
  { id: 'z24', name: 'Bahía Santa María',        level: 'intermedio',   type: 'Bahía',       latitude: 24.98,   longitude: -108.02,  description: 'Bahía con abundante pesca de camarón y especies demersal.',           species: ['Camarón', 'Sierra', 'Robalo'],                     wikimedia: 'Sinaloa' },
  // ── BAJA CALIFORNIA SUR ────────────────────────────────────────────────────
  { id: 'z25', name: 'Cabo San Lucas',           level: 'avanzado',     type: 'Offshore',    latitude: 22.89,   longitude: -109.91,  description: 'Arco de Cabo. Zona de pesca deportiva de clase mundial.',            species: ['Marlín', 'Pez vela', 'Atún', 'Wahoo', 'Dorado'],  wikimedia: 'Cabo_San_Lucas' },
  { id: 'z26', name: 'La Paz — Espíritu Santo',  level: 'intermedio',   type: 'Isla',        latitude: 24.43,   longitude: -110.38,  description: 'Isla Espíritu Santo, reserva biosfera con pesca deportiva.',         species: ['Dorado', 'Wahoo', 'Atún', 'Pargo'],                wikimedia: 'Espíritu_Santo_island' },
  { id: 'z27', name: 'Los Barriles',             level: 'intermedio',   type: 'Offshore',    latitude: 23.69,   longitude: -109.7,   description: 'East Cape, conocido por la temporada de pez gallo.',                 species: ['Pez gallo', 'Dorado', 'Wahoo', 'Atún'],            wikimedia: 'Baja_California_Sur' },
  { id: 'z28', name: 'Loreto — Mar de Cortés',   level: 'principiante', type: 'Bahía',       latitude: 26.01,   longitude: -111.34,  description: 'Parque Nacional con aguas prístinas del Mar de Cortés.',            species: ['Pargo', 'Cabrilla', 'Jurel', 'Dorado'],            wikimedia: 'Loreto_Baja_California_Sur' },
  // ── SONORA / GOLFO DE CALIFORNIA ────────────────────────────────────────────
  { id: 'z29', name: 'Guaymas — Mar de Cortés',  level: 'intermedio',   type: 'Offshore',    latitude: 27.92,   longitude: -110.88,  description: 'Zona de pesca industrial y deportiva en el Mar de Cortés.',         species: ['Atún', 'Marlín', 'Pargo', 'Cabrilla'],             wikimedia: 'Guaymas' },
  { id: 'z30', name: 'Puerto Peñasco',           level: 'principiante', type: 'Orilla',      latitude: 31.3,    longitude: -113.54,  description: 'Zona de pesca en el Alto Golfo, mariscos y corvina.',               species: ['Corvina', 'Curvina', 'Sierra', 'Camarón'],         wikimedia: 'Puerto_Peñasco' },
  // ── GOLFO DE MÉXICO / VERACRUZ ──────────────────────────────────────────────
  { id: 'z31', name: 'Veracruz — Arrecife',      level: 'intermedio',   type: 'Arrecife',    latitude: 19.15,   longitude: -96.1,    description: 'Sistema arrecifal de Veracruz, pesca en arrecife.',                  species: ['Pargo', 'Mero', 'Barracuda'],                      wikimedia: 'Veracruz' },
  { id: 'z32', name: 'Tuxpan Offshore',          level: 'avanzado',     type: 'Offshore',    latitude: 21.0,    longitude: -97.2,    description: 'Pesca de altura en el Golfo de México.',                             species: ['Marlín', 'Pez vela', 'Atún', 'Wahoo'],            wikimedia: 'Tuxpan_Veracruz' },
  { id: 'z33', name: 'Tampico — Delta del Pánuco', level: 'principiante', type: 'Río',       latitude: 22.26,   longitude: -97.87,   description: 'Delta del Río Pánuco, pesca de robalo y bagre.',                     species: ['Robalo', 'Bagre', 'Mojarra'],                      wikimedia: 'Tampico' },
  // ── CAMPECHE / YUCATÁN ──────────────────────────────────────────────────────
  { id: 'z34', name: 'Campeche — Sonda',         level: 'avanzado',     type: 'Offshore',    latitude: 19.84,   longitude: -90.55,   description: 'Sonda de Campeche, zona de pesca industrial y deportiva.',          species: ['Marlín', 'Dorado', 'Atún', 'Peto'],                wikimedia: 'Campeche' },
  { id: 'z35', name: 'Progreso — Costa Yucatán', level: 'principiante', type: 'Orilla',      latitude: 21.28,   longitude: -89.66,   description: 'Pesca desde el muelle y la costa de Yucatán.',                      species: ['Mero', 'Pargo', 'Pulpo'],                          wikimedia: 'Progreso_Yucatán' },
  // ── QUINTANA ROO / CARIBE ───────────────────────────────────────────────────
  { id: 'z36', name: 'Cancún — Caribe',          level: 'intermedio',   type: 'Offshore',    latitude: 21.16,   longitude: -86.8,    description: 'Pesca de altura en el Caribe mexicano.',                             species: ['Marlín', 'Pez vela', 'Dorado', 'Wahoo'],          wikimedia: 'Cancún' },
  { id: 'z37', name: 'Cozumel — Arrecife',       level: 'intermedio',   type: 'Arrecife',    latitude: 20.5,    longitude: -86.95,   description: 'Arrecife Mesoamericano, pesca y buceo en Cozumel.',                 species: ['Pargo', 'Mero', 'Barracuda', 'Wahoo'],            wikimedia: 'Cozumel' },
  { id: 'z38', name: 'Chetumal — Bahía',         level: 'principiante', type: 'Bahía',       latitude: 18.5,    longitude: -88.3,    description: 'Bahía de Chetumal con pesca de sábalo y robalo.',                   species: ['Sábalo', 'Robalo', 'Mojarra'],                     wikimedia: 'Chetumal' },
  // ── CHIAPAS ─────────────────────────────────────────────────────────────────
  { id: 'z39', name: 'Puerto Madero',            level: 'avanzado',     type: 'Offshore',    latitude: 14.72,   longitude: -92.42,   description: 'Puerto pesquero en Chiapas, excelente para pez vela.',              species: ['Pez vela', 'Marlín', 'Atún', 'Dorado'],            wikimedia: 'Chiapas' },
  { id: 'z40', name: 'Laguna de Miramar',        level: 'principiante', type: 'Laguna',      latitude: 16.35,   longitude: -91.98,   description: 'Laguna selvática en Chiapas con pesca de agua dulce.',              species: ['Mojarra', 'Tenhuayaca', 'Robalo'],                 wikimedia: 'Chiapas' },
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

// ─── Foto local de zona ───────────────────────────────────────────────────────
// Para zonas con foto local usa ZONE_ID_TO_PHOTO, para las demás usa Wikimedia
const zoneWikiCache: Record<string, string | null> = {};
async function fetchZoneWikiPhoto(wikimedia: string): Promise<string | null> {
  if (wikimedia in zoneWikiCache) return zoneWikiCache[wikimedia];
  try {
    const res  = await fetch(`https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(wikimedia)}&prop=pageimages&format=json&pithumbsize=600&origin=*`);
    const data = await res.json();
    const page = Object.values(data?.query?.pages ?? {})[0] as any;
    zoneWikiCache[wikimedia] = page?.thumbnail?.source ?? null;
    return zoneWikiCache[wikimedia];
  } catch { zoneWikiCache[wikimedia] = null; return null; }
}

function useZonePhoto(zoneId: string, wikimedia: string) {
  const localPhoto = ZONE_ID_TO_PHOTO[zoneId] ?? null;
  const [wikiPhoto, setWikiPhoto] = useState<string | null>(null);
  useEffect(() => {
    if (!localPhoto) { fetchZoneWikiPhoto(wikimedia).then(setWikiPhoto); }
  }, [zoneId, wikimedia, localPhoto]);
  // Prioriza foto local, si no tiene usa Wikimedia
  return localPhoto ?? wikiPhoto;
}

// ─── Mapa Leaflet + OSM ───────────────────────────────────────────────────────
const MAP_CENTER_LAT = 20.0;
const MAP_CENTER_LON = -100.5;
const MAP_ZOOM       = 5;

// ─── HTML del mapa con Leaflet-velocity para animaciones ──────────────────────
// Datos de viento/corrientes desde Open-Meteo (gratis, sin key)
// leaflet-velocity renderiza partículas animadas igual que Windy
function buildLeafletHtml(
  zones: Zone[],
  centerLat: number,
  centerLon: number,
  zoom: number,
  layer: MapLayer,
) {
  const markers = zones.map((z) => {
    const color = z.level === 'principiante' ? '#16A34A' : z.level === 'intermedio' ? '#EA580C' : '#DC2626';
    return `
      L.circleMarker([${z.latitude}, ${z.longitude}], {
        radius: 13, color: '#fff', fillColor: '${color}', fillOpacity: 0.92, weight: 3,
      }).addTo(map)
      .bindPopup('<b>${z.name}</b><br/>${z.type} · ${z.level}<br/><small>${z.species.join(', ')}</small>');
    `;
  }).join('\n');

  // Capa estática OWM para temperatura (no necesita animación)
  const tempTileLayer = `L.tileLayer(
    'https://tile.openweathermap.org/map/temp_new/{z}/{x}/{y}.png?appid=439d4b804bc8187953eb36d2a8c26a02',
    {opacity:0.65, attribution:'© OpenWeatherMap'}
  ).addTo(map);`;

  // Decidir qué mostrar según la capa
  // Para wind/currents: leaflet-velocity con datos Open-Meteo
  // Para waves/temp: tile overlay estático
  // Para zones: solo marcadores
  const isVelocityLayer = layer === 'wind' || layer === 'currents';
  const isTempLayer = layer === 'temp';
  const isWavesLayer = layer === 'waves';

  // Grid Open-Meteo: bbox alrededor del centro ±3°, resolución 0.25°
  const latMin = (centerLat - 3).toFixed(2);
  const latMax = (centerLat + 3).toFixed(2);
  const lonMin = (centerLon - 3).toFixed(2);
  const lonMax = (centerLon + 3).toFixed(2);

  // Variables según capa: wind = u/v component 10m, currents = ocean u/v (marine api)
  const openMeteoVars = layer === 'currents'
    ? `variables=ocean_u_velocity&variables=ocean_v_velocity`
    : `variables=wind_u_component_10m&variables=wind_v_component_10m`;

  // Color scheme por tipo de capa
  const velocityOptions = layer === 'currents'
    ? `colorScale:['#0ea5e9','#06b6d4','#0891b2','#0e7490','#155e75'], minVelocity:0, maxVelocity:2, velocityScale:0.015, particleAge:60, lineWidth:1.5, particleMultiplier:1/200`
    : `colorScale:['#ffffcc','#a1dab4','#41b6c4','#2c7fb8','#253494'], minVelocity:0, maxVelocity:15, velocityScale:0.012, particleAge:64, lineWidth:2, particleMultiplier:1/300`;

  return `<!DOCTYPE html><html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/leaflet-velocity@2.1.1/dist/leaflet-velocity.min.js"></script>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/leaflet-velocity@2.1.1/dist/leaflet-velocity.min.css"/>
  <style>
    * { margin:0;padding:0;box-sizing:border-box }
    html,body,#map { width:100%;height:100% }
    .leaflet-velocity-color-legend { display:none }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    var map = L.map('map', { zoomControl:true }).setView([${centerLat},${centerLon}], ${zoom});

    // Tile base: náutico para capas meteorológicas (muestra solo el mar), OSM para zonas
    var osmTiles = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap', maxZoom: 18,
    });
    var cartoTiles = L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '© OpenStreetMap © CARTO', maxZoom: 18,
    });
    var oceanTiles = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Ocean/World_Ocean_Base/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'Tiles © Esri', maxZoom: 13,
    });
    var oceanRef = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Ocean/World_Ocean_Reference/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'Tiles © Esri', maxZoom: 13, opacity: 0.7,
    });

    // Para capas meteorológicas: usar mapa oceánico (sin relieve terrestre)
    // Para zonas: usar OSM normal
    var useOcean = ${isVelocityLayer || isWavesLayer ? 'true' : 'false'};
    if (useOcean) {
      oceanTiles.addTo(map);
      oceanRef.addTo(map);
    } else {
      cartoTiles.addTo(map);
    }

    ${isTempLayer ? tempTileLayer : ''}
    ${isWavesLayer ? `L.tileLayer('https://tile.openweathermap.org/map/wind_new/{z}/{x}/{y}.png?appid=439d4b804bc8187953eb36d2a8c26a02',{opacity:0.55,attribution:'© OWM'}).addTo(map);` : ''}

    ${isVelocityLayer ? `
    // Fetch datos de Open-Meteo y convertir a formato leaflet-velocity
    (async function() {
      try {
        var bbox = 'latitude_min=${latMin}&latitude_max=${latMax}&longitude_min=${lonMin}&longitude_max=${lonMax}';
        var url = 'https://api.open-meteo.com/v1/forecast?' + bbox
          + '&${openMeteoVars}'
          + '&forecast_days=1&timeformat=unixtime&format=json&cell_selection=nearest';

        // Usar forecast normal (punto) para generar un campo sintético interpolado
        // ya que la API de grilla de Open-Meteo requiere plan de pago.
        // Usamos la API GFS gratis de Open-Meteo (forecast sin grilla) en múltiples puntos
        // para construir el campo vectorial manualmente.
        var gridLats = [${(parseFloat(latMin)).toFixed(1)}, ${(centerLat - 1.5).toFixed(1)}, ${centerLat.toFixed(1)}, ${(centerLat + 1.5).toFixed(1)}, ${(parseFloat(latMax)).toFixed(1)}];
        var gridLons = [${(parseFloat(lonMin)).toFixed(1)}, ${(centerLon - 1.5).toFixed(1)}, ${centerLon.toFixed(1)}, ${(centerLon + 1.5).toFixed(1)}, ${(parseFloat(lonMax)).toFixed(1)}];
        var nx = gridLons.length;
        var ny = gridLats.length;

        var latStr = gridLats.join(',');
        var lonStr = gridLons.map(function(lo) {
          return gridLats.map(function() { return lo; });
        }).flat().join(',');
        var latStrAll = gridLats.map(function(la) {
          return gridLons.map(function() { return la; });
        }).flat().join(',');

        var vars = '${layer === 'currents' ? 'current_u_component_100m,current_v_component_100m' : 'wind_u_component_10m,wind_v_component_10m'}';
        var promises = [];
        for (var i = 0; i < gridLons.length; i++) {
          for (var j = 0; j < gridLats.length; j++) {
            promises.push(
              fetch('https://api.open-meteo.com/v1/forecast?latitude=' + gridLats[j]
                + '&longitude=' + gridLons[i]
                + '&hourly=${layer === 'currents' ? 'wind_speed_10m,wind_direction_10m' : 'wind_speed_10m,wind_direction_10m'}'
                + '&forecast_days=1&timeformat=unixtime&format=json')
                .then(function(r){ return r.json(); })
                .then(function(d){
                  var spd = d.hourly && d.hourly.wind_speed_10m ? d.hourly.wind_speed_10m[0] : 5;
                  var dir = d.hourly && d.hourly.wind_direction_10m ? d.hourly.wind_direction_10m[0] : 270;
                  var rad = dir * Math.PI / 180;
                  return { u: -spd * Math.sin(rad), v: -spd * Math.cos(rad) };
                })
                .catch(function(){ return { u: 3, v: 2 }; })
            );
          }
        }

        var results = await Promise.all(promises);
        var uData = results.map(function(r){ return r.u; });
        var vData = results.map(function(r){ return r.v; });

        var lo1 = gridLons[0];
        var la1 = gridLats[gridLats.length - 1];
        var lo2 = gridLons[gridLons.length - 1];
        var la2 = gridLats[0];
        var dx = (lo2 - lo1) / (nx - 1);
        var dy = (la1 - la2) / (ny - 1);

        var velocityData = [
          {
            header: {
              parameterUnit: "m/s", parameterNumber: 2, parameterNumberName: "U-component_of_wind",
              parameterCategory: 2, lo1: lo1, la1: la1, lo2: lo2, la2: la2,
              nx: nx, ny: ny, dx: dx, dy: dy, refTime: new Date().toISOString(),
            },
            data: uData,
          },
          {
            header: {
              parameterUnit: "m/s", parameterNumber: 3, parameterNumberName: "V-component_of_wind",
              parameterCategory: 2, lo1: lo1, la1: la1, lo2: lo2, la2: la2,
              nx: nx, ny: ny, dx: dx, dy: dy, refTime: new Date().toISOString(),
            },
            data: vData,
          }
        ];

        L.velocityLayer({
          displayValues: true,
          displayOptions: { velocityType: '${layer === 'currents' ? 'Corrientes' : 'Viento'}', displayPosition: 'bottomleft', displayEmptyString: '' },
          data: velocityData,
          ${velocityOptions},
          frameRate: 15,
        }).addTo(map);

      } catch(e) {
        console.warn('velocity error', e);
      }
    })();
    ` : ''}

    // Marcadores de zonas de pesca
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
function ZonePhoto({ zoneId, wikimedia, style }: { zoneId: string; wikimedia: string; style?: any }) {
  const photo = useZonePhoto(zoneId, wikimedia);
  if (!photo) {
    return (
      <View style={[{ backgroundColor: '#E2E8F0', alignItems: 'center', justifyContent: 'center' }, style]}>
        <MaterialIcons name="landscape" size={32} color="#94A3B8" />
      </View>
    );
  }
  return <Image source={typeof photo === 'string' ? { uri: photo } : photo} style={style} resizeMode="cover" />;
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
          <ZonePhoto zoneId={zone.id} wikimedia={zone.wikimedia} style={{ width: '100%', height: 200 }} />

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
  const photo = useZonePhoto(zone.id, zone.wikimedia);
  const color = LEVEL_COLORS[zone.level];
  return (
    <TouchableOpacity onPress={onPress} style={{ marginBottom: 12 }}>
      <View style={{ borderRadius: 16, overflow: 'hidden', backgroundColor: '#fff', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8 }}>
        {/* Foto */}
        <View style={{ height: 130, backgroundColor: '#E2E8F0' }}>
          {photo
            ? <Image source={typeof photo === 'string' ? { uri: photo } : photo} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
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
            {userLocation ? `${filtered.length} zonas encontradas cerca de ti` : `${filtered.length} zonas en todo México`}
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
            zoom={userLocation ? 8 : MAP_ZOOM}
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

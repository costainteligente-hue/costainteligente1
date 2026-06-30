/**
 * Admin — Gestión de Coordenadas de Pesca
 * CRUD completo: crear, editar, eliminar coordenadas con mapa de selección
 */
import React, { useState } from 'react';
import {
  ScrollView, View, Text, TouchableOpacity, Alert, Modal,
  TextInput, KeyboardAvoidingView, Platform, Image, ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '@/lib/constants';
import { useFishingCoordsStore } from '@/stores/fishingCoordsStore';
import { CardBox } from '@/components/ui/CardBox';
import { HeaderCard } from '@/components/ui/HeaderCard';
import { InfoBox } from '@/components/ui/InfoBox';
import { EmptyState } from '@/components/ui/EmptyState';
import type { FishingCoordinate } from '@/types/fishing-coords';

// ─── Map picker for location ──────────────────────────────────────────────────
function LocationPicker({ lat, lon, onPick, onClose }: {
  lat: number; lon: number;
  onPick: (la: number, lo: number) => void;
  onClose: () => void;
}) {
  const html = `<!DOCTYPE html><html><head>
    <meta charset="utf-8"/>
    <meta name="viewport" content="width=device-width,initial-scale=1"/>
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <style>*{margin:0;padding:0}html,body,#m{width:100%;height:100%}
    #info{position:absolute;bottom:10px;left:50%;transform:translateX(-50%);background:rgba(15,23,42,0.85);color:#fff;padding:8px 14px;border-radius:999px;font-size:13px;font-weight:700;z-index:999;white-space:nowrap}
    </style>
  </head><body>
    <div id="m"></div>
    <div id="info">Toca el mapa para marcar la ubicación</div>
    <script>
      var map = L.map('m').setView([${lat || 17.64},${lon || -101.55}], ${lat ? 14 : 6});
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{attribution:'© OSM'}).addTo(map);
      var marker = null;
      ${lat ? `marker = L.marker([${lat},${lon}]).addTo(map);` : ''}
      map.on('click', function(e){
        var la = e.latlng.lat.toFixed(6);
        var lo = e.latlng.lng.toFixed(6);
        if(marker) map.removeLayer(marker);
        marker = L.marker([la,lo]).addTo(map);
        document.getElementById('info').textContent = la + '° N, ' + Math.abs(lo) + '° O';
        window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify({lat:parseFloat(la),lon:parseFloat(lo)}));
      });
    </script>
  </body></html>`;

  if (Platform.OS === 'web') {
    return (
      <Modal visible animationType="slide" onRequestClose={onClose}>
        <SafeAreaView style={{ flex: 1, backgroundColor: '#0F172A' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 }}>
            <Text style={{ color: '#fff', fontSize: 18, fontWeight: '900' }}>Seleccionar ubicación</Text>
            <TouchableOpacity onPress={onClose}><MaterialIcons name="close" size={24} color="#fff" /></TouchableOpacity>
          </View>
          <iframe srcDoc={html} style={{ flex: 1, border: 'none' } as any} sandbox="allow-scripts allow-same-origin"
            onLoad={(e: any) => {
              try {
                const win = e.target.contentWindow;
                win.addEventListener('message', (ev: any) => {
                  try { const d = JSON.parse(ev.data); onPick(d.lat, d.lon); } catch {}
                });
              } catch {}
            }} />
          <TouchableOpacity onPress={onClose} style={{ backgroundColor: COLORS.ocean, margin: 16, padding: 14, borderRadius: 14, alignItems: 'center' }}>
            <Text style={{ color: '#fff', fontWeight: '900' }}>Confirmar ubicación</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </Modal>
    );
  }

  const { WebView } = require('react-native-webview');
  return (
    <Modal visible animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: '#0F172A' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 }}>
          <Text style={{ color: '#fff', fontSize: 18, fontWeight: '900' }}>Seleccionar ubicación</Text>
          <TouchableOpacity onPress={onClose}><MaterialIcons name="close" size={24} color="#fff" /></TouchableOpacity>
        </View>
        <WebView source={{ html }} style={{ flex: 1 }} javaScriptEnabled originWhitelist={['*']}
          onMessage={(e: any) => { try { const d = JSON.parse(e.nativeEvent.data); onPick(d.lat, d.lon); } catch {} }} />
        <TouchableOpacity onPress={onClose} style={{ backgroundColor: COLORS.ocean, margin: 16, padding: 14, borderRadius: 14, alignItems: 'center' }}>
          <Text style={{ color: '#fff', fontWeight: '900' }}>Confirmar ubicación</Text>
        </TouchableOpacity>
      </SafeAreaView>
    </Modal>
  );
}

// ─── Coord form modal ─────────────────────────────────────────────────────────
function CoordForm({ initial, onSave, onClose }: {
  initial?: FishingCoordinate;
  onSave: (data: Omit<FishingCoordinate, 'id' | 'registeredAt' | 'isLocked' | 'unlockedByDefault' | 'createdBy'>) => void;
  onClose: () => void;
}) {
  const [name,   setName]   = useState(initial?.name ?? '');
  const [lat,    setLat]    = useState(initial?.latitude?.toString() ?? '');
  const [lon,    setLon]    = useState(initial?.longitude?.toString() ?? '');
  const [photo,  setPhoto]  = useState(initial?.photoUrl ?? '');
  const [desc,   setDesc]   = useState(initial?.description ?? '');
  const [showMap, setShowMap] = useState(false);
  const [errors, setErrors]  = useState<Record<string, string>>({});

  const inp = { backgroundColor: '#F8FAFC', borderRadius: 14, borderWidth: 1, borderColor: '#E2E8F0', paddingHorizontal: 14, paddingVertical: 13, fontSize: 15, color: '#0F172A' } as const;

  const pickPhoto = async () => {
    if (Platform.OS === 'web') {
      const input = document.createElement('input');
      input.type = 'file'; input.accept = 'image/*';
      input.onchange = (e: any) => {
        const file = e.target?.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => { const uri = ev.target?.result as string; if (uri) setPhoto(uri); };
        reader.readAsDataURL(file);
      };
      input.click(); return;
    }
    try {
      const IP = await import('expo-image-picker');
      const perm = await IP.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) { Alert.alert('Permiso requerido'); return; }
      const result = await IP.launchImageLibraryAsync({ mediaTypes: IP.MediaTypeOptions.Images, quality: 0.75 });
      if (!result.canceled && result.assets[0]) setPhoto(result.assets[0].uri);
    } catch { Alert.alert('Error al abrir galería'); }
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!name.trim())   e.name = 'Nombre obligatorio.';
    if (!lat.trim() || isNaN(parseFloat(lat))) e.lat = 'Latitud válida requerida.';
    if (!lon.trim() || isNaN(parseFloat(lon))) e.lon = 'Longitud válida requerida.';
    if (!desc.trim())   e.desc = 'Descripción obligatoria.';
    return e;
  };

  const handleSave = () => {
    const e = validate();
    if (Object.keys(e).length > 0) { setErrors(e); return; }
    onSave({ name: name.trim(), latitude: parseFloat(lat), longitude: parseFloat(lon), photoUrl: photo.trim(), description: desc.trim() });
    onClose();
  };

  return (
    <>
      {showMap && (
        <LocationPicker
          lat={parseFloat(lat) || 0} lon={parseFloat(lon) || 0}
          onPick={(la, lo) => { setLat(la.toFixed(6)); setLon(lo.toFixed(6)); setErrors((e) => ({ ...e, lat: '', lon: '' })); }}
          onClose={() => setShowMap(false)}
        />
      )}
      <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
            <View style={{ width: 42, height: 4, borderRadius: 999, backgroundColor: 'rgba(15,23,42,0.2)', alignSelf: 'center', marginTop: 10, marginBottom: 12 }} />
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 12 }}>
              <Text style={{ fontSize: 20, fontWeight: '900', color: '#0F172A' }}>{initial ? 'Editar coordenada' : 'Nueva coordenada'}</Text>
              <TouchableOpacity onPress={onClose}><MaterialIcons name="close" size={24} color="#0F172A" /></TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
              <CardBox>
                <Text style={{ color: 'rgba(15,23,42,0.62)', fontSize: 12, fontWeight: '850', marginBottom: 8 }}>Nombre del lugar *</Text>
                <TextInput value={name} onChangeText={(v) => { setName(v); setErrors((e) => ({ ...e, name: '' })); }}
                  placeholder="Ej. Bajo de Chila — pez vela" placeholderTextColor="#94A3B8"
                  style={[inp, { marginBottom: 14, borderColor: errors.name ? COLORS.danger : '#E2E8F0' }]} />
                {errors.name ? <Text style={{ color: COLORS.danger, fontSize: 12, marginTop: -10, marginBottom: 8 }}>{errors.name}</Text> : null}

                <Text style={{ color: 'rgba(15,23,42,0.62)', fontSize: 12, fontWeight: '850', marginBottom: 8 }}>Coordenadas GPS *</Text>
                <TouchableOpacity onPress={() => setShowMap(true)}
                  style={{ backgroundColor: `${COLORS.ocean}12`, borderRadius: 12, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12, borderWidth: 1, borderColor: `${COLORS.ocean}25` }}>
                  <MaterialIcons name="map" size={20} color={COLORS.ocean} />
                  <Text style={{ color: COLORS.ocean, fontWeight: '800', fontSize: 14 }}>
                    {lat && lon ? `${parseFloat(lat).toFixed(4)}° N · ${Math.abs(parseFloat(lon)).toFixed(4)}° O` : 'Seleccionar en el mapa'}
                  </Text>
                </TouchableOpacity>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: 'rgba(15,23,42,0.62)', fontSize: 11, marginBottom: 4 }}>Latitud</Text>
                    <TextInput value={lat} onChangeText={(v) => { setLat(v); setErrors((e) => ({ ...e, lat: '' })); }}
                      placeholder="17.6300" placeholderTextColor="#94A3B8" keyboardType="decimal-pad"
                      style={[inp, { borderColor: errors.lat ? COLORS.danger : '#E2E8F0' }]} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: 'rgba(15,23,42,0.62)', fontSize: 11, marginBottom: 4 }}>Longitud</Text>
                    <TextInput value={lon} onChangeText={(v) => { setLon(v); setErrors((e) => ({ ...e, lon: '' })); }}
                      placeholder="-101.5500" placeholderTextColor="#94A3B8" keyboardType="decimal-pad"
                      style={[inp, { borderColor: errors.lon ? COLORS.danger : '#E2E8F0' }]} />
                  </View>
                </View>
                {(errors.lat || errors.lon) ? <Text style={{ color: COLORS.danger, fontSize: 12, marginTop: 4 }}>{errors.lat || errors.lon}</Text> : null}
              </CardBox>

              <CardBox>
                <Text style={{ color: 'rgba(15,23,42,0.62)', fontSize: 12, fontWeight: '850', marginBottom: 8 }}>Foto del sitio</Text>
                {photo ? (
                  <View style={{ position: 'relative', marginBottom: 12 }}>
                    <Image source={{ uri: photo }} style={{ width: '100%', height: 160, borderRadius: 12 }} resizeMode="cover" />
                    <TouchableOpacity onPress={() => setPhoto('')} style={{ position: 'absolute', top: 8, right: 8, backgroundColor: 'rgba(220,38,38,0.85)', borderRadius: 999, padding: 5 }}>
                      <MaterialIcons name="close" size={14} color="#fff" />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity onPress={pickPhoto}
                    style={{ height: 120, borderRadius: 12, backgroundColor: '#F1F5F9', borderWidth: 2, borderColor: '#E2E8F0', borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 12 }}>
                    <MaterialIcons name="add-photo-alternate" size={32} color="#94A3B8" />
                    <Text style={{ color: '#94A3B8', fontWeight: '700', fontSize: 13 }}>Subir foto del sitio</Text>
                  </TouchableOpacity>
                )}
                {!photo && (
                  <TouchableOpacity onPress={pickPhoto}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, backgroundColor: `${COLORS.ocean}12`, alignSelf: 'flex-start' }}>
                    <MaterialIcons name="photo-library" size={16} color={COLORS.ocean} />
                    <Text style={{ color: COLORS.ocean, fontWeight: '800', fontSize: 13 }}>Seleccionar foto</Text>
                  </TouchableOpacity>
                )}

                <Text style={{ color: 'rgba(15,23,42,0.62)', fontSize: 12, fontWeight: '850', marginTop: 14, marginBottom: 8 }}>Descripción *</Text>
                <TextInput value={desc} onChangeText={(v) => { setDesc(v); setErrors((e) => ({ ...e, desc: '' })); }}
                  multiline numberOfLines={4} placeholder="Describe el punto de pesca: corrientes, temporada, especie objetivo..."
                  placeholderTextColor="#94A3B8"
                  style={[inp, { textAlignVertical: 'top', minHeight: 90, borderColor: errors.desc ? COLORS.danger : '#E2E8F0' }]} />
                {errors.desc ? <Text style={{ color: COLORS.danger, fontSize: 12, marginTop: 4 }}>{errors.desc}</Text> : null}
              </CardBox>

              <TouchableOpacity onPress={handleSave}
                style={{ backgroundColor: COLORS.ocean, borderRadius: 14, padding: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 44 }}>
                <MaterialIcons name="check" size={18} color="#fff" />
                <Text style={{ color: '#fff', fontWeight: '900' }}>{initial ? 'Guardar cambios' : 'Crear coordenada'}</Text>
              </TouchableOpacity>
            </ScrollView>
          </SafeAreaView>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function AdminFishingCoordsScreen() {
  const { coords, addCoord, updateCoord, deleteCoord } = useFishingCoordsStore();
  const [showForm, setShowForm] = useState(false);
  const [editing,  setEditing]  = useState<FishingCoordinate | undefined>();

  const del = (c: FishingCoordinate) => {
    Alert.alert('Eliminar coordenada', `¿Eliminar "${c.name}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: () => deleteCoord(c.id) },
    ]);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }} edges={['top']}>
      {showForm && (
        <CoordForm initial={editing}
          onSave={(data) => {
            if (editing) updateCoord(editing.id, data);
            else addCoord({ ...data, createdBy: 'admin' });
          }}
          onClose={() => { setShowForm(false); setEditing(undefined); }} />
      )}

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        <HeaderCard title="Coordenadas de Pesca" subtitle={`${coords.length} registradas · Visibles para todos los usuarios`} icon="gps-fixed" color={COLORS.ocean} />

        <TouchableOpacity onPress={() => { setEditing(undefined); setShowForm(true); }}
          style={{ backgroundColor: COLORS.ocean, borderRadius: 14, padding: 14, marginBottom: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 44 }}>
          <MaterialIcons name="add-location-alt" size={20} color="#fff" />
          <Text style={{ color: '#fff', fontWeight: '900' }}>Nueva coordenada</Text>
        </TouchableOpacity>

        {coords.length === 0 ? (
          <EmptyState icon="gps-fixed" title="Sin coordenadas" message="Crea la primera coordenada de pesca." buttonLabel="Nueva coordenada" onPress={() => setShowForm(true)} />
        ) : coords.map((c) => (
          <CardBox key={c.id}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
              {c.photoUrl ? (
                <Image source={{ uri: c.photoUrl }} style={{ width: 64, height: 64, borderRadius: 12, flexShrink: 0 }} resizeMode="cover" />
              ) : (
                <View style={{ width: 64, height: 64, borderRadius: 12, backgroundColor: `${COLORS.ocean}15`, alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <MaterialIcons name="place" size={28} color={COLORS.ocean} />
                </View>
              )}
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: '900', color: '#0F172A', fontSize: 15 }}>{c.name}</Text>
                <Text style={{ color: 'rgba(15,23,42,0.62)', fontSize: 12, marginTop: 2 }}>
                  {c.latitude.toFixed(5)}° N · {Math.abs(c.longitude).toFixed(5)}° O
                </Text>
                <Text style={{ color: 'rgba(15,23,42,0.62)', fontSize: 12, marginTop: 4, lineHeight: 17 }} numberOfLines={2}>{c.description}</Text>
                <Text style={{ color: '#94A3B8', fontSize: 11, marginTop: 4 }}>
                  {new Date(c.registeredAt).toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric' })}
                </Text>
              </View>
            </View>
            <View style={{ height: 1, backgroundColor: '#E2E8F0', marginVertical: 10 }} />
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 8 }}>
              <TouchableOpacity onPress={() => { setEditing(c); setShowForm(true); }}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0' }}>
                <MaterialIcons name="edit" size={16} color={COLORS.ocean} />
                <Text style={{ color: COLORS.ocean, fontWeight: '800', fontSize: 13 }}>Editar</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => del(c)}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: `${COLORS.danger}40` }}>
                <MaterialIcons name="delete-outline" size={16} color={COLORS.danger} />
                <Text style={{ color: COLORS.danger, fontWeight: '800', fontSize: 13 }}>Eliminar</Text>
              </TouchableOpacity>
            </View>
          </CardBox>
        ))}

        <InfoBox text="Las coordenadas son visibles para todos los usuarios. El sistema de desbloqueo por pagos/suscripciones se activará en una actualización futura sin cambiar la estructura actual." />
      </ScrollView>
    </SafeAreaView>
  );
}

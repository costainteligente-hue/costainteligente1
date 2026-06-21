/**
 * Admin — Gestión de zonas de pesca
 * Crear, editar, activar/desactivar zonas. Las zonas creadas aquí
 * aparecen automáticamente en el mapa del cliente.
 */
import React, { useState } from 'react';
import {
  ScrollView, View, Text, TouchableOpacity, Switch, Alert,
  ActivityIndicator, TextInput, Modal, KeyboardAvoidingView, Platform, Image,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { COLORS } from '@/lib/constants';
import { CardBox } from '@/components/ui/CardBox';
import { HeaderCard } from '@/components/ui/HeaderCard';
import { StatusPill } from '@/components/ui/StatusPill';
import { InfoBox } from '@/components/ui/InfoBox';
import { EmptyState } from '@/components/ui/EmptyState';

const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? '';

interface Zone {
  id: string; name: string; level: string; zoneType: string;
  isActive: boolean; latitude: number; longitude: number;
  description: string | null; photoUrls?: string[];
  species?: string[];
}

type ZoneLevel = 'principiante' | 'intermedio' | 'avanzado';
type ZoneType  = 'Playa' | 'Offshore' | 'Bahía' | 'Rocas' | 'Isla' | 'Embarcadero' | 'Costera' | 'Muelle';

const LEVEL_COLOR: Record<string, string> = {
  principiante: COLORS.success, intermedio: COLORS.warning, avanzado: COLORS.danger,
};
const LEVELS:     ZoneLevel[] = ['principiante', 'intermedio', 'avanzado'];
const ZONE_TYPES: ZoneType[]  = ['Playa', 'Offshore', 'Bahía', 'Rocas', 'Isla', 'Embarcadero', 'Costera', 'Muelle'];
const COMMON_SPECIES = ['Pez vela','Marlín azul','Marlín rayado','Dorado','Atún aleta amarilla',
  'Wahoo','Sierra','Jurel','Robalo','Huachinango','Mojarra','Pargo','Cabrilla','Barracuda','Mero'];

// ─── Fetch ────────────────────────────────────────────────────────────────────
async function fetchZones(): Promise<Zone[]> {
  if (typeof window !== 'undefined') {
    const res = await fetch(`${API_BASE}/api/admin/zones`);
    if (!res.ok) throw new Error('Error cargando zonas');
    return res.json();
  }
  const { getDb } = await import('@/lib/db/client');
  const { fishingZones } = await import('@/lib/db/schema');
  const { desc } = await import('drizzle-orm');
  const rows = await getDb().select().from(fishingZones).orderBy(desc(fishingZones.createdAt));
  return rows.map((r: any) => ({
    id: r.id, name: r.name, level: r.level, zoneType: r.zoneType,
    isActive: r.isActive, latitude: r.latitude, longitude: r.longitude,
    description: r.description,
    photoUrls: (() => { try { return JSON.parse(r.photoUrls ?? '[]'); } catch { return []; } })(),
  }));
}

async function toggleZoneActive(p: { id: string; isActive: boolean }) {
  if (typeof window !== 'undefined') {
    await fetch(`${API_BASE}/api/admin/zones`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(p) });
    return;
  }
  const { getDb } = await import('@/lib/db/client');
  const { fishingZones } = await import('@/lib/db/schema');
  const { eq } = await import('drizzle-orm');
  await getDb().update(fishingZones).set({ isActive: p.isActive, updatedAt: new Date() }).where(eq(fishingZones.id, p.id));
}

async function createZone(data: {
  name: string; level: string; zoneType: string;
  latitude: number; longitude: number; description: string;
  species: string[]; photoUrls: string[];
}) {
  if (typeof window !== 'undefined') {
    const res = await fetch(`${API_BASE}/api/admin/zones/create`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Error al crear zona');
    return res.json();
  }
  const { getDb } = await import('@/lib/db/client');
  const { fishingZones } = await import('@/lib/db/schema');
  const id = `z_${Date.now()}`;
  await getDb().insert(fishingZones).values({
    id, name: data.name, level: data.level as any, zoneType: data.zoneType,
    latitude: data.latitude, longitude: data.longitude,
    description: data.description, isActive: true,
    photoUrls: JSON.stringify(data.photoUrls),
  });
  return { id };
}

// ─── Formulario de nueva zona ─────────────────────────────────────────────────
function ZoneForm({ onSave, onClose }: { onSave: () => void; onClose: () => void }) {
  const [name, setName]             = useState('');
  const [level, setLevel]           = useState<ZoneLevel>('principiante');
  const [zoneType, setZoneType]     = useState<ZoneType>('Playa');
  const [lat, setLat]               = useState('');
  const [lon, setLon]               = useState('');
  const [description, setDescription] = useState('');
  const [species, setSpecies]       = useState<string[]>([]);
  const [customSpecies, setCustomSpecies] = useState('');
  const [photos, setPhotos]         = useState<string[]>([]);
  const [saving, setSaving]         = useState(false);
  const [errors, setErrors]         = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!name.trim())                     e.name = 'Nombre obligatorio.';
    if (!lat.trim() || isNaN(parseFloat(lat))) e.lat = 'Latitud válida requerida (ej. 17.63).';
    if (!lon.trim() || isNaN(parseFloat(lon))) e.lon = 'Longitud válida requerida (ej. -101.55).';
    if (!description.trim())              e.description = 'Descripción obligatoria.';
    if (species.length === 0)             e.species = 'Agrega al menos una especie.';
    return e;
  };

  const pickPhoto = async () => {
    if (photos.length >= 5) { Alert.alert('Máximo 5 fotos'); return; }

    if (Platform.OS === 'web') {
      // En web: crear input file temporal
      const input = document.createElement('input');
      input.type    = 'file';
      input.accept  = 'image/*';
      input.onchange = (e: any) => {
        const file = e.target?.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
          const uri = ev.target?.result as string;
          if (uri) setPhotos((prev) => [...prev, uri]);
        };
        reader.readAsDataURL(file);
      };
      input.click();
      return;
    }

    // En nativo: usar expo-image-picker dinámicamente
    try {
      const ImagePicker = await import('expo-image-picker');
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) { Alert.alert('Permiso de galería requerido'); return; }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.7, allowsMultipleSelection: false,
      });
      if (!result.canceled && result.assets[0]) {
        setPhotos((prev) => [...prev, result.assets[0].uri]);
      }
    } catch {
      Alert.alert('Error', 'No se pudo abrir la galería.');
    }
  };

  const toggleSpecies = (s: string) => {
    setSpecies((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]);
    setErrors((e) => ({ ...e, species: '' }));
  };

  const addCustomSpecies = () => {
    const s = customSpecies.trim();
    if (s && !species.includes(s)) { setSpecies((prev) => [...prev, s]); setCustomSpecies(''); }
  };

  const handleSave = async () => {
    const e = validate();
    if (Object.keys(e).length > 0) { setErrors(e); return; }
    setSaving(true);
    try {
      await createZone({
        name: name.trim(), level, zoneType,
        latitude: parseFloat(lat), longitude: parseFloat(lon),
        description: description.trim(), species, photoUrls: photos,
      });
      onSave();
    } catch (err: any) {
      Alert.alert('Error', err.message ?? 'No se pudo crear la zona.');
    } finally { setSaving(false); }
  };

  const Field = ({ label, value, onChange, placeholder, error, keyboard }: any) => (
    <View style={{ marginBottom: 14 }}>
      <Text style={{ fontWeight: '700', color: '#0F172A', fontSize: 13, marginBottom: 6 }}>{label}</Text>
      <TextInput
        value={value} onChangeText={onChange} placeholder={placeholder}
        placeholderTextColor="#94A3B8" keyboardType={keyboard ?? 'default'}
        style={{ backgroundColor: '#F8FAFC', borderRadius: 12, borderWidth: 1, borderColor: error ? COLORS.danger : '#E2E8F0', paddingHorizontal: 12, paddingVertical: 11, fontSize: 14, color: '#0F172A' }}
      />
      {error ? <Text style={{ color: COLORS.danger, fontSize: 12, marginTop: 3 }}>{error}</Text> : null}
    </View>
  );

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12 }}>
            <Text style={{ fontSize: 18, fontWeight: '800', color: '#0F172A' }}>Nueva zona de pesca</Text>
            <TouchableOpacity onPress={onClose}><MaterialIcons name="close" size={24} color="#0F172A" /></TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 60 }}>
            {/* Datos básicos */}
            <CardBox>
              <Text style={{ fontWeight: '800', color: '#0F172A', fontSize: 15, marginBottom: 14 }}>Información básica</Text>
              <Field label="Nombre de la zona *" value={name} onChange={(v: string) => { setName(v); setErrors((e) => ({ ...e, name: '' })); }} placeholder="Ej. Playa La Ropa" error={errors.name} />
              <Field label="Descripción *" value={description} onChange={(v: string) => { setDescription(v); setErrors((e) => ({ ...e, description: '' })); }} placeholder="Describe la zona..." error={errors.description} />

              {/* Nivel */}
              <Text style={{ fontWeight: '700', color: '#0F172A', fontSize: 13, marginBottom: 8 }}>Nivel de dificultad *</Text>
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 14 }}>
                {LEVELS.map((l) => (
                  <TouchableOpacity key={l} onPress={() => setLevel(l)}
                    style={{ flex: 1, paddingVertical: 9, borderRadius: 12, alignItems: 'center', backgroundColor: level === l ? LEVEL_COLOR[l] : '#F1F5F9', borderWidth: 1, borderColor: level === l ? LEVEL_COLOR[l] : '#E2E8F0' }}>
                    <Text style={{ fontWeight: '800', fontSize: 12, color: level === l ? '#fff' : '#0F172A' }}>{l.charAt(0).toUpperCase() + l.slice(1)}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Tipo de zona */}
              <Text style={{ fontWeight: '700', color: '#0F172A', fontSize: 13, marginBottom: 8 }}>Tipo de zona *</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, marginBottom: 14 }}>
                {ZONE_TYPES.map((t) => (
                  <TouchableOpacity key={t} onPress={() => setZoneType(t)}
                    style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, backgroundColor: zoneType === t ? COLORS.ocean : '#F1F5F9', borderWidth: 1, borderColor: zoneType === t ? COLORS.ocean : '#E2E8F0' }}>
                    <Text style={{ fontWeight: '700', fontSize: 12, color: zoneType === t ? '#fff' : '#0F172A' }}>{t}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </CardBox>

            {/* Coordenadas */}
            <CardBox>
              <Text style={{ fontWeight: '800', color: '#0F172A', fontSize: 15, marginBottom: 14 }}>📍 Coordenadas GPS</Text>
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <Field label="Latitud *" value={lat} onChange={(v: string) => { setLat(v); setErrors((e) => ({ ...e, lat: '' })); }} placeholder="Ej. 17.6300" error={errors.lat} keyboard="decimal-pad" />
                </View>
                <View style={{ flex: 1 }}>
                  <Field label="Longitud *" value={lon} onChange={(v: string) => { setLon(v); setErrors((e) => ({ ...e, lon: '' })); }} placeholder="Ej. -101.5500" error={errors.lon} keyboard="decimal-pad" />
                </View>
              </View>
              <Text style={{ color: '#94A3B8', fontSize: 11 }}>Tip: abre Google Maps, mantén presionado el punto y copia las coordenadas.</Text>
            </CardBox>

            {/* Especies */}
            <CardBox>
              <Text style={{ fontWeight: '800', color: '#0F172A', fontSize: 15, marginBottom: 4 }}>🐟 Especies que se encuentran</Text>
              {errors.species ? <Text style={{ color: COLORS.danger, fontSize: 12, marginBottom: 8 }}>{errors.species}</Text> : null}
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                {COMMON_SPECIES.map((s) => {
                  const sel = species.includes(s);
                  return (
                    <TouchableOpacity key={s} onPress={() => toggleSpecies(s)}
                      style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, backgroundColor: sel ? COLORS.success : '#F1F5F9', borderWidth: 1, borderColor: sel ? COLORS.success : '#E2E8F0' }}>
                      <Text style={{ fontWeight: '700', fontSize: 12, color: sel ? '#fff' : '#0F172A' }}>{s}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              {/* Especie personalizada */}
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TextInput value={customSpecies} onChangeText={setCustomSpecies} placeholder="Otra especie..." placeholderTextColor="#94A3B8"
                  style={{ flex: 1, backgroundColor: '#F8FAFC', borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: '#0F172A' }} />
                <TouchableOpacity onPress={addCustomSpecies} style={{ backgroundColor: COLORS.success, borderRadius: 12, paddingHorizontal: 14, justifyContent: 'center' }}>
                  <MaterialIcons name="add" size={20} color="#fff" />
                </TouchableOpacity>
              </View>
              {species.length > 0 && (
                <View style={{ marginTop: 10, flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                  {species.map((s) => (
                    <TouchableOpacity key={s} onPress={() => setSpecies((prev) => prev.filter((x) => x !== s))}
                      style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: `${COLORS.success}15`, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: `${COLORS.success}30` }}>
                      <Text style={{ color: COLORS.success, fontWeight: '700', fontSize: 12 }}>🐟 {s}</Text>
                      <MaterialIcons name="close" size={12} color={COLORS.success} />
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </CardBox>

            {/* Fotos */}
            <CardBox>
              <Text style={{ fontWeight: '800', color: '#0F172A', fontSize: 15, marginBottom: 4 }}>📷 Fotos de la zona</Text>
              <Text style={{ color: '#64748B', fontSize: 12, marginBottom: 12 }}>Agrega hasta 5 fotos reales de la zona. Aparecerán en el mapa y detalle.</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
                {photos.map((uri, i) => (
                  <View key={i} style={{ position: 'relative' }}>
                    <Image source={{ uri }} style={{ width: 100, height: 100, borderRadius: 12 }} resizeMode="cover" />
                    <TouchableOpacity onPress={() => setPhotos((prev) => prev.filter((_, j) => j !== i))}
                      style={{ position: 'absolute', top: 4, right: 4, backgroundColor: 'rgba(220,38,38,0.85)', borderRadius: 999, padding: 3 }}>
                      <MaterialIcons name="close" size={12} color="#fff" />
                    </TouchableOpacity>
                  </View>
                ))}
                {photos.length < 5 && (
                  <TouchableOpacity onPress={pickPhoto}
                    style={{ width: 100, height: 100, borderRadius: 12, backgroundColor: '#F1F5F9', borderWidth: 2, borderColor: '#E2E8F0', borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                    <MaterialIcons name="add-photo-alternate" size={28} color="#94A3B8" />
                    <Text style={{ color: '#94A3B8', fontSize: 10, fontWeight: '700' }}>Agregar</Text>
                  </TouchableOpacity>
                )}
              </ScrollView>
            </CardBox>

            {/* Botones */}
            <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
              <TouchableOpacity onPress={onClose} style={{ flex: 1, padding: 14, borderRadius: 14, borderWidth: 1, borderColor: '#E2E8F0', alignItems: 'center' }}>
                <Text style={{ fontWeight: '800', color: '#0F172A' }}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSave} disabled={saving}
                style={{ flex: 2, padding: 14, borderRadius: 14, backgroundColor: saving ? '#94A3B8' : COLORS.ocean, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 }}>
                {saving ? <ActivityIndicator color="#fff" size="small" /> : <MaterialIcons name="add-location-alt" size={18} color="#fff" />}
                <Text style={{ color: '#fff', fontWeight: '800' }}>{saving ? 'Guardando...' : 'Crear zona'}</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Pantalla principal ───────────────────────────────────────────────────────
export default function ZonesScreen() {
  const qc = useQueryClient();
  const { data, isLoading, error, refetch } = useQuery({ queryKey: ['admin_zones'], queryFn: fetchZones, staleTime: 1000 * 60 * 3 });
  const toggleMutation = useMutation({
    mutationFn: toggleZoneActive,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin_zones'] }),
  });
  const [showForm, setShowForm] = useState(false);

  const zones       = data ?? [];
  const activeCount = zones.filter((z) => z.isActive).length;

  const toggle = (zone: Zone) => {
    const msg = zone.isActive ? `Desactivar "${zone.name}" la ocultará del mapa.` : `Activar "${zone.name}" la mostrará en el mapa.`;
    Alert.alert(zone.isActive ? 'Desactivar zona' : 'Activar zona', msg, [
      { text: 'Cancelar', style: 'cancel' },
      { text: zone.isActive ? 'Desactivar' : 'Activar', onPress: () => toggleMutation.mutate({ id: zone.id, isActive: !zone.isActive }) },
    ]);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }} edges={['top']}>
      {showForm && (
        <ZoneForm
          onSave={() => { setShowForm(false); qc.invalidateQueries({ queryKey: ['admin_zones'] }); Alert.alert('✅ Zona creada', 'Ya aparece en el mapa de los clientes.'); }}
          onClose={() => setShowForm(false)}
        />
      )}

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
        <HeaderCard
          title="Zonas de pesca"
          subtitle={isLoading ? 'Cargando...' : `${activeCount} activas · ${zones.length - activeCount} desactivadas`}
          icon="place" color={COLORS.info}
        />

        <TouchableOpacity
          onPress={() => setShowForm(true)}
          style={{ backgroundColor: COLORS.ocean, borderRadius: 14, padding: 14, marginBottom: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}
        >
          <MaterialIcons name="add-location-alt" size={20} color="#fff" />
          <Text style={{ color: '#fff', fontWeight: '800' }}>Agregar nueva zona</Text>
        </TouchableOpacity>

        {isLoading && (
          <View style={{ alignItems: 'center', paddingVertical: 40 }}>
            <ActivityIndicator size="large" color={COLORS.ocean} />
            <Text style={{ color: '#64748B', marginTop: 12 }}>Cargando zonas...</Text>
          </View>
        )}

        {!isLoading && error && (
          <View style={{ backgroundColor: `${COLORS.danger}10`, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: `${COLORS.danger}30` }}>
            <Text style={{ color: COLORS.danger, fontWeight: '700' }}>Error al cargar zonas.</Text>
            <TouchableOpacity onPress={() => refetch()}><Text style={{ color: COLORS.ocean, fontWeight: '800', marginTop: 8 }}>Reintentar</Text></TouchableOpacity>
          </View>
        )}

        {!isLoading && !error && zones.length === 0 && (
          <EmptyState icon="place" title="Sin zonas" message="No hay zonas registradas. Crea la primera." buttonLabel="Crear zona" onPress={() => setShowForm(true)} />
        )}

        {zones.map((zone) => (
          <CardBox key={zone.id}>
            {/* Foto si existe */}
            {zone.photoUrls && zone.photoUrls.length > 0 && (
              <View style={{ height: 120, borderRadius: 12, overflow: 'hidden', marginBottom: 12 }}>
                <Image source={{ uri: zone.photoUrls[0] }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                {zone.photoUrls.length > 1 && (
                  <View style={{ position: 'absolute', bottom: 6, right: 8, backgroundColor: 'rgba(15,23,42,0.7)', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 }}>
                    <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700' }}>+{zone.photoUrls.length - 1} fotos</Text>
                  </View>
                )}
              </View>
            )}

            <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
              <View style={{ width: 48, height: 48, borderRadius: 16, backgroundColor: `${LEVEL_COLOR[zone.level] ?? COLORS.info}20`, alignItems: 'center', justifyContent: 'center' }}>
                <MaterialIcons name="place" size={26} color={LEVEL_COLOR[zone.level] ?? COLORS.info} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: '800', color: '#0F172A', fontSize: 15 }}>{zone.name}</Text>
                <Text style={{ color: '#64748B', fontSize: 13 }}>{zone.zoneType} · {zone.level}</Text>
                {zone.species && zone.species.length > 0 && (
                  <Text style={{ color: COLORS.success, fontSize: 12, marginTop: 2 }}>🐟 {zone.species.slice(0, 3).join(', ')}{zone.species.length > 3 ? '...' : ''}</Text>
                )}
                {zone.description && (
                  <Text style={{ color: '#94A3B8', fontSize: 12, marginTop: 2 }} numberOfLines={2}>{zone.description}</Text>
                )}
                <Text style={{ color: '#94A3B8', fontSize: 11, marginTop: 2 }}>
                  {zone.latitude.toFixed(4)}° N · {Math.abs(zone.longitude).toFixed(4)}° O
                </Text>
              </View>
              <Switch
                value={zone.isActive}
                onValueChange={() => toggle(zone)}
                trackColor={{ false: '#E2E8F0', true: `${COLORS.success}60` }}
                thumbColor={zone.isActive ? COLORS.success : '#fff'}
                disabled={toggleMutation.isPending}
              />
            </View>

            <View style={{ height: 1, backgroundColor: '#E2E8F0', marginVertical: 10 }} />
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <StatusPill status={zone.isActive ? 'Activa' : 'Desactivada'} />
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TouchableOpacity style={{ padding: 6 }}>
                  <MaterialIcons name="edit" size={20} color={COLORS.ocean} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => Alert.alert('Eliminar zona', `¿Eliminar "${zone.name}"? Esta acción no se puede deshacer.`, [
                    { text: 'Cancelar', style: 'cancel' },
                    { text: 'Eliminar', style: 'destructive', onPress: () => {} },
                  ])}
                  style={{ padding: 6 }}
                >
                  <MaterialIcons name="delete-outline" size={20} color={COLORS.danger} />
                </TouchableOpacity>
              </View>
            </View>
          </CardBox>
        ))}

        <InfoBox text="Las zonas creadas aquí aparecen automáticamente en el mapa del cliente. Desactivar oculta la zona sin eliminarla." />
      </ScrollView>
    </SafeAreaView>
  );
}

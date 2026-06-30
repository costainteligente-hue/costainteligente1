/**
 * ServiceFormScreen — Formulario de registro de servicio
 * Basado en el Flutter ServiceFormScreen del archivo de referencia.
 * Campos específicos por tipo + foto principal + documentos requeridos.
 */
import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  KeyboardAvoidingView, Platform, Alert, Image, ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { COLORS, SERVICE_DEFS } from '@/lib/constants';
import { useProviderStore } from '@/stores/providerStore';
import { LocationPicker, type PickedLocation } from '@/components/ui/LocationPicker';
import { ImageUploader } from '@/components/ui/ImageUploader';
import type { BusinessRecord, ServiceModuleId } from '@/types';

// ─── Tipos de embarcación ─────────────────────────────────────────────────────
const BOAT_TYPES = [
  'Lancha panga', 'Lancha deportiva', 'Lancha rápida', 'Lancha cabinada',
  'Yate de pesca deportiva', 'Catamarán', 'Embarcación artesanal', 'Embarcación turística',
];

const FISHING_TYPES = [
  'Pesca de altura', 'Pesca costera', 'Pesca de fondo', 'Curricán',
  'Pesca en playa', 'Pesca en muelle', 'Agua dulce', 'Catch and release', 'Torneo',
];

const SPECIES_BY_FISHING_TYPE: Record<string, string[]> = {
  'Pesca de altura': ['Pez vela', 'Marlín azul', 'Marlín rayado', 'Dorado', 'Atún aleta amarilla', 'Wahoo'],
  'Pesca costera':   ['Robalo', 'Sierra', 'Jurel', 'Pargo', 'Huachinango', 'Pez gallo'],
  'Pesca de fondo':  ['Huachinango', 'Pargo', 'Cabrilla', 'Mero', 'Mojarra'],
  'Curricán':        ['Dorado', 'Atún', 'Sierra', 'Wahoo', 'Jurel'],
  'Pesca en playa':  ['Robalo', 'Sierra', 'Jurel', 'Pargo', 'Lisa', 'Corvina'],
  'Pesca en muelle': ['Jurel', 'Sierra', 'Mojarra', 'Pargo', 'Lisa'],
  'Agua dulce':      ['Lobina', 'Tilapia', 'Carpa', 'Bagre', 'Mojarra', 'Trucha'],
  'Catch and release': ['Pez vela', 'Marlín', 'Pez gallo', 'Sábalo', 'Robalo'],
  'Torneo':          ['Pez vela', 'Marlín', 'Dorado', 'Pez gallo'],
};

// ─── Documentos requeridos por servicio ──────────────────────────────────────
const DOCS_BY_SERVICE: Record<string, { title: string; icon: keyof typeof MaterialIcons.glyphMap; required: boolean }[]> = {
  boat: [
    { title: 'Foto principal de la embarcación', icon: 'photo-camera', required: true },
    { title: 'Certificado de seguridad', icon: 'verified-user', required: true },
    { title: 'Certificado de matrícula', icon: 'article', required: true },
    { title: 'Permiso de pesca CONAPESCA', icon: 'set-meal', required: true },
  ],
  rental: [
    { title: 'Foto principal de la embarcación', icon: 'photo-camera', required: true },
    { title: 'Certificado de seguridad', icon: 'verified-user', required: true },
    { title: 'Certificado de matrícula', icon: 'article', required: true },
    { title: 'Permiso de turismo náutico', icon: 'sailing', required: true },
    { title: 'Póliza de seguro pasajeros', icon: 'groups', required: true },
  ],
  sport: [
    { title: 'Foto principal del servicio', icon: 'photo-camera', required: true },
    { title: 'Certificado de seguridad', icon: 'verified-user', required: true },
    { title: 'Permiso de pesca CONAPESCA', icon: 'set-meal', required: true },
    { title: 'Póliza de seguro pasajeros', icon: 'groups', required: true },
  ],
  guide: [
    { title: 'Foto principal del guía', icon: 'photo-camera', required: true },
    { title: 'Permiso de pesca CONAPESCA', icon: 'set-meal', required: false },
    { title: 'Evidencia operativa', icon: 'fact-check', required: true },
  ],
  restaurant: [
    { title: 'Foto del restaurante', icon: 'photo-camera', required: true },
    { title: 'Licencia de funcionamiento', icon: 'storefront', required: true },
    { title: 'Foto del local / fachada', icon: 'add-business', required: false },
  ],
  store: [
    { title: 'Foto de la tienda', icon: 'photo-camera', required: true },
    { title: 'Licencia de funcionamiento', icon: 'storefront', required: true },
  ],
  fishMarket: [
    { title: 'Foto de la pescadería', icon: 'photo-camera', required: true },
    { title: 'Licencia de funcionamiento', icon: 'storefront', required: true },
  ],
  transport: [
    { title: 'Foto del vehículo/embarcación', icon: 'photo-camera', required: true },
    { title: 'Evidencia operativa', icon: 'fact-check', required: true },
  ],
};

// ─── Campo de formulario ──────────────────────────────────────────────────────
function Field({ label, value, onChange, placeholder, error, keyboard, multiline, required }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string;
  error?: string; keyboard?: any; multiline?: boolean; required?: boolean;
}) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={{ fontWeight: '700', color: '#0F172A', marginBottom: 6, fontSize: 13 }}>
        {label}{required ? <Text style={{ color: COLORS.danger }}> *</Text> : null}
      </Text>
      <TextInput
        value={value} onChangeText={onChange} placeholder={placeholder}
        placeholderTextColor="#94A3B8" keyboardType={keyboard ?? 'default'} multiline={multiline}
        style={{
          backgroundColor: '#F8FAFC', borderRadius: 14, borderWidth: 1,
          borderColor: error ? COLORS.danger : '#E2E8F0',
          paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: '#0F172A',
          textAlignVertical: multiline ? 'top' : 'center', minHeight: multiline ? 90 : undefined,
        }}
      />
      {error ? <Text style={{ color: COLORS.danger, fontSize: 12, marginTop: 3 }}>{error}</Text> : null}
    </View>
  );
}

// ─── Selector de chips ────────────────────────────────────────────────────────
function ChipSelector({ label, options, selected, onToggle, single }: {
  label: string; options: string[]; selected: Set<string>; onToggle: (v: string) => void; single?: boolean;
}) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={{ fontWeight: '700', color: '#0F172A', marginBottom: 8, fontSize: 13 }}>{label}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {options.map((opt) => {
          const active = selected.has(opt);
          return (
            <TouchableOpacity key={opt} onPress={() => onToggle(opt)}
              style={{ paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999, backgroundColor: active ? COLORS.ocean : '#F1F5F9', borderWidth: 1, borderColor: active ? COLORS.ocean : '#E2E8F0' }}>
              <Text style={{ fontWeight: '700', fontSize: 12, color: active ? '#fff' : '#0F172A' }}>{opt}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

// ─── Sección de documentos con foto ──────────────────────────────────────────
function DocUploadSection({ serviceId, uploaded, onToggle }: {
  serviceId: string; uploaded: Set<string>; onToggle: (title: string) => void;
}) {
  const docs = DOCS_BY_SERVICE[serviceId] ?? [];
  return (
    <View style={{ backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0', padding: 16, marginBottom: 14 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <MaterialIcons name="photo-library" size={20} color={COLORS.ocean} />
        <Text style={{ fontWeight: '800', color: '#0F172A', fontSize: 15 }}>Fotos y documentos</Text>
      </View>
      <Text style={{ color: '#64748B', fontSize: 12, marginBottom: 14, lineHeight: 18 }}>
        Sube las fotos de cada documento. El administrador los revisará antes de publicar tu servicio.
      </Text>
      {docs.map((doc) => {
        const done = uploaded.has(doc.title);
        return (
          <TouchableOpacity key={doc.title} onPress={() => onToggle(doc.title)}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12,
              borderBottomWidth: 1, borderBottomColor: '#F1F5F9' }}>
            <View style={{ width: 44, height: 44, borderRadius: 12,
              backgroundColor: done ? `${COLORS.success}15` : `${COLORS.ocean}10`,
              alignItems: 'center', justifyContent: 'center' }}>
              <MaterialIcons name={doc.icon} size={22} color={done ? COLORS.success : COLORS.ocean} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: '700', color: '#0F172A', fontSize: 13 }}>{doc.title}</Text>
              <Text style={{ color: '#94A3B8', fontSize: 11, marginTop: 2 }}>
                {doc.required ? '⚠ Obligatorio' : 'Opcional'} · {done ? '✓ Marcado como subido' : 'Toca para marcar como subido'}
              </Text>
            </View>
            <View style={{ width: 28, height: 28, borderRadius: 99,
              backgroundColor: done ? COLORS.success : '#E2E8F0',
              alignItems: 'center', justifyContent: 'center' }}>
              <MaterialIcons name={done ? 'check' : 'add'} size={16} color={done ? '#fff' : '#94A3B8'} />
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function ServiceFormScreen() {
  const router = useRouter();
  const { serviceId } = useLocalSearchParams<{ serviceId: string }>();
  const { addRecord } = useProviderStore();

  const def = SERVICE_DEFS.find((s) => s.id === serviceId);

  const [name, setName]           = useState('');
  const [location, setLocation]   = useState('');
  const [pickedLoc, setPickedLoc] = useState<PickedLocation | null>(null);
  const [showLocPicker, setShowLocPicker] = useState(false);
  const [businessPhotos, setBusinessPhotos] = useState<string[]>([]);
  const [description, setDesc]    = useState('');
  const [captain, setCaptain]     = useState('');
  const [contact, setContact]     = useState('');
  const [capacity, setCapacity]   = useState('');
  const [expYears, setExpYears]   = useState('');
  const [boatType, setBoatType]   = useState<string>(BOAT_TYPES[0]);
  const [fishingTypes, setFishingTypes] = useState<Set<string>>(new Set([FISHING_TYPES[0]]));
  const [species, setSpecies]     = useState<Set<string>>(new Set(SPECIES_BY_FISHING_TYPE[FISHING_TYPES[0]] ?? []));
  const [extras, setExtras]       = useState<Set<string>>(new Set());
  const [uploaded, setUploaded]   = useState<Set<string>>(new Set());
  const [saving, setSaving]       = useState(false);
  const [errors, setErrors]       = useState<Record<string, string>>({});

  if (!def) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC', alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: COLORS.danger, fontWeight: '700' }}>Servicio no encontrado</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 12 }}>
          <Text style={{ color: COLORS.ocean, fontWeight: '700' }}>Volver</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const needsCaptain   = ['boat', 'rental', 'sport'].includes(def.id);
  const needsFishing   = ['boat', 'sport', 'guide'].includes(def.id);
  const needsCapacity  = ['boat', 'rental', 'sport', 'transport'].includes(def.id);

  const toggleFishingType = (ft: string) => {
    setFishingTypes((prev) => {
      const next = new Set(prev);
      next.has(ft) ? next.delete(ft) : next.add(ft);
      // Actualizar especies disponibles
      const allSpecies = new Set<string>();
      next.forEach((t) => (SPECIES_BY_FISHING_TYPE[t] ?? []).forEach((s) => allSpecies.add(s)));
      setSpecies(allSpecies);
      return next;
    });
  };

  const toggleExtra = (v: string) => setExtras((p) => { const n = new Set(p); n.has(v) ? n.delete(v) : n.add(v); return n; });
  const toggleDoc   = (t: string) => setUploaded((p) => { const n = new Set(p); n.has(t) ? n.delete(t) : n.add(t); return n; });

  const validate = (asDraft: boolean) => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = 'El nombre es obligatorio.';
    if (!location.trim()) e.location = 'La ubicación es obligatoria.';
    if (!asDraft) {
      if (needsCaptain && !captain.trim()) e.captain = 'El nombre del capitán es obligatorio.';
      if (needsCapacity && (!capacity.trim() || parseInt(capacity) <= 0)) e.capacity = 'La capacidad debe ser mayor a 0.';
      const requiredDocs = (DOCS_BY_SERVICE[def.id] ?? []).filter((d) => d.required).map((d) => d.title);
      const missing = requiredDocs.filter((d) => !uploaded.has(d));
      if (missing.length > 0) e.docs = `Marca como subidas: ${missing.slice(0, 2).join(', ')}`;
    }
    return e;
  };

  const save = async (asDraft: boolean) => {
    const e = validate(asDraft);
    if (Object.keys(e).length > 0) { setErrors(e); return; }
    setSaving(true);
    try {
      const record: BusinessRecord = {
        id: `${def.id}-${Date.now()}`,
        serviceId: def.id as ServiceModuleId,
        title: name.trim(),
        subtitle: description.trim() || def.description,
        location: location.trim(),
        serviceType: def.id === 'boat' || def.id === 'rental' ? boatType : def.name,
        price: 0, currency: 'MXN' as any,
        durationHours: 0, durationMinutes: 0,
        status: asDraft ? 'pending' : 'pending',
        isAvailable: true, availabilityNote: '',
        unavailableDateKeys: [],
        schedules: [], catalog: [], routeOptions: [], gallery: [],
        captainName: captain.trim(),
        fishingTypes: Array.from(fishingTypes),
        fishingType: Array.from(fishingTypes)[0] ?? '',
        targetSpecies: Array.from(species),
        servicePhotoUrl: uploaded.has((DOCS_BY_SERVICE[def.id]?.[0])?.title ?? '') ? 'uploaded' : '',
        uploadedDocumentPhotos: Array.from(uploaded),
        visibleToUsers: !asDraft,
        publicContact: contact.trim(),
        capacity: parseInt(capacity) || 0,
        experienceYears: parseInt(expYears) || 0,
        tags: Array.from(extras),
        extraDetails: [],
        meetingPoint: '',
      };
      addRecord(def.id, record);
      Alert.alert(
        asDraft ? '✅ Guardado' : '📤 Enviado para revisión',
        asDraft
          ? 'Tu servicio fue guardado como borrador. Puedes completarlo y enviarlo desde Administrar.'
          : 'Tu solicitud fue enviada al administrador. Recibirás respuesta en 24-48 horas.',
        [{ text: 'OK', onPress: () => router.back() }],
      );
    } catch { Alert.alert('Error', 'No se pudo guardar. Intenta de nuevo.'); }
    finally { setSaving(false); }
  };

  // ─── Extras según tipo de servicio ───────────────────────────────────────
  const extrasOptions: Record<string, string[]> = {
    boat:        ['Capitán', 'Equipo de pesca', 'Chalecos', 'Hielera', 'Combustible', 'GPS', 'Radio', 'Sombra', 'Bebidas', 'Alimentos'],
    rental:      ['Con capitán', 'Sin capitán', 'Chalecos', 'GPS', 'Hielera', 'Equipo de pesca', 'Combustible'],
    sport:       ['Equipo incluido', 'Capitán', 'Combustible', 'Bebidas', 'Alimentos', 'Fotografía', 'Catch and release'],
    restaurant:  ['Consumo en restaurante', 'Reservaciones', 'Eventos privados', 'Para llevar', 'Terrace/vista al mar'],
    store:       ['Cañas', 'Carretes', 'Señuelos', 'Anzuelos', 'Líneas', 'Redes', 'Accesorios', 'Equipo de seguridad'],
    fishMarket:  ['Pescado fresco', 'Mariscos', 'Camarón', 'Pulpo', 'Filetes', 'Limpieza', 'Fileteado', 'Empaque'],
    guide:       ['Guía individual', 'Guía grupal', 'Clases básicas', 'Asesoría de equipo', 'Acompañamiento en torneos'],
    transport:   ['Terrestre', 'Marítimo', 'Privado', 'Grupal', 'Hotel-playa', 'Aeropuerto', 'Muelle'],
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }} edges={['top']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        {/* LocationPicker */}
        <LocationPicker
          visible={showLocPicker}
          initial={pickedLoc ?? undefined}
          onConfirm={(loc) => { setPickedLoc(loc); if (!location.trim()) setLocation(`${loc.latitude.toFixed(5)}, ${loc.longitude.toFixed(5)}`); }}
          onClose={() => setShowLocPicker(false)}
        />
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E2E8F0', gap: 12 }}>
          <TouchableOpacity onPress={() => router.back()}>
            <MaterialIcons name="arrow-back" size={24} color="#0F172A" />
          </TouchableOpacity>
          <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: `${def.color}18`, alignItems: 'center', justifyContent: 'center' }}>
            <MaterialIcons name={def.icon as any} size={22} color={def.color} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontWeight: '800', color: '#0F172A', fontSize: 15 }}>Registrar {def.name.toLowerCase()}</Text>
            <Text style={{ color: '#64748B', fontSize: 11 }}>Todos los datos son revisados por el admin</Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
          {/* Info box */}
          <View style={{ backgroundColor: `${def.color}08`, borderRadius: 14, borderWidth: 1, borderColor: `${def.color}20`, padding: 14, marginBottom: 16, flexDirection: 'row', gap: 10 }}>
            <MaterialIcons name="info-outline" size={18} color={def.color} style={{ marginTop: 1 }} />
            <Text style={{ flex: 1, color: '#374151', fontSize: 13, lineHeight: 19 }}>{def.description}</Text>
          </View>

          {/* Datos principales */}
          <View style={{ backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0', padding: 16, marginBottom: 14 }}>
            <Text style={{ fontWeight: '800', color: '#0F172A', fontSize: 15, marginBottom: 14 }}>Datos principales</Text>
            <Field label={`Nombre del ${def.name.toLowerCase()}`} value={name} onChange={(v) => { setName(v); setErrors((e) => ({ ...e, name: '' })); }} placeholder={`Ej. ${def.id === 'boat' ? 'Embarcación La Esperanza' : def.id === 'restaurant' ? 'Mariscos El Pescador' : def.name}`} error={errors.name} required />
            {(def.id === 'boat' || def.id === 'rental') && (
              <>
                <Text style={{ fontWeight: '700', color: '#0F172A', fontSize: 13, marginBottom: 8 }}>Tipo de embarcación *</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, marginBottom: 14 }}>
                  {BOAT_TYPES.map((t) => (
                    <TouchableOpacity key={t} onPress={() => setBoatType(t)}
                      style={{ paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999, backgroundColor: boatType === t ? COLORS.ocean : '#F1F5F9', borderWidth: 1, borderColor: boatType === t ? COLORS.ocean : '#E2E8F0' }}>
                      <Text style={{ fontWeight: '700', fontSize: 12, color: boatType === t ? '#fff' : '#0F172A' }}>{t}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </>
            )}
            {needsCaptain && <Field label="Nombre completo del capitán" value={captain} onChange={(v) => { setCaptain(v); setErrors((e) => ({ ...e, captain: '' })); }} placeholder="Ej. Juan García López" error={errors.captain} required />}
            {needsCapacity && <Field label="Capacidad de personas" value={capacity} onChange={(v) => { setCapacity(v); setErrors((e) => ({ ...e, capacity: '' })); }} placeholder="Ej. 6" keyboard="number-pad" error={errors.capacity} required />}
            {def.id === 'guide' && <Field label="Años de experiencia" value={expYears} onChange={setExpYears} placeholder="Ej. 8" keyboard="number-pad" />}
            <Field label="Ubicación / punto de salida" value={location} onChange={(v) => { setLocation(v); setErrors((e) => ({ ...e, location: '' })); }} placeholder="Ej. Muelle principal, Zihuatanejo" error={errors.location} required />
            {/* Map picker button */}
            <TouchableOpacity onPress={() => setShowLocPicker(true)}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: `${COLORS.ocean}10`, borderRadius: 12, padding: 11, marginBottom: 14, borderWidth: 1, borderColor: `${COLORS.ocean}25` }}>
              <MaterialIcons name="map" size={18} color={COLORS.ocean} />
              <Text style={{ color: COLORS.ocean, fontWeight: '800', fontSize: 13 }}>
                {pickedLoc
                  ? `📍 ${pickedLoc.latitude.toFixed(4)}° N · ${Math.abs(pickedLoc.longitude).toFixed(4)}° O`
                  : 'Marcar ubicación exacta en el mapa'}
              </Text>
            </TouchableOpacity>
            <Field label="Teléfono de contacto público" value={contact} onChange={setContact} placeholder="Ej. 7551234567" keyboard="phone-pad" />
            <Field label="Descripción" value={description} onChange={setDesc} placeholder="Describe brevemente el servicio..." multiline />
          </View>

          {/* Tipos de pesca */}
          {needsFishing && (
            <View style={{ backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0', padding: 16, marginBottom: 14 }}>
              <ChipSelector label="Tipos de pesca que realiza *" options={FISHING_TYPES} selected={fishingTypes} onToggle={toggleFishingType} />
              {fishingTypes.size > 0 && (
                <ChipSelector label="Especies que captura" options={Array.from(species)} selected={species} onToggle={(s) => setSpecies((p) => { const n = new Set(p); n.has(s) ? n.delete(s) : n.add(s); return n; })} />
              )}
            </View>
          )}

          {/* Servicios incluidos / extras */}
          {(extrasOptions[def.id] ?? []).length > 0 && (
            <View style={{ backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0', padding: 16, marginBottom: 14 }}>
              <ChipSelector label={def.hasCatalog ? 'Productos / servicios' : 'Servicios incluidos'} options={extrasOptions[def.id] ?? []} selected={extras} onToggle={toggleExtra} />
            </View>
          )}

          {/* Fotos del negocio / servicio */}
          <View style={{ backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0', padding: 16, marginBottom: 14 }}>
            <ImageUploader
              images={businessPhotos}
              onChange={setBusinessPhotos}
              maxImages={6}
              uploadPath={`providers/${def.id}`}
              label="Fotos del servicio"
              hint="Sube fotos reales del servicio, embarcación o negocio. Aparecerán en tu perfil público."
              allowCamera
            />
          </View>

          {/* Documentos */}
          <DocUploadSection serviceId={def.id} uploaded={uploaded} onToggle={toggleDoc} />
          {errors.docs && (
            <View style={{ backgroundColor: `${COLORS.danger}10`, borderRadius: 12, padding: 12, marginBottom: 14, flexDirection: 'row', gap: 8 }}>
              <MaterialIcons name="warning" size={16} color={COLORS.danger} />
              <Text style={{ color: COLORS.danger, fontSize: 13, flex: 1 }}>{errors.docs}</Text>
            </View>
          )}

          {/* Nota CONAPESCA para pesca */}
          {needsFishing && (
            <View style={{ backgroundColor: `${COLORS.info}08`, borderRadius: 14, borderWidth: 1, borderColor: `${COLORS.info}20`, padding: 14, marginBottom: 16 }}>
              <Text style={{ fontWeight: '800', color: COLORS.info, fontSize: 13, marginBottom: 6 }}>📋 Nota CONAPESCA</Text>
              <Text style={{ color: '#374151', fontSize: 12, lineHeight: 18 }}>
                El permiso de pesca deportivo-recreativa es individual. Las especies como marlín, pez vela y dorado se consideran reservadas. Las capturas deportivas no deben registrarse como producto comercial.
              </Text>
            </View>
          )}

          {/* Botones */}
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <TouchableOpacity onPress={() => save(true)} disabled={saving}
              style={{ flex: 1, padding: 14, borderRadius: 14, borderWidth: 1.5, borderColor: COLORS.ocean, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6 }}>
              <MaterialIcons name="save" size={18} color={COLORS.ocean} />
              <Text style={{ color: COLORS.ocean, fontWeight: '800' }}>Guardar borrador</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => save(false)} disabled={saving}
              style={{ flex: 1, backgroundColor: saving ? '#94A3B8' : def.color, borderRadius: 14, padding: 14, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6 }}>
              {saving ? <ActivityIndicator color="#fff" size="small" /> : <MaterialIcons name="send" size={18} color="#fff" />}
              <Text style={{ color: '#fff', fontWeight: '800' }}>{saving ? 'Enviando...' : 'Enviar para revisión'}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

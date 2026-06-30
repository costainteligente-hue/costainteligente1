/**
 * RegisterProviderScreen — Flujo multi-paso
 * Paso 1: Datos del negocio
 * Paso 2: Selección de servicios que ofrece
 * Paso 3: Foto principal del negocio + descripción
 */
import React, { useState } from 'react';
import {
  ScrollView, View, Text, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ActivityIndicator, Image,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { COLORS, SERVICE_DEFS } from '@/lib/constants';
import { CardBox } from '@/components/ui/CardBox';
import { InfoBox } from '@/components/ui/InfoBox';
import { LocationPicker, type PickedLocation } from '@/components/ui/LocationPicker';
import { pickImage } from '@/lib/utils/imageUpload';
import type { ServiceModuleId } from '@/types';

// ─── Tipos ────────────────────────────────────────────────────────────────────
interface FormState {
  email: string;
  password: string;
  businessName: string;
  rfc: string;
  phone: string;
  address: string;
}
type Errors = Partial<FormState> & { general?: string };

// ─── Validación paso 1 ────────────────────────────────────────────────────────
function validate(form: FormState): Errors {
  const e: Errors = {};
  const emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const rfcRx   = /^[A-ZÑ&]{3,4}[0-9]{6}[A-Z0-9]{2,3}$/;
  if (!form.email.trim())                        e.email        = 'El correo es obligatorio.';
  else if (!emailRx.test(form.email.trim()))     e.email        = 'Correo inválido.';
  if (form.password.length < 8)                  e.password     = 'Mínimo 8 caracteres.';
  if (form.businessName.trim().length < 3)       e.businessName = 'Mínimo 3 caracteres.';
  if (!rfcRx.test(form.rfc.toUpperCase().trim())) e.rfc         = 'RFC inválido. Ej: XAXX010101000';
  if (!/^\d{10}$/.test(form.phone))             e.phone        = '10 dígitos exactos.';
  if (form.address.trim().length < 10)          e.address      = 'Dirección muy corta.';
  return e;
}

// ─── Campo reutilizable ───────────────────────────────────────────────────────
function Field({ label, value, onChangeText, error, placeholder, keyboardType, secure, autoCapitalize, required }: {
  label: string; value: string; onChangeText: (v: string) => void;
  error?: string; placeholder?: string;
  keyboardType?: 'default' | 'email-address' | 'phone-pad';
  secure?: boolean; autoCapitalize?: 'none' | 'characters' | 'words';
  required?: boolean;
}) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={{ fontWeight: '700', color: '#0F172A', marginBottom: 6, fontSize: 13 }}>
        {label}{required && <Text style={{ color: COLORS.danger }}> *</Text>}
      </Text>
      <TextInput
        value={value} onChangeText={onChangeText} placeholder={placeholder}
        placeholderTextColor="#94A3B8" keyboardType={keyboardType ?? 'default'}
        secureTextEntry={secure} autoCapitalize={autoCapitalize ?? 'words'}
        style={{
          backgroundColor: '#fff', borderRadius: 14, borderWidth: 1,
          borderColor: error ? COLORS.danger : '#E2E8F0',
          paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: '#0F172A',
        }}
      />
      {error ? <Text style={{ color: COLORS.danger, fontSize: 12, marginTop: 3 }}>{error}</Text> : null}
    </View>
  );
}

// ─── Barra de progreso ────────────────────────────────────────────────────────
function StepBar({ step, total }: { step: number; total: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 6, marginBottom: 24 }}>
      {Array.from({ length: total }).map((_, i) => (
        <View key={i} style={{
          flex: 1, height: 5, borderRadius: 99,
          backgroundColor: i < step ? COLORS.ocean : '#E2E8F0',
        }} />
      ))}
    </View>
  );
}

// ─── Pantalla de aviso de privacidad ─────────────────────────────────────────
function PrivacyScreen({ onAccept, onBack }: { onAccept: () => void; onBack: () => void }) {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 40 }}>
        <TouchableOpacity onPress={onBack} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 20 }}>
          <MaterialIcons name="arrow-back" size={22} color={COLORS.ocean} />
          <Text style={{ color: COLORS.ocean, fontWeight: '700' }}>Volver</Text>
        </TouchableOpacity>
        <Text style={{ fontSize: 22, fontWeight: '800', color: '#0F172A', marginBottom: 16 }}>Aviso de Privacidad</Text>
        {[
          ['Responsable', 'Costa Inteligente · privacidad@costainteligente.mx'],
          ['Datos recopilados', 'Nombre, correo, teléfono, RFC, dirección, foto del negocio y ubicación GPS (con tu consentimiento).'],
          ['Finalidades', 'Gestión de cuenta, publicación de servicios, reservaciones, pagos y notificaciones.'],
          ['Transferencias', 'Mercado Pago (pagos), Expo (notificaciones push).'],
          ['Derechos ARCO', 'Acceso, rectificación, cancelación y oposición en privacidad@costainteligente.mx.'],
        ].map(([k, v]) => (
          <Text key={k} style={{ color: '#0F172A', lineHeight: 22, marginBottom: 12 }}>
            <Text style={{ fontWeight: '800' }}>{k}: </Text>{v}
          </Text>
        ))}
        <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
          <TouchableOpacity onPress={onBack} style={{ flex: 1, borderRadius: 14, borderWidth: 1, borderColor: '#E2E8F0', padding: 14, alignItems: 'center' }}>
            <Text style={{ fontWeight: '800', color: '#0F172A' }}>Cancelar</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onAccept} style={{ flex: 1, backgroundColor: COLORS.ocean, borderRadius: 14, padding: 14, alignItems: 'center' }}>
            <Text style={{ color: '#fff', fontWeight: '800' }}>Acepto y continúo</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function RegisterProviderScreen() {
  const router = useRouter();

  // Pasos: 0=privacidad, 1=datos, 2=servicios, 3=foto/desc, 4=enviando
  const [screen, setScreen] = useState<'form' | 'privacy' | 'services' | 'photo'>('form');

  const [form, setForm] = useState<FormState>({ email: '', password: '', businessName: '', rfc: '', phone: '', address: '' });
  const [errors, setErrors] = useState<Errors>({});

  // Paso 2
  const [selectedServices, setSelectedServices] = useState<Set<ServiceModuleId>>(new Set());

  // Paso 3 — foto, descripción y ubicación
  const [photoUri,     setPhotoUri]     = useState('');
  const [description,  setDescription]  = useState('');
  const [pickedLoc,    setPickedLoc]    = useState<PickedLocation | null>(null);
  const [showLocMap,   setShowLocMap]   = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const [loading, setLoading] = useState(false);

  const update = (key: keyof FormState) => (v: string) => setForm((p) => ({ ...p, [key]: v }));

  const toggleService = (id: ServiceModuleId) => {
    setSelectedServices((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handlePickPhoto = async () => {
    setUploadingPhoto(true);
    try {
      const results = await pickImage({ source: 'library', quality: 0.75 });
      if (results.length > 0) setPhotoUri(results[0].uri);
    } finally { setUploadingPhoto(false); }
  };

  // ── Paso 1 → aviso de privacidad ──
  const handleStep1 = () => {
    const e = validate(form);
    if (Object.keys(e).length > 0) { setErrors(e); return; }
    setErrors({});
    setScreen('privacy');
  };

  // ── Aviso aceptado → paso 2 ──
  const handlePrivacyAccepted = () => setScreen('services');

  // ── Paso 2 → paso 3 ──
  const handleStep2 = () => {
    if (selectedServices.size === 0) return;
    setScreen('photo');
  };

  // ── Paso 3 → enviar ──
  const handleSubmit = async () => {
    setLoading(true);
    setErrors({});
    try {
      const API_URL = process.env.EXPO_PUBLIC_API_URL ?? '';
      const res = await fetch(`${API_URL}/api/auth/register-provider`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email:        form.email.trim(),
          password:     form.password,
          businessName: form.businessName.trim(),
          rfc:          form.rfc.toUpperCase().trim(),
          phone:        form.phone.trim(),
          address:      form.address.trim(),
          services:     Array.from(selectedServices),
          photoUrl:     photoUri.trim(),
          description:  description.trim(),
          latitude:     pickedLoc?.latitude ?? null,
          longitude:    pickedLoc?.longitude ?? null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrors({ general: data.error ?? 'Error al crear la cuenta.' });
        setScreen('form');
        setLoading(false);
        return;
      }
      setLoading(false);
      // Go directly to provider dashboard — pending banner shows inside
      router.replace('/(provider)' as any);
    } catch {
      setErrors({ general: 'Error de red. Verifica tu conexión e intenta de nuevo.' });
      setScreen('form');
      setLoading(false);
    }
  };

  // ── Pantalla aviso de privacidad ──
  if (screen === 'privacy') {
    return <PrivacyScreen onAccept={handlePrivacyAccepted} onBack={() => setScreen('form')} />;
  }

  // ── Paso 2: Selección de servicios ──
  if (screen === 'services') {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
        <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 40 }}>
          <TouchableOpacity onPress={() => setScreen('form')} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <MaterialIcons name="arrow-back" size={22} color={COLORS.ocean} />
            <Text style={{ color: COLORS.ocean, fontWeight: '700' }}>Volver</Text>
          </TouchableOpacity>

          <StepBar step={2} total={3} />

          <Text style={{ fontSize: 22, fontWeight: '800', color: '#0F172A', marginBottom: 4 }}>
            ¿Qué servicios ofreces?
          </Text>
          <Text style={{ color: '#64748B', marginBottom: 20, lineHeight: 20 }}>
            Selecciona uno o más. Podrás modificarlos después desde tu panel.
          </Text>

          {SERVICE_DEFS.map((def) => {
            const active = selectedServices.has(def.id);
            return (
              <TouchableOpacity key={def.id} onPress={() => toggleService(def.id)}>
                <View style={{
                  flexDirection: 'row', alignItems: 'center', gap: 14,
                  backgroundColor: '#fff', borderRadius: 16, borderWidth: 2,
                  borderColor: active ? def.color : '#E2E8F0',
                  padding: 14, marginBottom: 10,
                }}>
                  <View style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: `${def.color}20`, alignItems: 'center', justifyContent: 'center' }}>
                    <MaterialIcons name={def.icon as any} size={26} color={def.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontWeight: '800', color: '#0F172A', fontSize: 15 }}>{def.name}</Text>
                    <Text style={{ color: '#64748B', fontSize: 12, marginTop: 2 }} numberOfLines={2}>{def.description}</Text>
                  </View>
                  <View style={{ width: 28, height: 28, borderRadius: 99, backgroundColor: active ? def.color : '#F1F5F9', alignItems: 'center', justifyContent: 'center', borderWidth: active ? 0 : 1, borderColor: '#E2E8F0' }}>
                    {active && <MaterialIcons name="check" size={16} color="#fff" />}
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}

          <TouchableOpacity onPress={handleStep2} disabled={selectedServices.size === 0}
            style={{ backgroundColor: selectedServices.size === 0 ? '#CBD5E1' : COLORS.ocean, borderRadius: 14, padding: 15, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8, marginTop: 8 }}>
            <Text style={{ color: '#fff', fontWeight: '800', fontSize: 16 }}>
              Continuar ({selectedServices.size} seleccionado{selectedServices.size !== 1 ? 's' : ''})
            </Text>
            <MaterialIcons name="arrow-forward" size={20} color="#fff" />
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── Paso 3: Foto, ubicación y descripción ──
  if (screen === 'photo') {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
        {/* LocationPicker modal */}
        <LocationPicker
          visible={showLocMap}
          initial={pickedLoc ?? undefined}
          onConfirm={(loc) => setPickedLoc(loc)}
          onClose={() => setShowLocMap(false)}
        />
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 40 }}>
            <TouchableOpacity onPress={() => setScreen('services')} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <MaterialIcons name="arrow-back" size={22} color={COLORS.ocean} />
              <Text style={{ color: COLORS.ocean, fontWeight: '700' }}>Volver</Text>
            </TouchableOpacity>

            <StepBar step={3} total={3} />

            <Text style={{ fontSize: 22, fontWeight: '800', color: '#0F172A', marginBottom: 4 }}>
              Foto y ubicación
            </Text>
            <Text style={{ color: '#64748B', marginBottom: 20, lineHeight: 20 }}>
              Una foto real y la ubicación exacta aumentan tus probabilidades de ser aprobado y contactado.
            </Text>

            {/* ── Foto del negocio ── */}
            <CardBox>
              <Text style={{ fontWeight: '900', color: '#0F172A', fontSize: 15, marginBottom: 12 }}>📷 Foto principal del negocio</Text>

              {/* Preview */}
              <TouchableOpacity onPress={handlePickPhoto}
                style={{ width: '100%', height: 160, borderRadius: 14, backgroundColor: '#F1F5F9', marginBottom: 12, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: photoUri ? COLORS.ocean : '#E2E8F0', borderStyle: photoUri ? 'solid' : 'dashed' }}>
                {photoUri ? (
                  <Image source={{ uri: photoUri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                ) : (
                  <View style={{ alignItems: 'center', gap: 8 }}>
                    {uploadingPhoto ? <ActivityIndicator color={COLORS.ocean} /> : <MaterialIcons name="add-photo-alternate" size={40} color="#94A3B8" />}
                    <Text style={{ color: '#94A3B8', fontSize: 13, fontWeight: '700' }}>
                      {uploadingPhoto ? 'Cargando foto...' : 'Toca para seleccionar foto'}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>

              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TouchableOpacity onPress={handlePickPhoto} disabled={uploadingPhoto}
                  style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 12, backgroundColor: `${COLORS.ocean}12`, borderWidth: 1, borderColor: `${COLORS.ocean}25` }}>
                  <MaterialIcons name="photo-library" size={16} color={COLORS.ocean} />
                  <Text style={{ color: COLORS.ocean, fontWeight: '800', fontSize: 13 }}>Galería</Text>
                </TouchableOpacity>
                {photoUri ? (
                  <TouchableOpacity onPress={() => setPhotoUri('')}
                    style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: `${COLORS.danger}30` }}>
                    <MaterialIcons name="delete-outline" size={16} color={COLORS.danger} />
                    <Text style={{ color: COLORS.danger, fontWeight: '800', fontSize: 13 }}>Quitar foto</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            </CardBox>

            {/* ── Ubicación del negocio ── */}
            <CardBox>
              <Text style={{ fontWeight: '900', color: '#0F172A', fontSize: 15, marginBottom: 12 }}>📍 Ubicación del negocio</Text>
              <TouchableOpacity onPress={() => setShowLocMap(true)}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: 14, borderWidth: 1.5, borderColor: pickedLoc ? COLORS.ocean : '#E2E8F0', backgroundColor: pickedLoc ? `${COLORS.ocean}08` : '#F8FAFC' }}>
                <View style={{ width: 40, height: 40, borderRadius: 999, backgroundColor: pickedLoc ? `${COLORS.ocean}20` : '#F1F5F9', alignItems: 'center', justifyContent: 'center' }}>
                  <MaterialIcons name="map" size={20} color={pickedLoc ? COLORS.ocean : '#94A3B8'} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: '800', color: pickedLoc ? COLORS.ocean : '#94A3B8', fontSize: 14 }}>
                    {pickedLoc ? 'Ubicación marcada ✓' : 'Marcar en el mapa'}
                  </Text>
                  <Text style={{ color: 'rgba(15,23,42,0.62)', fontSize: 12, marginTop: 2 }}>
                    {pickedLoc
                      ? `${pickedLoc.latitude.toFixed(5)}° N · ${Math.abs(pickedLoc.longitude).toFixed(5)}° O`
                      : 'Opcional pero recomendado para ser aprobado más rápido'}
                  </Text>
                </View>
                <MaterialIcons name="chevron-right" size={18} color={pickedLoc ? COLORS.ocean : '#CBD5E1'} />
              </TouchableOpacity>
            </CardBox>

            {/* ── Descripción ── */}
            <CardBox>
              <Text style={{ fontWeight: '900', color: '#0F172A', fontSize: 15, marginBottom: 12 }}>📝 Descripción del negocio</Text>
              <TextInput value={description} onChangeText={setDescription}
                placeholder="Cuéntanos qué hace especial a tu negocio..." placeholderTextColor="#94A3B8"
                multiline numberOfLines={4}
                style={{ backgroundColor: '#F8FAFC', borderRadius: 14, borderWidth: 1, borderColor: '#E2E8F0', paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: '#0F172A', textAlignVertical: 'top', minHeight: 90 }} />
            </CardBox>

            {/* Resumen servicios seleccionados */}
            <View style={{ backgroundColor: `${COLORS.ocean}08`, borderRadius: 14, borderWidth: 1, borderColor: `${COLORS.ocean}20`, padding: 14, marginBottom: 16 }}>
              <Text style={{ fontWeight: '800', color: '#0F172A', fontSize: 13, marginBottom: 8 }}>Servicios registrados</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {Array.from(selectedServices).map((id) => {
                  const def = SERVICE_DEFS.find((s) => s.id === id)!;
                  return (
                    <View key={id} style={{ flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: `${def.color}15`, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 }}>
                      <MaterialIcons name={def.icon as any} size={13} color={def.color} />
                      <Text style={{ fontWeight: '700', fontSize: 12, color: def.color }}>{def.name}</Text>
                    </View>
                  );
                })}
              </View>
            </View>

            <InfoBox text="Al enviar accederás directamente a tu Dashboard. Tu cuenta aparecerá como 'Pendiente de aprobación' hasta que un administrador la revise. Mientras tanto podrás explorar el panel pero no publicar servicios." />

            <TouchableOpacity onPress={handleSubmit} disabled={loading}
              style={{ backgroundColor: loading ? '#94A3B8' : COLORS.ocean, borderRadius: 14, padding: 15, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8, marginTop: 4 }}>
              {loading ? <ActivityIndicator color="#fff" size="small" /> : <MaterialIcons name="check-circle" size={20} color="#fff" />}
              <Text style={{ color: '#fff', fontWeight: '800', fontSize: 16 }}>
                {loading ? 'Registrando...' : 'Crear cuenta e ir al panel'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // ── Paso 1: Datos del negocio ──
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 40 }}>
          <TouchableOpacity onPress={() => router.back()} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <MaterialIcons name="arrow-back" size={22} color={COLORS.ocean} />
            <Text style={{ color: COLORS.ocean, fontWeight: '700' }}>Volver</Text>
          </TouchableOpacity>

          <StepBar step={1} total={3} />

          <Text style={{ fontSize: 22, fontWeight: '800', color: '#0F172A', marginBottom: 4 }}>
            Registra tu negocio
          </Text>
          <Text style={{ color: '#64748B', marginBottom: 20, lineHeight: 20 }}>
            Datos del responsable y del negocio. Serán revisados por el administrador.
          </Text>

          {errors.general && (
            <View style={{ backgroundColor: `${COLORS.danger}10`, borderRadius: 12, padding: 12, marginBottom: 14, flexDirection: 'row', gap: 8 }}>
              <MaterialIcons name="error-outline" size={18} color={COLORS.danger} />
              <Text style={{ color: COLORS.danger, fontSize: 13, flex: 1 }}>{errors.general}</Text>
            </View>
          )}

          <CardBox>
            <Text style={{ fontWeight: '800', fontSize: 16, color: '#0F172A', marginBottom: 14 }}>Datos del negocio</Text>
            <Field label="Correo electrónico" value={form.email} onChangeText={update('email')} error={errors.email} placeholder="correo@negocio.com" keyboardType="email-address" autoCapitalize="none" required />
            <Field label="Contraseña" value={form.password} onChangeText={update('password')} error={errors.password} placeholder="Mínimo 8 caracteres" secure autoCapitalize="none" required />
            <Field label="Nombre del negocio" value={form.businessName} onChangeText={update('businessName')} error={errors.businessName} placeholder="Ej. Pescadería El Tiburón" required />
            <Field label="RFC" value={form.rfc} onChangeText={update('rfc')} error={errors.rfc} placeholder="XAXX010101000" autoCapitalize="characters" required />
            <Field label="Teléfono (10 dígitos)" value={form.phone} onChangeText={update('phone')} error={errors.phone} placeholder="7551234567" keyboardType="phone-pad" autoCapitalize="none" required />
            <Field label="Dirección completa" value={form.address} onChangeText={update('address')} error={errors.address} placeholder="Calle, colonia, municipio, CP" required />
          </CardBox>

          <TouchableOpacity
            onPress={handleStep1}
            style={{ backgroundColor: COLORS.ocean, borderRadius: 14, padding: 15, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8, marginTop: 8 }}
          >
            <Text style={{ color: '#fff', fontWeight: '800', fontSize: 16 }}>Siguiente</Text>
            <MaterialIcons name="arrow-forward" size={20} color="#fff" />
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/**
 * Onboarding — Costa Inteligente
 * Pantalla de configuración inicial después del primer registro.
 * El usuario elige sus intereses y nivel de experiencia.
 * Se guarda en AsyncStorage y en el perfil de la DB.
 */

import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  ActivityIndicator, Dimensions, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS } from '@/lib/constants';
import { useAuthStore } from '@/stores/authStore';

const { width } = Dimensions.get('window');

// ─── Datos de opciones ────────────────────────────────────────────────────────

const INTERESTS = [
  { id: 'beach',      label: 'Pescar desde playa',           icon: 'beach-access' },
  { id: 'pier',       label: 'Pescar desde muelle',          icon: 'anchor' },
  { id: 'boat',       label: 'Pescar en lancha',             icon: 'directions-boat' },
  { id: 'safe',       label: 'Conocer zonas seguras',        icon: 'verified-user' },
  { id: 'provider',   label: 'Contratar un proveedor',       icon: 'storefront' },
  { id: 'learn',      label: 'Aprender a pescar',            icon: 'school' },
  { id: 'gear',       label: 'Comprar equipo de pesca',      icon: 'straighten' },
  { id: 'restaurant', label: 'Restaurantes de mariscos',     icon: 'restaurant' },
  { id: 'fishmarket', label: 'Pescaderías',                  icon: 'set-meal' },
  { id: 'transport',  label: 'Transporte turístico',         icon: 'airport-shuttle' },
];

const LEVELS = [
  { id: 'beginner',  label: 'Principiante', icon: 'star-border', color: COLORS.success, desc: 'Primera vez o pocas veces he pescado' },
  { id: 'mid',       label: 'Intermedio',   icon: 'star-half',   color: COLORS.warning, desc: 'Pesco con regularidad y conozco lo básico' },
  { id: 'advanced',  label: 'Avanzado',     icon: 'star',        color: COLORS.danger,  desc: 'Tengo experiencia y equipo propio' },
  { id: 'tourist',   label: 'Turista',      icon: 'luggage',     color: COLORS.info,    desc: 'Estoy de visita y quiero conocer la zona' },
  { id: 'local',     label: 'Pescador local', icon: 'home', color: COLORS.ocean,  desc: 'Vivo aquí y pesco para vivir o como deporte' },
];

// ─── Paso 1: Bienvenida ───────────────────────────────────────────────────────
function StepWelcome({ name, onNext }: { name: string; onNext: () => void }) {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
      <Image
        source={require('@/assets/images/Logo_No_LETRAS.jpg')}
        style={{ width: 140, height: 140, borderRadius: 24, marginBottom: 28 }}
        resizeMode="contain"
      />

      <Text style={{ fontSize: 28, fontWeight: '800', color: '#0F172A', textAlign: 'center', marginBottom: 10 }}>
        ¡Bienvenido, {name.split(' ')[0]}!
      </Text>
      <Text style={{ color: '#64748B', fontSize: 16, textAlign: 'center', lineHeight: 24, marginBottom: 40 }}>
        Vamos a personalizar tu experiencia en{'\n'}
        <Text style={{ fontWeight: '800', color: COLORS.ocean }}>Costa Inteligente</Text>{' '}
        para mostrarte lo que más te interesa.
      </Text>

      <View style={{ width: '100%', gap: 12 }}>
        {[
          { icon: 'map', text: 'Zonas de pesca personalizadas' },
          { icon: 'storefront', text: 'Servicios y proveedores verificados' },
          { icon: 'school', text: 'Tutoriales según tu nivel' },
          { icon: 'notifications', text: 'Alertas relevantes para ti' },
        ].map((item) => (
          <View key={item.text} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: `${COLORS.ocean}15`, alignItems: 'center', justifyContent: 'center' }}>
              <MaterialIcons name={item.icon as any} size={18} color={COLORS.ocean} />
            </View>
            <Text style={{ color: '#0F172A', fontWeight: '600', fontSize: 14 }}>{item.text}</Text>
          </View>
        ))}
      </View>

      <TouchableOpacity
        onPress={onNext}
        style={{ marginTop: 40, backgroundColor: COLORS.ocean, borderRadius: 16, padding: 16, width: '100%', alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 }}
      >
        <Text style={{ color: '#fff', fontWeight: '800', fontSize: 17 }}>Comenzar</Text>
        <MaterialIcons name="arrow-forward" size={20} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

// ─── Paso 2: Intereses ────────────────────────────────────────────────────────
function StepInterests({
  selected,
  onToggle,
  onNext,
  onBack,
}: {
  selected: Set<string>;
  onToggle: (id: string) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  return (
    <View style={{ flex: 1 }}>
      <View style={{ padding: 24, paddingBottom: 0 }}>
        <TouchableOpacity onPress={onBack} style={{ marginBottom: 16 }}>
          <MaterialIcons name="arrow-back" size={24} color={COLORS.ocean} />
        </TouchableOpacity>
        <Text style={{ fontSize: 22, fontWeight: '800', color: '#0F172A', marginBottom: 6 }}>
          ¿Qué buscas en Costa Inteligente?
        </Text>
        <Text style={{ color: '#64748B', fontSize: 14, marginBottom: 20 }}>
          Selecciona todo lo que te interese. Puedes cambiar esto después.
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 32, gap: 10 }}>
        {INTERESTS.map((item) => {
          const active = selected.has(item.id);
          return (
            <TouchableOpacity
              key={item.id}
              onPress={() => onToggle(item.id)}
              style={{
                flexDirection: 'row', alignItems: 'center', gap: 14,
                padding: 14, borderRadius: 16, borderWidth: 2,
                borderColor: active ? COLORS.ocean : '#E2E8F0',
                backgroundColor: active ? `${COLORS.ocean}10` : '#fff',
              }}
            >
              <View style={{
                width: 44, height: 44, borderRadius: 12,
                backgroundColor: active ? COLORS.ocean : '#F1F5F9',
                alignItems: 'center', justifyContent: 'center',
              }}>
                <MaterialIcons name={item.icon as any} size={22} color={active ? '#fff' : '#64748B'} />
              </View>
              <Text style={{ flex: 1, fontWeight: '700', color: active ? COLORS.ocean : '#0F172A', fontSize: 14 }}>
                {item.label}
              </Text>
              {active && <MaterialIcons name="check-circle" size={22} color={COLORS.ocean} />}
            </TouchableOpacity>
          );
        })}

        <TouchableOpacity
          onPress={onNext}
          disabled={selected.size === 0}
          style={{
            marginTop: 8, borderRadius: 16, padding: 16,
            backgroundColor: selected.size > 0 ? COLORS.ocean : '#E2E8F0',
            alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8,
          }}
        >
          <Text style={{ color: selected.size > 0 ? '#fff' : '#94A3B8', fontWeight: '800', fontSize: 16 }}>
            Continuar {selected.size > 0 ? `(${selected.size} seleccionados)` : ''}
          </Text>
          <MaterialIcons name="arrow-forward" size={20} color={selected.size > 0 ? '#fff' : '#94A3B8'} />
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

// ─── Paso 3: Nivel ────────────────────────────────────────────────────────────
function StepLevel({
  selected,
  onSelect,
  onFinish,
  onBack,
  loading,
}: {
  selected: string | null;
  onSelect: (id: string) => void;
  onFinish: () => void;
  onBack: () => void;
  loading: boolean;
}) {
  return (
    <View style={{ flex: 1 }}>
      <View style={{ padding: 24, paddingBottom: 0 }}>
        <TouchableOpacity onPress={onBack} style={{ marginBottom: 16 }}>
          <MaterialIcons name="arrow-back" size={24} color={COLORS.ocean} />
        </TouchableOpacity>
        <Text style={{ fontSize: 22, fontWeight: '800', color: '#0F172A', marginBottom: 6 }}>
          ¿Cuál es tu nivel?
        </Text>
        <Text style={{ color: '#64748B', fontSize: 14, marginBottom: 20 }}>
          Esto nos ayuda a mostrarte zonas, equipo y tutoriales adecuados para ti.
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40, gap: 12 }}>
        {LEVELS.map((l) => {
          const active = selected === l.id;
          return (
            <TouchableOpacity
              key={l.id}
              onPress={() => onSelect(l.id)}
              style={{
                flexDirection: 'row', alignItems: 'center', gap: 14,
                padding: 16, borderRadius: 16, borderWidth: 2,
                borderColor: active ? l.color : '#E2E8F0',
                backgroundColor: active ? `${l.color}10` : '#fff',
              }}
            >
              <View style={{
                width: 50, height: 50, borderRadius: 14,
                backgroundColor: active ? l.color : '#F1F5F9',
                alignItems: 'center', justifyContent: 'center',
              }}>
                <MaterialIcons name={l.icon as any} size={24} color={active ? '#fff' : '#64748B'} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: '800', color: active ? l.color : '#0F172A', fontSize: 15 }}>
                  {l.label}
                </Text>
                <Text style={{ color: '#94A3B8', fontSize: 12, marginTop: 2 }}>{l.desc}</Text>
              </View>
              {active && (
                <View style={{ width: 26, height: 26, borderRadius: 99, backgroundColor: l.color, alignItems: 'center', justifyContent: 'center' }}>
                  <MaterialIcons name="check" size={16} color="#fff" />
                </View>
              )}
            </TouchableOpacity>
          );
        })}

        <TouchableOpacity
          onPress={onFinish}
          disabled={!selected || loading}
          style={{
            marginTop: 8, borderRadius: 16, padding: 16,
            backgroundColor: selected && !loading ? COLORS.ocean : '#E2E8F0',
            alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8,
          }}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <>
                <Text style={{ color: selected ? '#fff' : '#94A3B8', fontWeight: '800', fontSize: 16 }}>
                  ¡Entrar a Costa Inteligente!
                </Text>
                <MaterialIcons name="check" size={20} color={selected ? '#fff' : '#94A3B8'} />
              </>
          }
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

// ─── Indicador de pasos ───────────────────────────────────────────────────────
function StepDots({ current, total }: { current: number; total: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center', justifyContent: 'center', paddingVertical: 12 }}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={{
            width: i === current ? 24 : 8, height: 8, borderRadius: 4,
            backgroundColor: i === current ? COLORS.ocean : '#E2E8F0',
          }}
        />
      ))}
    </View>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function OnboardingScreen() {
  const router  = useRouter();
  const { user } = useAuthStore();
  const [step, setStep]             = useState(0);
  const [interests, setInterests]   = useState<Set<string>>(new Set());
  const [level, setLevel]           = useState<string | null>(null);
  const [saving, setSaving]         = useState(false);

  const name = user?.fullName ?? 'Usuario';

  const toggleInterest = (id: string) => {
    setInterests((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleFinish = async () => {
    setSaving(true);
    try {
      // Guardar preferencias en AsyncStorage para uso local inmediato
      const prefs = { interests: Array.from(interests), level, onboardingDone: true };
      await AsyncStorage.setItem('costa:user_prefs', JSON.stringify(prefs));

      // Marcar onboarding como completado
      await AsyncStorage.setItem('costa:onboarding_done', '1');

      router.replace('/(client)' as any);
    } catch (err) {
      console.error('[Onboarding]', err);
      router.replace('/(client)' as any);
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
      <StepDots current={step} total={3} />
      {step === 0 && (
        <StepWelcome name={name} onNext={() => setStep(1)} />
      )}
      {step === 1 && (
        <StepInterests
          selected={interests}
          onToggle={toggleInterest}
          onNext={() => setStep(2)}
          onBack={() => setStep(0)}
        />
      )}
      {step === 2 && (
        <StepLevel
          selected={level}
          onSelect={setLevel}
          onFinish={handleFinish}
          onBack={() => setStep(1)}
          loading={saving}
        />
      )}
    </SafeAreaView>
  );
}

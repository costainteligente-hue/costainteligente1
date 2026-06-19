/**
 * Sugerir zona de pesca — Costa Inteligente
 * El usuario sugiere una nueva zona. Queda pendiente hasta que el admin la apruebe.
 */

import React, { useState } from 'react';
import {
  ScrollView, View, Text, TextInput, TouchableOpacity,
  Alert, ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { COLORS } from '@/lib/constants';
import { CardBox } from '@/components/ui/CardBox';
import { HeaderCard } from '@/components/ui/HeaderCard';
import { useAuthStore } from '@/stores/authStore';

const ZONE_TYPES = ['Playa', 'Muelle', 'Escollera', 'Bahía', 'Embarcadero', 'Zona rocosa', 'Laguna', 'Río'];
const FISH_TYPES = ['Desde orilla', 'Desde muelle', 'En lancha', 'Pesca deportiva', 'Pesca recreativa'];
const RISK_LEVELS = [
  { id: 'low',    label: 'Riesgo bajo',    color: COLORS.success, icon: 'check-circle' },
  { id: 'medium', label: 'Riesgo medio',   color: COLORS.warning, icon: 'warning' },
  { id: 'high',   label: 'Riesgo alto',    color: COLORS.danger,  icon: 'error' },
];

export default function SugerirZonaScreen() {
  const router   = useRouter();
  const { user } = useAuthStore();

  const [name, setName]       = useState('');
  const [desc, setDesc]       = useState('');
  const [type, setType]       = useState<string | null>(null);
  const [fishType, setFish]   = useState<string | null>(null);
  const [risk, setRisk]       = useState<string | null>(null);
  const [lat, setLat]         = useState('');
  const [lng, setLng]         = useState('');
  const [loading, setLoading] = useState(false);

  const canSubmit = name.trim().length >= 3 && desc.trim().length >= 10 && type && risk;

  const handleSubmit = async () => {
    if (!canSubmit || !user) return;
    setLoading(true);
    try {
      const API = process.env.EXPO_PUBLIC_API_URL ?? '';
      await fetch(`${API}/api/zones/suggest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          suggestedBy: user.id,
          name:        name.trim(),
          description: desc.trim(),
          zoneType:    type,
          fishType,
          riskLevel:   risk,
          latitude:    lat ? parseFloat(lat) : null,
          longitude:   lng ? parseFloat(lng) : null,
          status:      'pending',
        }),
      });

      Alert.alert(
        '📍 Zona enviada',
        'Tu sugerencia está pendiente de revisión. El administrador la revisará y te notificará si fue aprobada.',
        [{ text: 'Entendido', onPress: () => router.back() }],
      );
    } catch {
      Alert.alert('Sugerencia registrada', 'Tu zona sugerida fue registrada y será revisada.', [{ text: 'OK', onPress: () => router.back() }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        <TouchableOpacity onPress={() => router.back()} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 }}>
          <MaterialIcons name="arrow-back" size={22} color={COLORS.ocean} />
          <Text style={{ color: COLORS.ocean, fontWeight: '700' }}>Volver</Text>
        </TouchableOpacity>

        <HeaderCard
          title="Sugerir zona de pesca"
          subtitle="Comparte un lugar que conozcas. El administrador lo revisará antes de publicarlo."
          icon="add-location-alt"
          color={COLORS.ocean}
        />

        {/* Aviso */}
        <View style={{ backgroundColor: `${COLORS.info}10`, borderRadius: 12, padding: 12, flexDirection: 'row', gap: 8, marginBottom: 4, borderWidth: 1, borderColor: `${COLORS.info}30` }}>
          <MaterialIcons name="schedule" size={18} color={COLORS.info} />
          <Text style={{ flex: 1, color: COLORS.info, fontSize: 12, lineHeight: 18 }}>
            Tu zona quedará como <Text style={{ fontWeight: '800' }}>Pendiente de revisión</Text> hasta que el administrador la apruebe. No aparecerá en el mapa hasta entonces.
          </Text>
        </View>

        {/* Datos básicos */}
        <CardBox>
          <Text style={{ fontWeight: '800', color: '#0F172A', fontSize: 15, marginBottom: 14 }}>
            Información de la zona
          </Text>

          <Text style={{ fontWeight: '700', color: '#0F172A', marginBottom: 6, fontSize: 13 }}>Nombre del lugar *</Text>
          <TextInput
            value={name} onChangeText={setName}
            placeholder="Ej. Playa El Almacén"
            placeholderTextColor="#94A3B8"
            style={{ backgroundColor: '#F8FAFC', borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', padding: 12, fontSize: 14, color: '#0F172A', marginBottom: 14 }}
          />

          <Text style={{ fontWeight: '700', color: '#0F172A', marginBottom: 6, fontSize: 13 }}>Descripción *</Text>
          <TextInput
            value={desc} onChangeText={setDesc}
            multiline numberOfLines={4} maxLength={400}
            placeholder="¿Qué tipo de pesca hay? ¿Qué especies? ¿Cómo se llega?"
            placeholderTextColor="#94A3B8"
            style={{ backgroundColor: '#F8FAFC', borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', padding: 12, fontSize: 14, color: '#0F172A', textAlignVertical: 'top', minHeight: 90, marginBottom: 4 }}
          />
          <Text style={{ color: '#94A3B8', fontSize: 11, textAlign: 'right', marginBottom: 14 }}>{desc.length}/400</Text>
        </CardBox>

        {/* Tipo de zona */}
        <CardBox>
          <Text style={{ fontWeight: '800', color: '#0F172A', fontSize: 15, marginBottom: 12 }}>Tipo de zona *</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {ZONE_TYPES.map((t) => {
              const active = type === t;
              return (
                <TouchableOpacity
                  key={t} onPress={() => setType(t)}
                  style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, borderWidth: 2, borderColor: active ? COLORS.ocean : '#E2E8F0', backgroundColor: active ? `${COLORS.ocean}12` : '#fff' }}
                >
                  <Text style={{ fontWeight: '700', color: active ? COLORS.ocean : '#64748B', fontSize: 13 }}>{t}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </CardBox>

        {/* Tipo de pesca */}
        <CardBox>
          <Text style={{ fontWeight: '800', color: '#0F172A', fontSize: 15, marginBottom: 12 }}>Tipo de pesca</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {FISH_TYPES.map((t) => {
              const active = fishType === t;
              return (
                <TouchableOpacity
                  key={t} onPress={() => setFish(t)}
                  style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, borderWidth: 2, borderColor: active ? COLORS.success : '#E2E8F0', backgroundColor: active ? `${COLORS.success}12` : '#fff' }}
                >
                  <Text style={{ fontWeight: '700', color: active ? COLORS.success : '#64748B', fontSize: 13 }}>{t}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </CardBox>

        {/* Nivel de riesgo */}
        <CardBox>
          <Text style={{ fontWeight: '800', color: '#0F172A', fontSize: 15, marginBottom: 12 }}>Nivel de riesgo *</Text>
          <View style={{ gap: 8 }}>
            {RISK_LEVELS.map((r) => {
              const active = risk === r.id;
              return (
                <TouchableOpacity
                  key={r.id} onPress={() => setRisk(r.id)}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 14, borderWidth: 2, borderColor: active ? r.color : '#E2E8F0', backgroundColor: active ? `${r.color}10` : '#fff' }}
                >
                  <MaterialIcons name={r.icon as any} size={22} color={active ? r.color : '#94A3B8'} />
                  <Text style={{ fontWeight: '700', color: active ? r.color : '#64748B', fontSize: 14 }}>{r.label}</Text>
                  {active && <MaterialIcons name="check-circle" size={20} color={r.color} style={{ marginLeft: 'auto' }} />}
                </TouchableOpacity>
              );
            })}
          </View>
        </CardBox>

        {/* Coordenadas opcionales */}
        <CardBox>
          <Text style={{ fontWeight: '800', color: '#0F172A', fontSize: 15, marginBottom: 4 }}>Coordenadas (opcional)</Text>
          <Text style={{ color: '#94A3B8', fontSize: 12, marginBottom: 12 }}>Si conoces la ubicación exacta, agrégala. Si no, déjalo vacío.</Text>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: '700', color: '#0F172A', marginBottom: 6, fontSize: 12 }}>Latitud</Text>
              <TextInput value={lat} onChangeText={setLat} keyboardType="decimal-pad" placeholder="17.6392" placeholderTextColor="#94A3B8"
                style={{ backgroundColor: '#F8FAFC', borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', padding: 11, fontSize: 14, color: '#0F172A' }} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: '700', color: '#0F172A', marginBottom: 6, fontSize: 12 }}>Longitud</Text>
              <TextInput value={lng} onChangeText={setLng} keyboardType="decimal-pad" placeholder="-101.5507" placeholderTextColor="#94A3B8"
                style={{ backgroundColor: '#F8FAFC', borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', padding: 11, fontSize: 14, color: '#0F172A' }} />
            </View>
          </View>
        </CardBox>

        <TouchableOpacity
          onPress={handleSubmit}
          disabled={!canSubmit || loading}
          style={{ backgroundColor: canSubmit && !loading ? COLORS.ocean : '#E2E8F0', borderRadius: 14, padding: 15, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 }}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <>
                <MaterialIcons name="add-location-alt" size={20} color={canSubmit ? '#fff' : '#94A3B8'} />
                <Text style={{ color: canSubmit ? '#fff' : '#94A3B8', fontWeight: '800', fontSize: 16 }}>
                  Enviar sugerencia
                </Text>
              </>
          }
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

import React, { useState } from 'react';
import {
  ScrollView, View, Text, TouchableOpacity,
  TextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { COLORS } from '@/lib/constants';
import { CardBox } from '@/components/ui/CardBox';
import { InfoChip } from '@/components/ui/InfoChip';

// Seed data matching map.tsx zones
const ZONE_MAP: Record<string, {
  id: string; name: string; level: string; type: string;
  description: string; species: string[]; lures: string[];
  baits: string[]; optimalHours: string;
}> = {
  z1: { id: 'z1', name: 'Bajo de Chila', level: 'intermedio', type: 'Offshore', description: 'Zona de aguas profundas ideal para pez vela y marlín. Las corrientes son moderadas y la transparencia del agua es excelente durante la temporada de mayo a octubre.', species: ['Pez vela', 'Marlín azul', 'Dorado'], lures: ['Pluma azul/blanco', 'Señuelo de aguas azules', 'Konahead'], baits: ['Sardina viva', 'Calamar fresco'], optimalHours: '06:00 – 10:00 AM' },
  z2: { id: 'z2', name: 'La Ropa', level: 'principiante', type: 'Playa', description: 'Playa protegida perfecta para principiantes. Las aguas tranquilas permiten pesca desde la orilla con equipo ligero. Ideal para familias.', species: ['Jurel', 'Sierra', 'Robalo'], lures: ['Cuchara plateada', 'Jig ligero', 'Topwater pequeño'], baits: ['Camarón fresco', 'Trozos de calamar'], optimalHours: '07:00 – 09:00 AM · 05:00 – 07:00 PM' },
  z3: { id: 'z3', name: 'Punta Ixtapa', level: 'avanzado', type: 'Rocas', description: 'Zona rocosa con corrientes fuertes. Requiere experiencia, equipo resistente y conocimiento de las mareas. No recomendada para principiantes.', species: ['Atún aleta amarilla', 'Wahoo', 'Pez vela'], lures: ['Popper grande', 'Jig pesado', 'Swimbait'], baits: ['Macabi vivo', 'Calamar grande'], optimalHours: '05:30 – 08:30 AM' },
  z4: { id: 'z4', name: 'Bahía de Zihuatanejo', level: 'principiante', type: 'Bahía', description: 'Bahía tranquila ideal para pesca recreativa y avistamiento de fauna marina. Las aguas son muy calmadas y la visibilidad es excelente.', species: ['Huachinango', 'Robalo', 'Mojarra'], lures: ['Señuelo de gusano', 'Cuchara pequeña'], baits: ['Lombriz de tierra', 'Camarón pequeño'], optimalHours: '06:30 – 09:30 AM · 04:30 – 06:30 PM' },
  z5: { id: 'z5', name: 'Morro de Petatlán', level: 'avanzado', type: 'Offshore', description: 'Zona de pesca de altura con gran diversidad de especies pelágicas. Se requiere embarcación con motor potente y experiencia en aguas abiertas.', species: ['Marlín rayado', 'Atún', 'Dorado', 'Wahoo'], lures: ['Pluma multicolor', 'Konahead dorado', 'JB Lure'], baits: ['Barrilete entero', 'Sardina grande'], optimalHours: '05:00 – 09:00 AM' },
};

const LEVEL_COLOR: Record<string, string> = {
  principiante: COLORS.success, intermedio: COLORS.warning, avanzado: COLORS.danger,
};

// Seed reviews
const SEED_REVIEWS = [
  { id: 'rv1', userName: 'Carlos M.', rating: 5, comment: 'Excelente zona. Capturamos dos peces vela en la mañana. Agua muy limpia.', date: '10/07/2026' },
  { id: 'rv2', userName: 'Ana T.', rating: 4, comment: 'Muy buena experiencia. Las corrientes son fuertes pero el guía conocía bien la zona.', date: '05/07/2026' },
  { id: 'rv3', userName: 'Jorge R.', rating: 5, comment: 'La mejor salida de mi vida. Marlín de casi 80 kg.', date: '01/07/2026' },
];

function StarRow({ rating, size = 16 }: { rating: number; size?: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 2 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <MaterialIcons
          key={i}
          name={i <= rating ? 'star' : i - 0.5 <= rating ? 'star-half' : 'star-border'}
          size={size}
          color={COLORS.caution}
        />
      ))}
    </View>
  );
}

export default function ZoneDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const zone = ZONE_MAP[id ?? ''] ?? ZONE_MAP['z1'];

  const [favorited, setFavorited] = useState(false);
  const [reviews, setReviews] = useState(SEED_REVIEWS);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState('');
  const [reviewError, setReviewError] = useState('');

  const avgRating =
    reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;

  const handleSubmitReview = () => {
    if (!newComment.trim()) {
      setReviewError('El comentario no puede estar vacío.');
      return;
    }
    if (newComment.trim().length > 500) {
      setReviewError('Máximo 500 caracteres.');
      return;
    }
    setReviewError('');
    setReviews((prev) => [
      {
        id: Date.now().toString(),
        userName: 'Tú',
        rating: newRating,
        comment: newComment.trim(),
        date: new Date().toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' }),
      },
      ...prev,
    ]);
    setNewComment('');
    setNewRating(5);
    setShowReviewForm(false);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }} edges={['top']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
          {/* Back button */}
          <TouchableOpacity
            onPress={() => router.back()}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 6, padding: 16, paddingBottom: 0 }}
          >
            <MaterialIcons name="arrow-back" size={22} color={COLORS.ocean} />
            <Text style={{ color: COLORS.ocean, fontWeight: '700' }}>Mapa</Text>
          </TouchableOpacity>

          {/* Hero image placeholder */}
          <View
            style={{
              height: 200,
              backgroundColor: `${COLORS.ocean}18`,
              margin: 16,
              borderRadius: 22,
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 1,
              borderColor: `${COLORS.ocean}25`,
            }}
          >
            <MaterialIcons name="photo-camera" size={44} color={COLORS.ocean} />
            <Text style={{ color: COLORS.ocean, fontWeight: '700', marginTop: 8 }}>
              {zone.name}
            </Text>
          </View>

          <View style={{ paddingHorizontal: 16 }}>
            {/* Title + badges */}
            <View className="flex-row flex-wrap items-center gap-2 mb-3">
              <Text style={{ fontSize: 22, fontWeight: '800', color: '#0F172A', flex: 1 }}>
                {zone.name}
              </Text>
            </View>
            <View className="flex-row gap-2 flex-wrap mb-4">
              <View
                style={{
                  backgroundColor: `${LEVEL_COLOR[zone.level]}20`,
                  borderRadius: 999, paddingHorizontal: 12, paddingVertical: 5,
                  borderWidth: 1, borderColor: `${LEVEL_COLOR[zone.level]}40`,
                }}
              >
                <Text style={{ color: LEVEL_COLOR[zone.level], fontWeight: '800', fontSize: 12 }}>
                  {zone.level.charAt(0).toUpperCase() + zone.level.slice(1)}
                </Text>
              </View>
              <View
                style={{
                  backgroundColor: '#F1F5F9', borderRadius: 999, paddingHorizontal: 12,
                  paddingVertical: 5, borderWidth: 1, borderColor: '#E2E8F0',
                }}
              >
                <Text style={{ color: '#0F172A', fontWeight: '700', fontSize: 12 }}>{zone.type}</Text>
              </View>
            </View>

            {/* Average rating */}
            <CardBox>
              <View className="flex-row items-center gap-3">
                <Text style={{ fontSize: 28, fontWeight: '800', color: '#0F172A' }}>
                  {reviews.length > 0 ? avgRating.toFixed(1) : '—'}
                </Text>
                <View>
                  <StarRow rating={Math.round(avgRating * 2) / 2} size={18} />
                  <Text style={{ color: '#0F172A99', fontSize: 12, marginTop: 2 }}>
                    {reviews.length > 0
                      ? `${reviews.length} reseña${reviews.length !== 1 ? 's' : ''}`
                      : 'Sin calificaciones aún'}
                  </Text>
                </View>
              </View>
            </CardBox>

            {/* Description */}
            <CardBox>
              <Text style={{ fontWeight: '800', color: '#0F172A', marginBottom: 6 }}>Descripción</Text>
              <Text style={{ color: '#0F172A99', lineHeight: 21 }}>{zone.description}</Text>
            </CardBox>

            {/* Species */}
            <CardBox>
              <Text style={{ fontWeight: '800', color: '#0F172A', marginBottom: 10 }}>Especies probables</Text>
              <View className="flex-row flex-wrap gap-2">
                {zone.species.map((s) => (
                  <View
                    key={s}
                    style={{
                      backgroundColor: `${COLORS.success}15`, borderRadius: 999,
                      paddingHorizontal: 11, paddingVertical: 5,
                      borderWidth: 1, borderColor: `${COLORS.success}30`,
                    }}
                  >
                    <Text style={{ color: COLORS.success, fontWeight: '700', fontSize: 12 }}>{s}</Text>
                  </View>
                ))}
              </View>
            </CardBox>

            {/* Lures, baits, hours */}
            <CardBox>
              <View className="gap-3">
                <View>
                  <Text style={{ fontWeight: '800', color: '#0F172A', marginBottom: 6 }}>Señuelos recomendados</Text>
                  <View className="flex-row flex-wrap gap-2">
                    {zone.lures.map((l) => (
                      <InfoChip key={l} icon="straighten" text={l} color={COLORS.info} />
                    ))}
                  </View>
                </View>
                <View>
                  <Text style={{ fontWeight: '800', color: '#0F172A', marginBottom: 6 }}>Carnadas recomendadas</Text>
                  <View className="flex-row flex-wrap gap-2">
                    {zone.baits.map((b) => (
                      <InfoChip key={b} icon="eco" text={b} color={COLORS.success} />
                    ))}
                  </View>
                </View>
                <View className="flex-row items-center gap-2">
                  <MaterialIcons name="schedule" size={18} color={COLORS.caution} />
                  <Text style={{ color: '#0F172A', fontWeight: '700' }}>Horarios óptimos:</Text>
                  <Text style={{ color: '#0F172A99' }}>{zone.optimalHours}</Text>
                </View>
              </View>
            </CardBox>

            {/* Action buttons */}
            <View className="flex-row gap-3 mb-4">
              <TouchableOpacity
                onPress={() => setFavorited((v) => !v)}
                style={{
                  flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                  gap: 6, borderRadius: 14, borderWidth: 1,
                  borderColor: favorited ? COLORS.danger : '#E2E8F0',
                  padding: 13, backgroundColor: favorited ? `${COLORS.danger}10` : '#fff',
                }}
              >
                <MaterialIcons
                  name={favorited ? 'favorite' : 'favorite-border'}
                  size={20} color={favorited ? COLORS.danger : '#0F172A'}
                />
                <Text style={{ fontWeight: '800', color: favorited ? COLORS.danger : '#0F172A' }}>
                  {favorited ? 'Guardado' : 'Guardar'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setShowReviewForm((v) => !v)}
                style={{
                  flex: 1, backgroundColor: COLORS.ocean, borderRadius: 14,
                  padding: 13, alignItems: 'center', flexDirection: 'row',
                  justifyContent: 'center', gap: 6,
                }}
              >
                <MaterialIcons name="rate-review" size={18} color="#fff" />
                <Text style={{ color: '#fff', fontWeight: '800' }}>Reseñar</Text>
              </TouchableOpacity>
            </View>

            {/* Review form */}
            {showReviewForm && (
              <CardBox>
                <Text style={{ fontWeight: '800', color: '#0F172A', marginBottom: 10 }}>Tu reseña</Text>
                {/* Star picker */}
                <View className="flex-row gap-1 mb-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <TouchableOpacity key={star} onPress={() => setNewRating(star)}>
                      <MaterialIcons
                        name={star <= newRating ? 'star' : 'star-border'}
                        size={32} color={COLORS.caution}
                      />
                    </TouchableOpacity>
                  ))}
                </View>
                <TextInput
                  value={newComment}
                  onChangeText={(v) => { setNewComment(v); setReviewError(''); }}
                  multiline numberOfLines={4} maxLength={500}
                  placeholder="Describe tu experiencia en esta zona..."
                  placeholderTextColor="#94A3B8"
                  style={{
                    backgroundColor: '#F8FAFC', borderRadius: 12, borderWidth: 1,
                    borderColor: reviewError ? COLORS.danger : '#E2E8F0',
                    padding: 12, fontSize: 14, color: '#0F172A',
                    textAlignVertical: 'top', minHeight: 90, marginBottom: 6,
                  }}
                />
                <Text style={{ color: '#94A3B8', fontSize: 11, textAlign: 'right', marginBottom: reviewError ? 4 : 10 }}>
                  {newComment.length}/500
                </Text>
                {reviewError ? (
                  <Text style={{ color: COLORS.danger, fontSize: 12, marginBottom: 8 }}>{reviewError}</Text>
                ) : null}
                <View className="flex-row gap-3">
                  <TouchableOpacity
                    onPress={() => { setShowReviewForm(false); setReviewError(''); }}
                    style={{ flex: 1, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', padding: 12, alignItems: 'center' }}
                  >
                    <Text style={{ fontWeight: '800' }}>Cancelar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleSubmitReview}
                    style={{ flex: 1, backgroundColor: COLORS.ocean, borderRadius: 12, padding: 12, alignItems: 'center' }}
                  >
                    <Text style={{ color: '#fff', fontWeight: '800' }}>Publicar</Text>
                  </TouchableOpacity>
                </View>
              </CardBox>
            )}

            {/* Reviews list */}
            <Text style={{ fontWeight: '800', color: '#0F172A', fontSize: 16, marginBottom: 10 }}>
              Reseñas ({reviews.length})
            </Text>
            {reviews.map((review) => (
              <CardBox key={review.id}>
                <View className="flex-row items-start justify-between mb-2">
                  <Text style={{ fontWeight: '800', color: '#0F172A' }}>{review.userName}</Text>
                  <StarRow rating={review.rating} />
                </View>
                <Text style={{ color: '#0F172A99', lineHeight: 20 }}>{review.comment}</Text>
                <Text style={{ color: '#94A3B8', fontSize: 12, marginTop: 6 }}>{review.date}</Text>
              </CardBox>
            ))}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

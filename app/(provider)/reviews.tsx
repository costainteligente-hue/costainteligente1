/**
 * ReviewsScreen — fiel al PWA
 * Promedio + cards con respuesta tintada + sheet de respuesta/reporte
 */
import React, { useState } from 'react';
import {
  ScrollView, View, Text, TouchableOpacity, Modal,
  TextInput, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '@/lib/constants';
import { CardBox } from '@/components/ui/CardBox';
import { HeaderCard } from '@/components/ui/HeaderCard';
import { StatusPill } from '@/components/ui/StatusPill';
import { EmptyState } from '@/components/ui/EmptyState';

interface Review {
  id: string; service: string; user: string; rating: number;
  comment: string; date: string; reply?: string; reported?: boolean;
  replyStatus: string;
}

const SEED: Review[] = [
  { id: 'rv1', service: 'Embarcación verificada', user: 'Carlos M.', rating: 5, comment: 'Muy buen servicio y puntualidad.', date: '10/07/2026', replyStatus: 'Sin responder' },
  { id: 'rv2', service: 'Restaurante verificado', user: 'Ana T.',    rating: 4, comment: 'Buena atención y menú claro.',   date: '08/07/2026', reply: 'Gracias por tu visita. Seguimos mejorando el servicio.', replyStatus: 'Respondida' },
];

function Stars({ rating }: { rating: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 2 }}>
      {[1,2,3,4,5].map((s) => (
        <MaterialIcons key={s} name={s <= rating ? 'star' : 'star-border'} size={14} color={COLORS.caution} />
      ))}
    </View>
  );
}

// ─── Reply sheet ──────────────────────────────────────────────────────────────
function ReplySheet({ review, onSave, onClose }: {
  review: Review; onSave: (t: string) => void; onClose: () => void;
}) {
  const [text, setText] = useState(review.reply ?? '');
  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
          <View style={{ width: 42, height: 4, borderRadius: 999, backgroundColor: 'rgba(15,23,42,0.2)', alignSelf: 'center', marginTop: 10, marginBottom: 12 }} />
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 12 }}>
            <Text style={{ fontSize: 20, fontWeight: '900', color: '#0F172A' }}>Responder reseña</Text>
            <TouchableOpacity onPress={onClose}><MaterialIcons name="close" size={24} color="#0F172A" /></TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
            <CardBox>
              <Text style={{ color: 'rgba(15,23,42,0.62)', fontSize: 12, fontWeight: '850', marginBottom: 6 }}>Reseña de {review.user}</Text>
              <Text style={{ color: '#0F172A', fontSize: 14, marginBottom: 14, lineHeight: 20 }}>{review.comment}</Text>
              <Text style={{ color: 'rgba(15,23,42,0.62)', fontSize: 12, fontWeight: '850', marginBottom: 8 }}>Respuesta pública *</Text>
              <TextInput value={text} onChangeText={setText} multiline numberOfLines={5}
                placeholder="Escribe tu respuesta pública..." placeholderTextColor="#94A3B8"
                style={{ backgroundColor: '#F8FAFC', borderRadius: 14, borderWidth: 1, borderColor: '#E2E8F0', padding: 14, fontSize: 14, color: '#0F172A', textAlignVertical: 'top', minHeight: 96 }} />
            </CardBox>
            <TouchableOpacity onPress={() => {
              if (!text.trim()) { Alert.alert('Escribe una respuesta antes de publicar.'); return; }
              onSave(text.trim()); onClose();
            }}
              style={{ backgroundColor: COLORS.ocean, borderRadius: 14, padding: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 44 }}>
              <MaterialIcons name="send" size={18} color="#fff" />
              <Text style={{ color: '#fff', fontWeight: '900' }}>Publicar respuesta</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export default function ReviewsScreen() {
  const [reviews, setReviews] = useState<Review[]>(SEED);
  const [replyTarget, setReplyTarget] = useState<Review | null>(null);

  const avg = reviews.reduce((s, r) => s + r.rating, 0) / (reviews.length || 1);

  const saveReply = (id: string, reply: string) =>
    setReviews((p) => p.map((r) => r.id === id ? { ...r, reply, replyStatus: 'Respondida' } : r));

  const report = (id: string) => {
    Alert.alert('Reportar reseña', '¿Reportar esta reseña a administración?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Reportar', style: 'destructive', onPress: () => {
        setReviews((p) => p.map((r) => r.id === id ? { ...r, reported: true } : r));
        Alert.alert('Reporte enviado a administración.');
      }},
    ]);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }} edges={['top']}>
      {replyTarget && (
        <ReplySheet review={replyTarget}
          onSave={(t) => saveReply(replyTarget.id, t)}
          onClose={() => setReplyTarget(null)} />
      )}
      <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 100 }}>
        <HeaderCard title="Reseñas" subtitle="Calificaciones, comentarios, respuesta pública y reportes." icon="star" color={COLORS.caution} />

        {/* Rating summary */}
        <CardBox>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            <View style={{ width: 52, height: 52, borderRadius: 999, backgroundColor: `${COLORS.caution}18`, alignItems: 'center', justifyContent: 'center' }}>
              <MaterialIcons name="star" size={28} color={COLORS.caution} />
            </View>
            <View>
              <Text style={{ fontSize: 28, fontWeight: '900', color: '#0F172A', letterSpacing: -0.5 }}>{avg.toFixed(1)}</Text>
              <Stars rating={Math.round(avg)} />
              <Text style={{ color: 'rgba(15,23,42,0.62)', fontSize: 12, marginTop: 2 }}>{reviews.length} reseñas registradas</Text>
            </View>
            <View style={{ flex: 1 }} />
            <StatusPill status="Verificado" />
          </View>
        </CardBox>

        {reviews.length === 0 ? (
          <EmptyState icon="star-border" title="Sin reseñas" message="Aún no hay calificaciones registradas." />
        ) : reviews.map((r) => (
          <CardBox key={r.id}>
            {/* Section header pattern: service + rating pill */}
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Text style={{ fontWeight: '900', color: '#0F172A', fontSize: 15 }}>{r.service}</Text>
                <Text style={{ color: 'rgba(15,23,42,0.62)', fontSize: 13, marginTop: 2 }}>{r.user} · {r.date}</Text>
              </View>
              <StatusPill status={`${r.rating.toFixed(1)}`} />
            </View>

            <Text style={{ color: '#0F172A', fontSize: 14, lineHeight: 20 }}>{r.comment}</Text>

            {/* Reply tinted card */}
            {r.reply && (
              <View style={{ backgroundColor: `${COLORS.ocean}08`, borderRadius: 14, padding: 12, marginTop: 12, borderWidth: 1, borderColor: `${COLORS.ocean}18` }}>
                <Text style={{ color: '#0F172A', fontSize: 13, lineHeight: 19 }}>
                  <Text style={{ fontWeight: '900' }}>Respuesta: </Text>{r.reply}
                </Text>
              </View>
            )}

            <View style={{ height: 1, backgroundColor: '#E2E8F0', marginVertical: 12 }} />

            {/* Inline actions */}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
              <StatusPill status={r.reported ? 'Reporte enviado' : r.replyStatus} />
              <View style={{ flex: 1 }} />
              <TouchableOpacity onPress={() => setReplyTarget(r)}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0' }}>
                <MaterialIcons name="reply" size={14} color="#64748B" />
                <Text style={{ color: '#64748B', fontWeight: '800', fontSize: 12 }}>{r.reply ? 'Editar respuesta' : 'Responder'}</Text>
              </TouchableOpacity>
              {!r.reported && (
                <TouchableOpacity onPress={() => report(r.id)}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0' }}>
                  <MaterialIcons name="flag" size={14} color={COLORS.danger} />
                  <Text style={{ color: COLORS.danger, fontWeight: '800', fontSize: 12 }}>Reportar</Text>
                </TouchableOpacity>
              )}
            </View>
          </CardBox>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

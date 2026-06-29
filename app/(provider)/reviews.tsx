/**
 * ReviewsScreen — Proveedor
 * Calificaciones, comentarios, respuestas y reportes
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
import { EmptyState } from '@/components/ui/EmptyState';
import { StatusPill } from '@/components/ui/StatusPill';

interface Review {
  id: string; service: string; user: string; rating: number;
  comment: string; date: string; reply?: string; reported?: boolean;
  replyStatus: string;
}

const SEED_REVIEWS: Review[] = [
  { id: 'r1', service: 'Pesca de altura', user: 'Carlos M.', rating: 5, comment: 'Excelente servicio, el capitán fue muy profesional y la salida fue increíble.', date: '10/07/2026', replyStatus: 'Sin respuesta' },
  { id: 'r2', service: 'Guía de pesca', user: 'Ana T.', rating: 4, comment: 'Muy buen guía, conoce muy bien la zona. Recomendado.', date: '08/07/2026', reply: '¡Gracias Ana! Fue un placer guiarte.', replyStatus: 'Respondida' },
  { id: 'r3', service: 'Restaurante de mariscos', user: 'Jorge L.', rating: 3, comment: 'La comida estuvo bien pero el servicio tardó mucho.', date: '05/07/2026', replyStatus: 'Sin respuesta' },
];

function StarRow({ rating }: { rating: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 2 }}>
      {[1,2,3,4,5].map((s) => (
        <MaterialIcons key={s} name={s <= rating ? 'star' : 'star-border'} size={14} color={COLORS.caution} />
      ))}
    </View>
  );
}

function ReplyModal({ review, onSave, onClose }: { review: Review; onSave: (reply: string) => void; onClose: () => void }) {
  const [text, setText] = useState(review.reply ?? '');
  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12 }}>
            <Text style={{ fontSize: 18, fontWeight: '800', color: '#0F172A' }}>Responder reseña</Text>
            <TouchableOpacity onPress={onClose}><MaterialIcons name="close" size={24} color="#0F172A" /></TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
            <CardBox>
              <Text style={{ fontWeight: '700', color: '#0F172A', fontSize: 13, marginBottom: 6 }}>Reseña de {review.user}</Text>
              <Text style={{ color: '#64748B', fontSize: 13, marginBottom: 12 }}>{review.comment}</Text>
              <Text style={{ fontWeight: '700', color: '#0F172A', fontSize: 13, marginBottom: 6 }}>Respuesta pública *</Text>
              <TextInput
                value={text} onChangeText={setText} multiline numberOfLines={5}
                placeholder="Escribe tu respuesta pública..."
                placeholderTextColor="#94A3B8"
                style={{ backgroundColor: '#F8FAFC', borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', padding: 12, fontSize: 14, color: '#0F172A', textAlignVertical: 'top', minHeight: 100 }}
              />
            </CardBox>
            <TouchableOpacity onPress={() => { if (!text.trim()) { Alert.alert('Escribe una respuesta antes de publicar.'); return; } onSave(text.trim()); onClose(); }}
              style={{ backgroundColor: COLORS.ocean, borderRadius: 14, padding: 14, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8, marginTop: 8 }}>
              <MaterialIcons name="send" size={18} color="#fff" />
              <Text style={{ color: '#fff', fontWeight: '800' }}>Publicar respuesta</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export default function ReviewsScreen() {
  const [reviews, setReviews] = useState<Review[]>(SEED_REVIEWS);
  const [replyTarget, setReplyTarget] = useState<Review | null>(null);

  const avg = reviews.reduce((s, r) => s + r.rating, 0) / (reviews.length || 1);

  const saveReply = (id: string, reply: string) => {
    setReviews((prev) => prev.map((r) => r.id === id ? { ...r, reply, replyStatus: 'Respondida' } : r));
  };
  const report = (id: string) => {
    setReviews((prev) => prev.map((r) => r.id === id ? { ...r, reported: true } : r));
    Alert.alert('Reporte enviado a administración.');
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }} edges={['top']}>
      {replyTarget && (
        <ReplyModal review={replyTarget} onSave={(reply) => saveReply(replyTarget.id, reply)} onClose={() => setReplyTarget(null)} />
      )}
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        <HeaderCard title="Reseñas" subtitle="Calificaciones, comentarios, respuesta pública y reportes." icon="star" color={COLORS.caution} />

        {/* Promedio */}
        <CardBox>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            <View style={{ width: 52, height: 52, borderRadius: 99, backgroundColor: `${COLORS.caution}18`, alignItems: 'center', justifyContent: 'center' }}>
              <MaterialIcons name="star" size={28} color={COLORS.caution} />
            </View>
            <View>
              <Text style={{ fontSize: 28, fontWeight: '900', color: '#0F172A', letterSpacing: -0.5 }}>{avg.toFixed(1)}</Text>
              <StarRow rating={Math.round(avg)} />
              <Text style={{ color: '#64748B', fontSize: 12, marginTop: 2 }}>{reviews.length} reseñas registradas</Text>
            </View>
            <View style={{ flex: 1 }} />
            <StatusPill status="Verificado" />
          </View>
        </CardBox>

        {reviews.length === 0 ? (
          <EmptyState icon="star-border" title="Sin reseñas" message="Aún no hay calificaciones registradas." buttonLabel="" onPress={() => {}} />
        ) : (
          reviews.map((review) => (
            <CardBox key={review.id}>
              {/* Header */}
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
                <View>
                  <Text style={{ fontWeight: '800', color: '#0F172A', fontSize: 14 }}>{review.service}</Text>
                  <Text style={{ color: '#64748B', fontSize: 12 }}>{review.user} · {review.date}</Text>
                </View>
                <StarRow rating={review.rating} />
              </View>
              <Text style={{ color: '#374151', fontSize: 13, lineHeight: 19 }}>{review.comment}</Text>

              {/* Respuesta */}
              {review.reply && (
                <View style={{ backgroundColor: `${COLORS.ocean}08`, borderRadius: 10, padding: 10, marginTop: 10, borderWidth: 1, borderColor: `${COLORS.ocean}15` }}>
                  <Text style={{ color: '#64748B', fontSize: 12 }}>
                    <Text style={{ fontWeight: '800', color: '#0F172A' }}>Respuesta: </Text>{review.reply}
                  </Text>
                </View>
              )}

              <View style={{ height: 1, backgroundColor: '#E2E8F0', marginVertical: 10 }} />
              <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                <StatusPill status={review.reported ? 'Reporte enviado' : review.replyStatus} />
                <View style={{ flex: 1 }} />
                <TouchableOpacity onPress={() => setReplyTarget(review)}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 10, borderWidth: 1, borderColor: '#E2E8F0' }}>
                  <MaterialIcons name="reply" size={14} color="#64748B" />
                  <Text style={{ color: '#64748B', fontWeight: '700', fontSize: 12 }}>{review.reply ? 'Editar' : 'Responder'}</Text>
                </TouchableOpacity>
                {!review.reported && (
                  <TouchableOpacity onPress={() => report(review.id)}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 10, borderWidth: 1, borderColor: '#E2E8F0' }}>
                    <MaterialIcons name="flag" size={14} color={COLORS.danger} />
                    <Text style={{ color: COLORS.danger, fontWeight: '700', fontSize: 12 }}>Reportar</Text>
                  </TouchableOpacity>
                )}
              </View>
            </CardBox>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

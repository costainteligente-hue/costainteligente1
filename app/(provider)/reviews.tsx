import React, { useState } from 'react';
import {
  ScrollView, View, Text, TouchableOpacity, Modal,
  TextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Review } from '@/types';
import { COLORS } from '@/lib/constants';
import { CardBox } from '@/components/ui/CardBox';
import { HeaderCard } from '@/components/ui/HeaderCard';
import { StatusPill } from '@/components/ui/StatusPill';

const REVIEWS: Review[] = [
  { id: 'rv1', serviceName: 'Embarcación verificada', comment: 'Excelente servicio y muy puntual. El equipo estaba en perfectas condiciones.', rating: 5, clientName: 'Carlos M.', date: '12/07/2026', replyStatus: 'pending' },
  { id: 'rv2', serviceName: 'Restaurante verificado', comment: 'Buena atención y menú variado. El pescado zarandeado estuvo delicioso.', rating: 4.5, clientName: 'Ana T.', date: '10/07/2026', replyStatus: 'replied' },
  { id: 'rv3', serviceName: 'Guía verificado', comment: 'El guía conoce muy bien las zonas. Aprendí mucho sobre técnicas de pesca.', rating: 5, clientName: 'Jorge R.', date: '08/07/2026', replyStatus: 'pending' },
  { id: 'rv4', serviceName: 'Transporte verificado', comment: 'Traslado puntual y cómodo. El conductor fue amable.', rating: 3.5, clientName: 'María L.', date: '05/07/2026', replyStatus: 'replied' },
];

function StarRow({ rating }: { rating: number }) {
  return (
    <View className="flex-row gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <MaterialIcons
          key={i}
          name={i <= rating ? 'star' : i - 0.5 <= rating ? 'star-half' : 'star-border'}
          size={16}
          color={COLORS.caution}
        />
      ))}
    </View>
  );
}

function ReplyModal({
  review,
  onClose,
}: {
  review: Review;
  onClose: () => void;
}) {
  const [reply, setReply] = useState('');
  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
          <View className="flex-row items-center justify-between px-4 pt-4 pb-2">
            <Text style={{ fontSize: 18, fontWeight: '800', color: '#0F172A' }}>Responder reseña</Text>
            <TouchableOpacity onPress={onClose}>
              <MaterialIcons name="close" size={24} color="#0F172A" />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
            <CardBox>
              <View className="flex-row justify-between items-start mb-2">
                <Text style={{ fontWeight: '800', color: '#0F172A' }}>{review.clientName}</Text>
                <StarRow rating={review.rating} />
              </View>
              <Text style={{ color: '#0F172A99', lineHeight: 20 }}>{review.comment}</Text>
            </CardBox>
            <CardBox>
              <Text style={{ fontWeight: '700', color: '#0F172A', marginBottom: 8 }}>
                Tu respuesta pública
              </Text>
              <TextInput
                value={reply}
                onChangeText={setReply}
                multiline
                numberOfLines={5}
                placeholder="Escribe una respuesta visible para todos los usuarios..."
                placeholderTextColor="#94A3B8"
                style={{
                  backgroundColor: '#F8FAFC',
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: '#E2E8F0',
                  padding: 12,
                  fontSize: 14,
                  color: '#0F172A',
                  textAlignVertical: 'top',
                  minHeight: 110,
                }}
              />
            </CardBox>
            <TouchableOpacity
              onPress={onClose}
              style={{
                backgroundColor: COLORS.ocean,
                borderRadius: 14,
                padding: 14,
                alignItems: 'center',
                flexDirection: 'row',
                justifyContent: 'center',
                gap: 8,
              }}
            >
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
  const [replyTarget, setReplyTarget] = useState<Review | null>(null);

  const avg = REVIEWS.reduce((s, r) => s + r.rating, 0) / REVIEWS.length;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }} edges={['top']}>
      {replyTarget && (
        <ReplyModal review={replyTarget} onClose={() => setReplyTarget(null)} />
      )}
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
        <HeaderCard
          title="Reseñas"
          subtitle="Calificaciones y comentarios de tus clientes."
          icon="star-border"
          color={COLORS.caution}
        />

        {/* Average */}
        <CardBox>
          <View className="flex-row items-center gap-4">
            <MaterialIcons name="star" size={48} color={COLORS.caution} />
            <View>
              <Text style={{ fontSize: 32, fontWeight: '800', color: '#0F172A' }}>
                {avg.toFixed(1)}
              </Text>
              <Text style={{ color: '#0F172A99', fontSize: 13 }}>
                Promedio · {REVIEWS.length} reseñas
              </Text>
            </View>
            <View style={{ marginLeft: 'auto' }}>
              <StatusPill status="Verificado" />
            </View>
          </View>
        </CardBox>

        {/* Review list */}
        {REVIEWS.map((review) => (
          <CardBox key={review.id}>
            <View className="flex-row justify-between items-start mb-2">
              <Text style={{ fontWeight: '800', color: '#0F172A', flex: 1 }}>
                {review.serviceName}
              </Text>
              <Text style={{ fontWeight: '700', color: COLORS.caution, fontSize: 15 }}>
                {review.rating}
              </Text>
            </View>
            <StarRow rating={review.rating} />
            <View style={{ height: 8 }} />
            <Text style={{ color: '#0F172A99', lineHeight: 20 }}>{review.comment}</Text>
            <Text style={{ color: '#94A3B8', fontSize: 12, marginTop: 4 }}>
              {review.clientName} · {review.date}
            </Text>
            <View style={{ height: 1, backgroundColor: '#E2E8F0', marginVertical: 12 }} />
            <View className="flex-row flex-wrap gap-2 items-center">
              <StatusPill status={review.replyStatus === 'replied' ? 'Respondida' : 'Sin responder'} />
              <View style={{ flex: 1 }} />
              <TouchableOpacity
                onPress={() => setReplyTarget(review)}
                className="flex-row items-center gap-1.5 px-3 py-2 rounded-xl border border-line"
              >
                <MaterialIcons name="reply" size={16} color="#0F172A" />
                <Text style={{ fontWeight: '800', fontSize: 13 }}>Responder</Text>
              </TouchableOpacity>
              <TouchableOpacity className="flex-row items-center gap-1.5 px-3 py-2 rounded-xl border border-line">
                <MaterialIcons name="report-gmailerrorred" size={16} color={COLORS.danger} />
                <Text style={{ color: COLORS.danger, fontWeight: '800', fontSize: 13 }}>Reportar</Text>
              </TouchableOpacity>
            </View>
          </CardBox>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

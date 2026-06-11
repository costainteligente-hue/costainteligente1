import React, { useState, useRef } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, TextInput,
  KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { COLORS } from '@/lib/constants';
import { CardBox } from '@/components/ui/CardBox';
import { HeaderCard } from '@/components/ui/HeaderCard';
import { StatusPill } from '@/components/ui/StatusPill';

// ─── Seed conversation list ───────────────────────────────────────────────────
interface ConversationPreview {
  reservationId: string;
  clientName: string;
  serviceName: string;
  lastMessage: string;
  lastTime: string;
  unread: number;
  status: 'confirmed' | 'completed' | 'rejected';
}

const SEED_CONVERSATIONS: ConversationPreview[] = [
  {
    reservationId: 'r1',
    clientName: 'Carlos Mendoza',
    serviceName: 'Embarcación verificada',
    lastMessage: '¿A qué hora es el punto de salida?',
    lastTime: '14:24',
    unread: 2,
    status: 'confirmed',
  },
  {
    reservationId: 'r2',
    clientName: 'Ana Torres',
    serviceName: 'Restaurante verificado',
    lastMessage: 'Perfecto, nos vemos el viernes.',
    lastTime: '11:02',
    unread: 0,
    status: 'confirmed',
  },
  {
    reservationId: 'r3',
    clientName: 'Jorge Reyes',
    serviceName: 'Guía verificado',
    lastMessage: 'Gracias por el servicio, excelente experiencia.',
    lastTime: '09/07',
    unread: 0,
    status: 'completed',
  },
];

const STATUS_LABELS: Record<string, string> = {
  confirmed: 'Activa',
  completed: 'Completada',
  rejected: 'Cerrada',
};

// ─── Conversation row ─────────────────────────────────────────────────────────
function ConversationRow({
  item,
  onPress,
}: {
  item: ConversationPreview;
  onPress: () => void;
}) {
  const isReadOnly = item.status !== 'confirmed';
  return (
    <TouchableOpacity onPress={onPress}>
      <CardBox>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          {/* Avatar */}
          <View
            style={{
              width: 48,
              height: 48,
              borderRadius: 99,
              backgroundColor: `${COLORS.ocean}20`,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <MaterialIcons name="person" size={26} color={COLORS.ocean} />
          </View>

          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 }}>
              <Text style={{ fontWeight: '800', color: '#0F172A', fontSize: 15, flex: 1 }}>
                {item.clientName}
              </Text>
              <Text style={{ color: '#94A3B8', fontSize: 12 }}>{item.lastTime}</Text>
            </View>
            <Text style={{ color: '#0F172A99', fontSize: 12, marginBottom: 4 }} numberOfLines={1}>
              {item.serviceName}
            </Text>
            <Text style={{ color: '#64748B', fontSize: 13 }} numberOfLines={1}>
              {item.lastMessage}
            </Text>
          </View>

          <View style={{ alignItems: 'flex-end', gap: 4 }}>
            <StatusPill status={STATUS_LABELS[item.status]} />
            {item.unread > 0 && (
              <View
                style={{
                  backgroundColor: COLORS.ocean,
                  borderRadius: 99,
                  minWidth: 20,
                  height: 20,
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingHorizontal: 6,
                }}
              >
                <Text style={{ color: '#fff', fontSize: 11, fontWeight: '800' }}>
                  {item.unread}
                </Text>
              </View>
            )}
          </View>
        </View>
      </CardBox>
    </TouchableOpacity>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function GeneralChatScreen() {
  const router = useRouter();

  const activeConvs = SEED_CONVERSATIONS.filter((c) => c.status === 'confirmed');
  const closedConvs = SEED_CONVERSATIONS.filter((c) => c.status !== 'confirmed');

  const goToChat = (reservationId: string) => {
    router.push(`/(provider)/chat/${reservationId}` as any);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
        <HeaderCard
          title="Mensajes"
          subtitle="Conversaciones con clientes de reservaciones confirmadas."
          icon="chat-bubble-outline"
          color={COLORS.ocean}
        />

        {/* Active conversations */}
        {activeConvs.length > 0 && (
          <>
            <Text style={{ fontWeight: '800', color: '#0F172A', fontSize: 15, marginBottom: 10 }}>
              Conversaciones activas
            </Text>
            {activeConvs.map((c) => (
              <ConversationRow key={c.reservationId} item={c} onPress={() => goToChat(c.reservationId)} />
            ))}
          </>
        )}

        {/* Closed conversations */}
        {closedConvs.length > 0 && (
          <>
            <Text
              style={{
                fontWeight: '800',
                color: '#0F172A',
                fontSize: 15,
                marginBottom: 10,
                marginTop: activeConvs.length > 0 ? 8 : 0,
              }}
            >
              Cerradas
            </Text>
            {closedConvs.map((c) => (
              <ConversationRow key={c.reservationId} item={c} onPress={() => goToChat(c.reservationId)} />
            ))}
          </>
        )}

        {SEED_CONVERSATIONS.length === 0 && (
          <View
            style={{
              alignItems: 'center',
              padding: 40,
              backgroundColor: '#fff',
              borderRadius: 18,
              borderWidth: 1,
              borderColor: '#E2E8F0',
            }}
          >
            <MaterialIcons name="chat-bubble-outline" size={48} color="#94A3B8" />
            <Text style={{ fontWeight: '800', color: '#0F172A', marginTop: 12, fontSize: 16 }}>
              Sin conversaciones
            </Text>
            <Text style={{ color: '#94A3B8', marginTop: 6, textAlign: 'center' }}>
              Los chats se habilitan automáticamente cuando confirmas una reservación.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

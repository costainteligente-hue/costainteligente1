/**
 * Lista de conversaciones del proveedor — datos reales con polling
 */
import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { COLORS } from '@/lib/constants';
import { CardBox } from '@/components/ui/CardBox';
import { HeaderCard } from '@/components/ui/HeaderCard';
import { StatusPill } from '@/components/ui/StatusPill';
import { EmptyState } from '@/components/ui/EmptyState';
import { useAuthStore } from '@/stores/authStore';

const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? '';

interface Conversation {
  reservationId: string;
  clientName: string;
  serviceName: string;
  lastMessage: string;
  lastTime: string;
  unread: number;
  status: string;
}

async function fetchConversations(providerId: string): Promise<Conversation[]> {
  if (typeof window !== 'undefined') {
    const res = await fetch(`${API_BASE}/api/provider/conversations?providerId=${providerId}`);
    if (!res.ok) return [];
    return res.json();
  }
  // Nativo: consulta directa a DB
  try {
    const { getDb }    = await import('@/lib/db/client');
    const { reservations, providerServices, profiles, messages } = await import('@/lib/db/schema');
    const { eq, desc, and } = await import('drizzle-orm');
    const db = getDb();

    const rows = await db
      .select({
        id:            reservations.id,
        status:        reservations.status,
        serviceName:   providerServices.name,
        clientName:    profiles.fullName,
      })
      .from(reservations)
      .innerJoin(providerServices, eq(reservations.serviceId, providerServices.id))
      .innerJoin(profiles, eq(reservations.clientId, profiles.id))
      .where(and(eq(reservations.providerId, providerId)))
      .orderBy(desc(reservations.createdAt))
      .limit(30);

    return rows.map((r: any) => ({
      reservationId: r.id,
      clientName:    r.clientName ?? 'Cliente',
      serviceName:   r.serviceName ?? 'Servicio',
      lastMessage:   'Toca para ver los mensajes',
      lastTime:      '',
      unread:        0,
      status:        r.status,
    }));
  } catch { return []; }
}

const STATUS_LABELS: Record<string, string> = {
  pending:     'Solicitud',
  confirmed:   'Confirmada',
  rejected:    'Rechazada',
  rescheduled: 'Reprogramada',
  completed:   'Completada',
  cancelled:   'Cancelada',
};

function ConversationRow({ item, onPress }: { item: Conversation; onPress: () => void }) {
  const isActive = item.status === 'confirmed' || item.status === 'pending';
  return (
    <TouchableOpacity onPress={onPress}>
      <CardBox>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={{ width: 48, height: 48, borderRadius: 99, backgroundColor: `${COLORS.ocean}20`, alignItems: 'center', justifyContent: 'center' }}>
            <MaterialIcons name="person" size={26} color={COLORS.ocean} />
          </View>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 }}>
              <Text style={{ fontWeight: '800', color: '#0F172A', fontSize: 15, flex: 1 }}>{item.clientName}</Text>
              {item.lastTime ? <Text style={{ color: '#94A3B8', fontSize: 12 }}>{item.lastTime}</Text> : null}
            </View>
            <Text style={{ color: '#64748B', fontSize: 12, marginBottom: 3 }} numberOfLines={1}>{item.serviceName}</Text>
            <Text style={{ color: '#94A3B8', fontSize: 13 }} numberOfLines={1}>{item.lastMessage}</Text>
          </View>
          <View style={{ alignItems: 'flex-end', gap: 6 }}>
            <StatusPill status={STATUS_LABELS[item.status] ?? item.status} />
            {item.unread > 0 && (
              <View style={{ backgroundColor: COLORS.ocean, borderRadius: 99, minWidth: 20, height: 20, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 }}>
                <Text style={{ color: '#fff', fontSize: 11, fontWeight: '800' }}>{item.unread}</Text>
              </View>
            )}
          </View>
        </View>
      </CardBox>
    </TouchableOpacity>
  );
}

export default function GeneralChatScreen() {
  const router   = useRouter();
  const { user } = useAuthStore();

  // Polling cada 10s para ver nuevas conversaciones
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['provider_conversations', user?.id],
    queryFn:  () => fetchConversations(user?.id ?? ''),
    enabled:  !!user?.id,
    staleTime: 0,
    refetchInterval: 10_000,
  });

  const conversations = data ?? [];
  const active  = conversations.filter((c) => ['confirmed', 'pending'].includes(c.status));
  const history = conversations.filter((c) => !['confirmed', 'pending'].includes(c.status));

  const goToChat = (id: string) => router.push(`/(provider)/chat/${id}` as any);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
        <HeaderCard
          title="Mensajes"
          subtitle="Conversaciones con clientes de tus reservaciones."
          icon="chat-bubble-outline"
          color={COLORS.ocean}
        />

        {isLoading && conversations.length === 0 ? (
          <View style={{ alignItems: 'center', paddingVertical: 40 }}>
            <ActivityIndicator color={COLORS.ocean} />
            <Text style={{ color: '#64748B', marginTop: 12 }}>Cargando conversaciones...</Text>
          </View>
        ) : conversations.length === 0 ? (
          <EmptyState
            icon="chat-bubble-outline"
            title="Sin conversaciones"
            message="Los chats se habilitan automáticamente cuando tienes reservaciones activas."
            buttonLabel="Actualizar"
            onPress={() => refetch()}
          />
        ) : (
          <>
            {active.length > 0 && (
              <>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                  <View style={{ width: 8, height: 8, borderRadius: 99, backgroundColor: COLORS.success }} />
                  <Text style={{ fontWeight: '800', color: '#0F172A', fontSize: 15 }}>Activas</Text>
                </View>
                {active.map((c) => <ConversationRow key={c.reservationId} item={c} onPress={() => goToChat(c.reservationId)} />)}
              </>
            )}

            {history.length > 0 && (
              <>
                <Text style={{ fontWeight: '800', color: '#0F172A', fontSize: 15, marginBottom: 10, marginTop: active.length > 0 ? 12 : 0 }}>Historial</Text>
                {history.map((c) => <ConversationRow key={c.reservationId} item={c} onPress={() => goToChat(c.reservationId)} />)}
              </>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

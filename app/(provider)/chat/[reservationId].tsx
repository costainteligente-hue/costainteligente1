/**
 * Chat del proveedor por reservación — con polling real cada 4s
 */
import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, FlatList, TextInput,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';
import { useMessages, useSendMessage } from '@/hooks/useMessages';
import { COLORS } from '@/lib/constants';

interface MessageItem {
  id: string;
  content: string;
  sender_id: string;
  sent_at: string;
  isMine: boolean;
  senderName?: string | null;
  failed?: boolean;
}

function MessageBubble({ message, onRetry }: { message: MessageItem; onRetry?: () => void }) {
  const time = (() => {
    try { return new Date(message.sent_at).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }); }
    catch { return message.sent_at; }
  })();

  return (
    <View style={{ alignSelf: message.isMine ? 'flex-end' : 'flex-start', maxWidth: '78%', marginBottom: 10 }}>
      {!message.isMine && message.senderName && (
        <Text style={{ color: '#94A3B8', fontSize: 11, marginBottom: 3, marginLeft: 4 }}>{message.senderName}</Text>
      )}
      <View style={{
        backgroundColor: message.failed ? '#FEE2E2' : message.isMine ? COLORS.ocean : '#fff',
        borderRadius: 18,
        borderBottomRightRadius: message.isMine ? 4 : 18,
        borderBottomLeftRadius: message.isMine ? 18 : 4,
        paddingHorizontal: 14, paddingVertical: 10,
        borderWidth: 1,
        borderColor: message.failed ? COLORS.danger : message.isMine ? COLORS.ocean : '#E2E8F0',
      }}>
        <Text style={{ color: message.failed ? COLORS.danger : message.isMine ? '#fff' : '#0F172A', fontSize: 14, lineHeight: 20 }}>
          {message.content}
        </Text>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3, alignSelf: message.isMine ? 'flex-end' : 'flex-start' }}>
        {message.failed && <MaterialIcons name="error-outline" size={13} color={COLORS.danger} />}
        <Text style={{ color: '#94A3B8', fontSize: 11 }}>{time}</Text>
        {message.failed && onRetry && (
          <TouchableOpacity onPress={onRetry}>
            <Text style={{ color: COLORS.ocean, fontWeight: '800', fontSize: 11, marginLeft: 4 }}>Reintentar</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

export default function ProviderChatScreen() {
  const { reservationId } = useLocalSearchParams<{ reservationId: string }>();
  const router = useRouter();
  const { user } = useAuthStore();
  const flatListRef = useRef<FlatList>(null);
  const [input, setInput]           = useState('');
  const [inputError, setInputError] = useState('');
  const [failedMessages, setFailedMessages] = useState<MessageItem[]>([]);

  // Polling automático cada 4 segundos via useMessages
  const { data: messages, isLoading } = useMessages(reservationId ?? '');
  const sendMutation = useSendMessage();

  const allMessages: MessageItem[] = [
    ...(messages ?? []).map((m: any) => ({
      id: m.id, content: m.content, sender_id: m.sender_id,
      sent_at: m.sent_at, isMine: m.sender_id === user?.id,
      senderName: m.profiles?.full_name ?? null,
    })),
    ...failedMessages,
  ].sort((a, b) => new Date(a.sent_at).getTime() - new Date(b.sent_at).getTime());

  // Auto-scroll al fondo cuando llegan mensajes nuevos
  useEffect(() => {
    if (allMessages.length > 0) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [allMessages.length]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text) { setInputError('El mensaje no puede estar vacío.'); return; }
    if (text.length > 500) { setInputError('Máximo 500 caracteres.'); return; }
    if (!user?.id || !reservationId) return;
    setInputError('');
    setInput('');
    try {
      await sendMutation.mutateAsync({ reservationId, senderId: user.id, content: text });
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    } catch {
      const failed: MessageItem = {
        id: `failed_${Date.now()}`, content: text, sender_id: user.id,
        sent_at: new Date().toISOString(), isMine: true, failed: true,
      };
      setFailedMessages((prev) => [...prev, failed]);
    }
  };

  const retryMessage = async (msg: MessageItem) => {
    if (!user?.id || !reservationId) return;
    setFailedMessages((prev) => prev.filter((m) => m.id !== msg.id));
    try {
      await sendMutation.mutateAsync({ reservationId, senderId: user.id, content: msg.content });
    } catch {
      setFailedMessages((prev) => [...prev, msg]);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' }}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={24} color="#0F172A" />
        </TouchableOpacity>
        <View style={{ width: 40, height: 40, borderRadius: 99, backgroundColor: `${COLORS.ocean}20`, alignItems: 'center', justifyContent: 'center' }}>
          <MaterialIcons name="person" size={22} color={COLORS.ocean} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontWeight: '800', color: '#0F172A', fontSize: 15 }}>Cliente</Text>
          <Text style={{ color: '#64748B', fontSize: 12 }}>Reservación #{(reservationId ?? '').slice(0, 8)}</Text>
        </View>
        {/* Indicador de polling activo */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <View style={{ width: 8, height: 8, borderRadius: 99, backgroundColor: COLORS.success }} />
          <Text style={{ color: '#64748B', fontSize: 11 }}>En vivo</Text>
        </View>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        {isLoading && allMessages.length === 0 ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator color={COLORS.ocean} />
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={allMessages}
            keyExtractor={(m) => m.id}
            renderItem={({ item }) => (
              <MessageBubble message={item} onRetry={item.failed ? () => retryMessage(item) : undefined} />
            )}
            contentContainerStyle={{ padding: 16, paddingBottom: 8 }}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
            ListEmptyComponent={
              <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                <MaterialIcons name="chat-bubble-outline" size={40} color="#94A3B8" />
                <Text style={{ color: '#94A3B8', fontWeight: '700', marginTop: 10 }}>
                  Sin mensajes aún. Inicia la conversación.
                </Text>
              </View>
            }
          />
        )}

        {/* Input */}
        <View style={{ backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#E2E8F0', padding: 12, gap: 6 }}>
          {inputError ? <Text style={{ color: COLORS.danger, fontSize: 12, paddingHorizontal: 4 }}>{inputError}</Text> : null}
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8 }}>
            <TextInput
              value={input}
              onChangeText={(v) => { setInput(v); setInputError(''); }}
              placeholder="Escribe un mensaje..."
              placeholderTextColor="#94A3B8"
              multiline
              style={{ flex: 1, backgroundColor: '#F8FAFC', borderRadius: 14, borderWidth: 1, borderColor: inputError ? COLORS.danger : '#E2E8F0', paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: '#0F172A', maxHeight: 120, textAlignVertical: 'top' }}
            />
            <TouchableOpacity
              onPress={handleSend}
              disabled={sendMutation.isPending}
              style={{ width: 44, height: 44, borderRadius: 99, backgroundColor: sendMutation.isPending ? '#94A3B8' : COLORS.ocean, alignItems: 'center', justifyContent: 'center' }}
            >
              {sendMutation.isPending
                ? <ActivityIndicator size="small" color="#fff" />
                : <MaterialIcons name="send" size={20} color="#fff" />
              }
            </TouchableOpacity>
          </View>
          <Text style={{ color: '#94A3B8', fontSize: 11, textAlign: 'right' }}>{input.length}/500</Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

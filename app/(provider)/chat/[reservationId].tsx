import React, { useState, useRef } from 'react';
import {
  View, Text, TouchableOpacity, FlatList, TextInput,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChatMessage } from '@/types';
import { COLORS } from '@/lib/constants';

const SEED_MESSAGES: ChatMessage[] = [
  { id: '1', text: 'Buenas tardes, me interesa confirmar los detalles del servicio.', mine: false, sentAt: '14:22' },
  { id: '2', text: 'Claro, con gusto. ¿A qué hora sería el punto de salida?', mine: true, sentAt: '14:23' },
  { id: '3', text: '¿El punto de salida es el muelle principal de Zihuatanejo?', mine: false, sentAt: '14:24' },
  { id: '4', text: 'Sí, nos reunimos en el muelle principal a las 7:45 AM. Lleguen 15 minutos antes.', mine: true, sentAt: '14:25' },
];

function MessageBubble({ message }: { message: ChatMessage }) {
  return (
    <View
      style={{
        alignSelf: message.mine ? 'flex-end' : 'flex-start',
        maxWidth: '78%',
        marginBottom: 10,
      }}
    >
      <View
        style={{
          backgroundColor: message.mine ? COLORS.ocean : '#fff',
          borderRadius: 18,
          borderBottomRightRadius: message.mine ? 4 : 18,
          borderBottomLeftRadius: message.mine ? 18 : 4,
          paddingHorizontal: 14,
          paddingVertical: 10,
          borderWidth: 1,
          borderColor: message.mine ? COLORS.ocean : '#E2E8F0',
        }}
      >
        <Text
          style={{
            color: message.mine ? '#fff' : '#0F172A',
            fontSize: 14,
            lineHeight: 20,
          }}
        >
          {message.text}
        </Text>
      </View>
      <Text
        style={{
          color: '#94A3B8',
          fontSize: 11,
          marginTop: 3,
          alignSelf: message.mine ? 'flex-end' : 'flex-start',
        }}
      >
        {message.sentAt}
      </Text>
    </View>
  );
}

export default function ChatScreen() {
  const { reservationId } = useLocalSearchParams<{ reservationId: string }>();
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessage[]>(SEED_MESSAGES);
  const [input, setInput] = useState('');
  const [inputError, setInputError] = useState('');
  const flatListRef = useRef<FlatList>(null);

  const isReadOnly = reservationId === 'closed';

  const handleSend = () => {
    const text = input.trim();
    if (!text) { setInputError('El mensaje no puede estar vacío.'); return; }
    if (text.length > 500) { setInputError('El mensaje no puede superar los 500 caracteres.'); return; }
    setInputError('');
    const newMsg: ChatMessage = {
      id: Date.now().toString(),
      text,
      mine: true,
      sentAt: new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages((prev) => [...prev, newMsg]);
    setInput('');
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }} edges={['top', 'bottom']}>
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          paddingHorizontal: 16,
          paddingVertical: 12,
          backgroundColor: '#fff',
          borderBottomWidth: 1,
          borderBottomColor: '#E2E8F0',
        }}
      >
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={24} color="#0F172A" />
        </TouchableOpacity>
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 99,
            backgroundColor: `${COLORS.ocean}20`,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <MaterialIcons name="person" size={22} color={COLORS.ocean} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontWeight: '800', color: '#0F172A', fontSize: 15 }}>
            Cliente
          </Text>
          <Text style={{ color: '#64748B', fontSize: 12 }}>
            Reservación #{reservationId?.slice(0, 8)}
          </Text>
        </View>
        {isReadOnly && (
          <View
            style={{
              backgroundColor: '#F1F5F9',
              borderRadius: 8,
              paddingHorizontal: 8,
              paddingVertical: 4,
            }}
          >
            <Text style={{ color: '#64748B', fontSize: 11, fontWeight: '700' }}>Solo lectura</Text>
          </View>
        )}
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
        keyboardVerticalOffset={0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(m) => m.id}
          renderItem={({ item }) => <MessageBubble message={item} />}
          contentContainerStyle={{ padding: 16, paddingBottom: 8 }}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
        />

        {isReadOnly ? (
          <View
            style={{
              backgroundColor: '#F1F5F9',
              borderTopWidth: 1,
              borderTopColor: '#E2E8F0',
              padding: 16,
              alignItems: 'center',
            }}
          >
            <Text style={{ color: '#64748B', fontWeight: '700' }}>
              Esta conversación está cerrada.
            </Text>
          </View>
        ) : (
          <View
            style={{
              backgroundColor: '#fff',
              borderTopWidth: 1,
              borderTopColor: '#E2E8F0',
              padding: 12,
              gap: 6,
            }}
          >
            {inputError ? (
              <Text style={{ color: COLORS.danger, fontSize: 12, paddingHorizontal: 4 }}>
                {inputError}
              </Text>
            ) : null}
            <View className="flex-row items-end gap-2">
              <TextInput
                value={input}
                onChangeText={(v) => { setInput(v); setInputError(''); }}
                placeholder="Escribe un mensaje..."
                placeholderTextColor="#94A3B8"
                multiline
                style={{
                  flex: 1,
                  backgroundColor: '#F8FAFC',
                  borderRadius: 14,
                  borderWidth: 1,
                  borderColor: inputError ? COLORS.danger : '#E2E8F0',
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                  fontSize: 14,
                  color: '#0F172A',
                  maxHeight: 120,
                  textAlignVertical: 'top',
                }}
              />
              <TouchableOpacity
                onPress={handleSend}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 99,
                  backgroundColor: COLORS.ocean,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <MaterialIcons name="send" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
            <Text style={{ color: '#94A3B8', fontSize: 11, textAlign: 'right' }}>
              {input.length}/500
            </Text>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

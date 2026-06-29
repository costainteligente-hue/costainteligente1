import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS } from '@/lib/constants';

interface Props {
  icon: keyof typeof MaterialIcons.glyphMap;
  title: string;
  message: string;
  buttonLabel?: string;
  onPress?: () => void;
  color?: string;
}

/** Equivalent to emptyState() / .empty-state in PWA */
export function EmptyState({ icon, title, message, buttonLabel, onPress, color = COLORS.ocean }: Props) {
  return (
    <View
      style={{
        backgroundColor: '#fff',
        borderRadius: 18,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        padding: 16,
        marginBottom: 12,
        alignItems: 'center',
        paddingVertical: 28,
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.07,
        shadowRadius: 24,
        elevation: 2,
      }}
    >
      <View style={{ width: 56, height: 56, borderRadius: 16, backgroundColor: `${color}20`, alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
        <MaterialIcons name={icon} size={28} color={color} />
      </View>
      <Text style={{ color: '#0F172A', fontSize: 16, fontWeight: '900', marginBottom: 6, textAlign: 'center' }}>{title}</Text>
      <Text style={{ color: 'rgba(15,23,42,0.62)', textAlign: 'center', maxWidth: 280, lineHeight: 20, fontSize: 14 }}>{message}</Text>
      {buttonLabel && onPress ? (
        <TouchableOpacity
          onPress={onPress}
          style={{
            marginTop: 16,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            paddingHorizontal: 16,
            paddingVertical: 11,
            minHeight: 44,
            borderRadius: 14,
            backgroundColor: color,
          }}
        >
          <MaterialIcons name="add" size={18} color="#fff" />
          <Text style={{ color: '#fff', fontWeight: '900' }}>{buttonLabel}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

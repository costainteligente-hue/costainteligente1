import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS } from '@/lib/constants';

interface Props {
  title: string;
  subtitle: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  color?: string;
  onPress: () => void;
}

/** Equivalent to .operation-card / .management-card in PWA */
export function OperationCard({ title, subtitle, icon, color = COLORS.ocean, onPress }: Props) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={{
        flex: 1,
        backgroundColor: '#fff',
        borderRadius: 18,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        padding: 16,
        minHeight: 128,
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: 12,
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.07,
        shadowRadius: 24,
        elevation: 3,
      }}
    >
      <View style={{ width: 40, height: 40, borderRadius: 999, backgroundColor: `${color}20`, alignItems: 'center', justifyContent: 'center' }}>
        <MaterialIcons name={icon} size={20} color={color} />
      </View>
      <View>
        <Text style={{ color: '#0F172A', fontSize: 15, fontWeight: '900', lineHeight: 18, marginBottom: 3 }}>{title}</Text>
        <Text style={{ color: 'rgba(15,23,42,0.62)', fontSize: 12, lineHeight: 16 }}>{subtitle}</Text>
      </View>
    </TouchableOpacity>
  );
}

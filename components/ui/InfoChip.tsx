import React from 'react';
import { View, Text } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS } from '@/lib/constants';

interface Props {
  icon: keyof typeof MaterialIcons.glyphMap;
  text: string;
  color?: string;
}

/** Equivalent to .chip / infoChip() in PWA */
export function InfoChip({ icon, text, color = COLORS.ocean }: Props) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 7,
        paddingHorizontal: 10,
        paddingVertical: 7,
        minHeight: 32,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: `${color}30`,
        backgroundColor: `${color}15`,
      }}
    >
      <MaterialIcons name={icon} size={14} color={color} />
      <Text style={{ color: '#0F172A', fontSize: 12, fontWeight: '800' }}>
        {text}
      </Text>
    </View>
  );
}

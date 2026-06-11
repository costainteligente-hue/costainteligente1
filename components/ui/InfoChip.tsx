import React from 'react';
import { View, Text } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS } from '@/lib/constants';

interface Props {
  icon: keyof typeof MaterialIcons.glyphMap;
  text: string;
  color?: string;
}

export function InfoChip({ icon, text, color = COLORS.ocean }: Props) {
  return (
    <View
      style={{ backgroundColor: `${color}18`, borderColor: `${color}40`, borderWidth: 1 }}
      className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-full"
    >
      <MaterialIcons name={icon} size={15} color={color} />
      <Text style={{ color: '#0F172A' }} className="text-xs font-bold">
        {text}
      </Text>
    </View>
  );
}

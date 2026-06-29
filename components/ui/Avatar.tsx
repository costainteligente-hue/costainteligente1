import React from 'react';
import { View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS } from '@/lib/constants';

interface Props {
  icon: keyof typeof MaterialIcons.glyphMap;
  color?: string;
  size?: 'sm' | 'md' | 'lg';  // sm=38, md=48, lg=58
  round?: boolean;
}

/** Equivalent to avatar() in PWA — bg rgba(color,0.13), borderRadius 16 or 50% */
export function Avatar({ icon, color = COLORS.ocean, size = 'md', round = false }: Props) {
  const dim = size === 'sm' ? 38 : size === 'lg' ? 58 : 48;
  const radius = round ? 999 : size === 'lg' ? 18 : 16;
  const iconSize = size === 'sm' ? 18 : size === 'lg' ? 28 : 24;
  return (
    <View
      style={{
        width: dim,
        height: dim,
        borderRadius: radius,
        backgroundColor: `${color}20`,
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      <MaterialIcons name={icon} size={iconSize} color={color} />
    </View>
  );
}

import React from 'react';
import { View, Text } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS } from '@/lib/constants';

interface Props {
  title: string;
  subtitle: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  color?: string;
}

/** Equivalent to .header-card in PWA — grid 48px | 1fr, accent avatar, h2+p */
export function HeaderCard({ title, subtitle, icon, color = COLORS.ocean }: Props) {
  return (
    <View
      style={{
        backgroundColor: '#fff',
        borderRadius: 18,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        padding: 16,
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 12,
        gap: 14,
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.07,
        shadowRadius: 24,
        elevation: 3,
      }}
    >
      {/* Avatar 48×48 round-sq */}
      <View
        style={{
          width: 48,
          height: 48,
          borderRadius: 16,
          backgroundColor: `${color}20`,
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <MaterialIcons name={icon} size={24} color={color} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: '#0F172A', fontSize: 19, fontWeight: '900', lineHeight: 23 }}>
          {title}
        </Text>
        <Text style={{ color: 'rgba(15,23,42,0.62)', marginTop: 5, lineHeight: 20, fontWeight: '600', fontSize: 14 }}>
          {subtitle}
        </Text>
      </View>
    </View>
  );
}

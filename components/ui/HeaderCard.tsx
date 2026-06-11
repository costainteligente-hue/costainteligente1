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
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 12,
        elevation: 3,
      }}
    >
      <View
        style={{
          width: 48,
          height: 48,
          borderRadius: 16,
          backgroundColor: `${color}1A`,
          borderWidth: 1,
          borderColor: `${color}20`,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <MaterialIcons name={icon} size={24} color={color} />
      </View>
      <View style={{ flex: 1 }}>
        <Text
          style={{ color: '#0F172A', fontSize: 18, fontWeight: '800', letterSpacing: -0.2 }}
        >
          {title}
        </Text>
        <Text
          style={{ color: '#0F172A99', marginTop: 4, lineHeight: 20, fontWeight: '500' }}
        >
          {subtitle}
        </Text>
      </View>
    </View>
  );
}

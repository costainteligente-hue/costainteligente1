import React from 'react';
import { View, Text } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS } from '@/lib/constants';

interface Props {
  title: string;
  value: string | number;
  subtitle: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  color?: string;
}

/** Equivalent to .metric-card in PWA — min-height 128, flex-col, justify space-between */
export function MetricCard({ title, value, subtitle, icon, color = COLORS.ocean }: Props) {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: '#fff',
        borderRadius: 18,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        padding: 14,
        minHeight: 128,
        justifyContent: 'space-between',
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.07,
        shadowRadius: 24,
        elevation: 3,
      }}
    >
      {/* Avatar round */}
      <View style={{ width: 40, height: 40, borderRadius: 999, backgroundColor: `${color}20`, alignItems: 'center', justifyContent: 'center' }}>
        <MaterialIcons name={icon} size={20} color={color} />
      </View>
      <View>
        <Text style={{ color: '#0F172A', fontSize: 28, fontWeight: '900', letterSpacing: -0.5 }}>{value}</Text>
        <Text style={{ color: '#0F172A', fontSize: 13, fontWeight: '900', marginTop: 2 }}>{title}</Text>
        <Text style={{ color: 'rgba(15,23,42,0.62)', fontSize: 12, fontWeight: '650', marginTop: 2 }}>{subtitle}</Text>
      </View>
    </View>
  );
}

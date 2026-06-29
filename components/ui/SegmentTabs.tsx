import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { COLORS } from '@/lib/constants';

interface Props {
  tabs: string[];
  active: number;
  onChange: (i: number) => void;
  color?: string;
}

/** Equivalent to .segment in PWA */
export function SegmentTabs({ tabs, active, onChange, color = COLORS.ocean }: Props) {
  return (
    <View
      style={{
        flexDirection: 'row',
        gap: 8,
        padding: 8,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: `${color}40`,
        backgroundColor: `${color}15`,
        marginBottom: 12,
      }}
    >
      {tabs.map((tab, i) => (
        <TouchableOpacity
          key={tab}
          onPress={() => onChange(i)}
          style={{
            flex: 1,
            minHeight: 42,
            borderRadius: 14,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: active === i ? color : 'transparent',
            shadowColor: active === i ? color : 'transparent',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: active === i ? 0.24 : 0,
            shadowRadius: 18,
            elevation: active === i ? 3 : 0,
          }}
        >
          <Text style={{ color: active === i ? '#fff' : '#0F172A', fontWeight: '900', fontSize: 13 }}>
            {tab}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

import React from 'react';
import { View, Text } from 'react-native';
import { COLORS } from '@/lib/constants';

interface BarEntry {
  label: string;
  value: number;
  color: string;
}

interface Props {
  data: BarEntry[];
}

/** Equivalent to chartBar() in PWA — horizontal bars with label + value */
export function ChartBar({ data }: Props) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <View style={{ gap: 10 }}>
      {data.map((entry) => {
        const pct = Math.max(4, Math.round((entry.value / max) * 100));
        return (
          <View key={entry.label} style={{ marginBottom: 0 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 7 }}>
              <Text style={{ color: '#0F172A', fontWeight: '850', fontSize: 13 }}>{entry.label}</Text>
              <Text style={{ color: '#0F172A', fontWeight: '900', fontSize: 13 }}>{entry.value}</Text>
            </View>
            <View style={{ height: 10, borderRadius: 999, backgroundColor: 'rgba(15,23,42,0.08)', overflow: 'hidden' }}>
              <View style={{ width: `${pct}%`, height: '100%', borderRadius: 999, backgroundColor: entry.color }} />
            </View>
          </View>
        );
      })}
    </View>
  );
}

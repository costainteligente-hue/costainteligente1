import React from 'react';
import { View, Text } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS } from '@/lib/constants';

export function InfoBox({ text }: { text: string }) {
  return (
    <View
      className="flex-row items-start gap-3 p-4 rounded-2xl mb-3"
      style={{ backgroundColor: `${COLORS.ocean}12`, borderWidth: 1, borderColor: `${COLORS.ocean}30` }}
    >
      <MaterialIcons name="info-outline" size={20} color={COLORS.ocean} style={{ marginTop: 1 }} />
      <Text className="flex-1 text-sm leading-5" style={{ color: '#0F172AAA' }}>
        {text}
      </Text>
    </View>
  );
}

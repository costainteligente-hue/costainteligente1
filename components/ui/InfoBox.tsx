import React from 'react';
import { View, Text } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS } from '@/lib/constants';

/** Equivalent to infoBox() / .info-box in PWA */
export function InfoBox({ text }: { text: string }) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
        padding: 16,
        borderRadius: 18,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: `${COLORS.ocean}25`,
        backgroundColor: `${COLORS.ocean}10`,
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.07,
        shadowRadius: 24,
        elevation: 2,
      }}
    >
      <MaterialIcons name="info-outline" size={20} color={COLORS.ocean} style={{ marginTop: 1 }} />
      <Text style={{ flex: 1, color: 'rgba(15,23,42,0.62)', fontSize: 14, lineHeight: 20, fontWeight: '600' }}>
        {text}
      </Text>
    </View>
  );
}

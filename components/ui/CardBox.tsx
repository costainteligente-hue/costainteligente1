import React from 'react';
import { View, ViewStyle } from 'react-native';

interface Props {
  children: React.ReactNode;
  style?: ViewStyle;
}

/** Equivalent to .card in PWA — border-radius 18px, surface bg, shadow, border line */
export function CardBox({ children, style }: Props) {
  return (
    <View
      style={[
        {
          backgroundColor: '#ffffff',
          borderRadius: 18,
          borderWidth: 1,
          borderColor: '#E2E8F0',
          padding: 16,
          marginBottom: 12,
          shadowColor: '#0F172A',
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.07,
          shadowRadius: 24,
          elevation: 3,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

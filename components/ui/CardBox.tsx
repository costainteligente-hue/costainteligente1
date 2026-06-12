import React from 'react';
import { View, ViewStyle } from 'react-native';

interface Props {
  children: React.ReactNode;
  style?: ViewStyle;
  className?: string;
}

export function CardBox({ children, style, className }: Props) {
  return (
    <View
      className={`rounded-2xl mb-3 p-4 ${className ?? ''}`}
      style={[
        {
          backgroundColor: '#ffffff',
          borderWidth: 1,
          borderColor: '#E2E8F0',
          shadowColor: '#0F172A',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.06,
          shadowRadius: 12,
          elevation: 3,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

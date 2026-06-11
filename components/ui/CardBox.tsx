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
      className={`bg-white dark:bg-gray-900 rounded-2xl border border-line dark:border-white/10 mb-3 p-4 ${className ?? ''}`}
      style={[
        {
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

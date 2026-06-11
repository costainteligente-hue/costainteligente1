import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS } from '@/lib/constants';

interface Props {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  actionIcon?: keyof typeof MaterialIcons.glyphMap;
  onAction?: () => void;
  actionColor?: string;
}

export function SectionHeader({
  title,
  subtitle,
  actionLabel,
  actionIcon,
  onAction,
  actionColor = COLORS.ocean,
}: Props) {
  return (
    <View className="flex-row items-center justify-between mb-1">
      <View style={{ flex: 1, marginRight: 8 }}>
        <Text style={{ color: '#0F172A', fontSize: 17, fontWeight: '800' }}>{title}</Text>
        {subtitle ? (
          <Text style={{ color: '#0F172A99', fontSize: 13, marginTop: 2 }}>{subtitle}</Text>
        ) : null}
      </View>
      {actionLabel && onAction ? (
        <TouchableOpacity
          onPress={onAction}
          className="flex-row items-center gap-1 px-3 py-1.5 rounded-xl"
          style={{ backgroundColor: `${actionColor}18` }}
        >
          {actionIcon ? <MaterialIcons name={actionIcon} size={16} color={actionColor} /> : null}
          <Text style={{ color: actionColor, fontWeight: '800', fontSize: 13 }}>
            {actionLabel}
          </Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

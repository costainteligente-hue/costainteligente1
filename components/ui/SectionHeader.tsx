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

/** Equivalent to section-header + section-title + text-action in PWA */
export function SectionHeader({
  title,
  subtitle,
  actionLabel,
  actionIcon,
  onAction,
  actionColor = COLORS.ocean,
}: Props) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 10 }}>
      <View style={{ flex: 1 }}>
        <Text style={{ color: '#0F172A', fontSize: 18, fontWeight: '900', lineHeight: 22 }}>{title}</Text>
        {subtitle ? (
          <Text style={{ color: 'rgba(15,23,42,0.62)', fontSize: 13, marginTop: 3 }}>{subtitle}</Text>
        ) : null}
      </View>
      {actionLabel && onAction ? (
        <TouchableOpacity
          onPress={onAction}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 5,
            paddingHorizontal: 12,
            paddingVertical: 8,
            minHeight: 38,
            borderRadius: 14,
            backgroundColor: 'transparent',
          }}
        >
          {actionIcon ? <MaterialIcons name={actionIcon} size={16} color={actionColor} /> : null}
          <Text style={{ color: actionColor, fontWeight: '900', fontSize: 13 }}>
            {actionLabel}
          </Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

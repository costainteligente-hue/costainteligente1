import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS } from '@/lib/constants';

interface Props {
  icon: keyof typeof MaterialIcons.glyphMap;
  title: string;
  message: string;
  buttonLabel: string;
  onPress: () => void;
}

export function EmptyState({ icon, title, message, buttonLabel, onPress }: Props) {
  return (
    <View className="items-center py-10 px-6">
      <MaterialIcons name={icon} size={52} color={COLORS.ocean} />
      <Text className="text-lg font-extrabold text-navy mt-3">{title}</Text>
      <Text className="text-gray-500 text-center mt-2 leading-5">{message}</Text>
      <TouchableOpacity
        onPress={onPress}
        className="mt-5 flex-row items-center gap-2 px-5 py-3 rounded-xl"
        style={{ backgroundColor: COLORS.ocean }}
      >
        <MaterialIcons name="add" size={18} color="#fff" />
        <Text className="text-white font-extrabold">{buttonLabel}</Text>
      </TouchableOpacity>
    </View>
  );
}

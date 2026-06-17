/**
 * useNotifications — Costa Inteligente
 * Registro de tokens push con SQLite local.
 */

import { useEffect } from 'react';
import { Platform } from 'react-native';
import { pushTokensRepository } from '@/lib/repositories/push-tokens.repository';

export function useNotifications(userId?: string) {
  useEffect(() => {
    if (!userId || Platform.OS === 'web') return;
    registerForPushNotifications(userId);
  }, [userId]);
}

async function registerForPushNotifications(userId: string) {
  const Notifications = await import('expo-notifications');

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') return;

  try {
    const projectId = process.env.EXPO_PUBLIC_PROJECT_ID;
    const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
    await pushTokensRepository.upsert({
      userId,
      token: tokenData.data,
      platform: Platform.OS as 'ios' | 'android',
    });
  } catch (error) {
    console.warn('[Notifications] Failed to register push token:', error);
  }
}

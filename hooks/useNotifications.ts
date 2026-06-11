import { useEffect } from 'react';
import { Platform } from 'react-native';
import { supabase } from '@/lib/supabase';

export function useNotifications(userId?: string) {
  useEffect(() => {
    if (!userId) return;
    if (Platform.OS === 'web') return; // push notifications not supported on web
    registerForPushNotifications(userId);
  }, [userId]);
}

async function registerForPushNotifications(userId: string) {
  // Lazy import so the module is never loaded on web
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
    const token = tokenData.data;

    await supabase
      .from('push_tokens')
      .upsert(
        { user_id: userId, token, platform: 'ios' },
        { onConflict: 'user_id,token' },
      );
  } catch (error) {
    console.warn('[Notifications] Failed to register push token:', error);
  }
}

/**
 * Provider Layout — full-screen WebView, no Tabs
 * El PWA corre directamente en un WebView con assets locales.
 */
import { Stack } from 'expo-router';

export default function ProviderLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
    </Stack>
  );
}

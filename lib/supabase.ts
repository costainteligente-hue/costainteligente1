import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';

// Safe localStorage access — works in browser, SSR (Node), and native.
// During Expo's static rendering, window/localStorage don't exist.
function makeStorageAdapter() {
  const hasLocalStorage =
    typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

  if (hasLocalStorage) {
    return {
      getItem: (key: string) => Promise.resolve(window.localStorage.getItem(key)),
      setItem: (key: string, value: string) => {
        window.localStorage.setItem(key, value);
        return Promise.resolve();
      },
      removeItem: (key: string) => {
        window.localStorage.removeItem(key);
        return Promise.resolve();
      },
    };
  }

  // Native (iOS/Android) — lazy require expo-secure-store
  if (typeof navigator !== 'undefined' && navigator.product === 'ReactNative') {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const SecureStore = require('expo-secure-store');
    return {
      getItem: (key: string) => SecureStore.getItemAsync(key),
      setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
      removeItem: (key: string) => SecureStore.deleteItemAsync(key),
    };
  }

  // SSR / Node.js — in-memory fallback (session won't persist, which is fine for SSR)
  const memStore: Record<string, string> = {};
  return {
    getItem: (key: string) => Promise.resolve(memStore[key] ?? null),
    setItem: (key: string, value: string) => { memStore[key] = value; return Promise.resolve(); },
    removeItem: (key: string) => { delete memStore[key]; return Promise.resolve(); },
  };
}

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: makeStorageAdapter() as any,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

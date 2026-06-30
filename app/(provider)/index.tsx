/**
 * ProviderPanel — PWA embebido en WebView
 * Carga el costa-inteligente-proveedor-pwa completo como assets locales.
 * Bridge JS pasa sesión (userId, token, apiUrl) al PWA y captura logout.
 */
import React, { useRef, useEffect, useState } from 'react';
import { View, Platform, ActivityIndicator, BackHandler } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';
import { signOut } from '@/lib/services/auth.service';
import { COLORS } from '@/lib/constants';

// ─── Web: iframe directo ──────────────────────────────────────────────────────
function ProviderPanelWeb() {
  const { user } = useAuthStore();
  const router   = useRouter();
  const { clear } = useAuthStore();
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const pwaUrl = '/panel/index.html';

  // Bridge: listen for messages from PWA
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (!e.data) return;
      try {
        const msg = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
        if (msg.type === 'logout') {
          signOut().then(() => { clear(); router.replace('/auth/login'); });
        }
      } catch {}
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  // Inject session into PWA once loaded
  const handleLoad = () => {
    try {
      const win = iframeRef.current?.contentWindow;
      if (!win) return;
      const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? '';
      win.postMessage(JSON.stringify({
        type:    'session',
        userId:  user?.id ?? '',
        name:    user?.fullName ?? '',
        email:   user?.email ?? '',
        apiBase: API_BASE,
      }), '*');
    } catch {}
  };

  return (
    <iframe
      ref={iframeRef}
      src={pwaUrl}
      onLoad={handleLoad}
      style={{ width: '100%', height: '100vh', border: 'none', display: 'block' }}
      title="Panel del proveedor"
    />
  );
}

// ─── Native: WebView con assets locales ──────────────────────────────────────
function ProviderPanelNative() {
  const { user } = useAuthStore();
  const router   = useRouter();
  const { clear } = useAuthStore();
  const wvRef    = useRef<any>(null);
  const [loading, setLoading] = useState(true);

  // Hardware back button support on Android
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      wvRef.current?.goBack();
      return true;
    });
    return () => sub.remove();
  }, []);

  const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? '';

  // Injected JS: runs inside the WebView after page loads
  // Passes session to the PWA via a custom event
  const injectedJS = `
    (function() {
      var session = {
        userId:  ${JSON.stringify(user?.id ?? '')},
        name:    ${JSON.stringify(user?.fullName ?? '')},
        email:   ${JSON.stringify(user?.email ?? '')},
        apiBase: ${JSON.stringify(API_BASE)},
      };
      // Store in sessionStorage so the PWA script can read it
      sessionStorage.setItem('ci_bridge_session', JSON.stringify(session));
      // Also dispatch an event for scripts that listen
      window.dispatchEvent(new CustomEvent('ci_session', { detail: session }));
      // Patch fetch to always use the real API base
      if (session.apiBase) {
        var _fetch = window.fetch;
        window.fetch = function(input, init) {
          var url = typeof input === 'string' ? input : input instanceof Request ? input.url : String(input);
          if (url.startsWith('/api/')) {
            url = session.apiBase + url;
            return _fetch(url, init);
          }
          return _fetch(input, init);
        };
      }
      true;
    })();
  `;

  const handleMessage = (e: any) => {
    try {
      const msg = JSON.parse(e.nativeEvent.data);
      if (msg.type === 'logout') {
        signOut().then(() => { clear(); router.replace('/auth/login'); });
      }
    } catch {}
  };

  // Load the PWA from local assets
  // expo-asset resolves the path at runtime
  const { Asset } = require('expo-asset');
  const [htmlUri, setHtmlUri] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const asset = Asset.fromModule(require('@/assets/pwa/index.html'));
        await asset.downloadAsync();
        setHtmlUri(asset.localUri ?? asset.uri);
      } catch {
        // Fallback: load from bundled string
        setHtmlUri(null);
      }
    })();
  }, []);

  try {
    const { WebView } = require('react-native-webview');

    return (
      <View style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
        {loading && (
          <View style={{ position: 'absolute', inset: 0, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8FAFC', zIndex: 10 }}>
            <ActivityIndicator size="large" color={COLORS.ocean} />
          </View>
        )}
        {htmlUri ? (
          <WebView
            ref={wvRef}
            source={{ uri: htmlUri }}
            injectedJavaScript={injectedJS}
            onMessage={handleMessage}
            onLoadEnd={() => setLoading(false)}
            javaScriptEnabled
            domStorageEnabled
            allowFileAccess
            allowUniversalAccessFromFileURLs
            originWhitelist={['*']}
            mixedContentMode="always"
            style={{ flex: 1 }}
          />
        ) : (
          <WebView
            ref={wvRef}
            source={{ uri: `${API_BASE}/panel` }}
            injectedJavaScript={injectedJS}
            onMessage={handleMessage}
            onLoadEnd={() => setLoading(false)}
            javaScriptEnabled
            domStorageEnabled
            originWhitelist={['*']}
            style={{ flex: 1 }}
          />
        )}
      </View>
    );
  } catch {
    // react-native-webview not installed — show fallback
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8FAFC' }}>
        <ActivityIndicator size="large" color={COLORS.ocean} />
      </View>
    );
  }
}

// ─── Entry point ──────────────────────────────────────────────────────────────
export default function ProviderPanel() {
  if (Platform.OS === 'web') return <ProviderPanelWeb />;
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0F172A' }} edges={['top']}>
      <ProviderPanelNative />
    </SafeAreaView>
  );
}

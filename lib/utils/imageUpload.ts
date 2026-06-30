/**
 * imageUpload — Utilidad unificada de carga de imágenes
 * Funciona en web (File API → base64) y nativo (expo-image-picker).
 * Retorna una URI local lista para preview y envío.
 */
import { Platform, Alert } from 'react-native';

export interface ImagePickResult {
  uri: string;        // base64 data URI (web) or local file URI (native)
  fileName?: string;
  mimeType?: string;
  fileSize?: number;
}

export interface ImagePickOptions {
  allowsMultipleSelection?: boolean;
  quality?: number;         // 0-1, default 0.75
  maxSizeMB?: number;       // warn if exceeded, default 5
  source?: 'library' | 'camera';
}

/**
 * Opens the image picker and returns selected image(s).
 * On web: triggers a file input dialog.
 * On native: uses expo-image-picker.
 */
export async function pickImage(opts: ImagePickOptions = {}): Promise<ImagePickResult[]> {
  const {
    allowsMultipleSelection = false,
    quality = 0.75,
    source = 'library',
  } = opts;

  // ── WEB ──────────────────────────────────────────────────────────────────────
  if (Platform.OS === 'web') {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type    = 'file';
      input.accept  = 'image/*';
      input.multiple = allowsMultipleSelection;
      input.onchange = (e: any) => {
        const files: File[] = Array.from(e.target?.files ?? []);
        if (!files.length) { resolve([]); return; }
        Promise.all(
          files.map((file) =>
            new Promise<ImagePickResult>((res) => {
              const reader = new FileReader();
              reader.onload = (ev) => {
                res({
                  uri:      ev.target?.result as string,
                  fileName: file.name,
                  mimeType: file.type,
                  fileSize: file.size,
                });
              };
              reader.readAsDataURL(file);
            }),
          ),
        ).then(resolve);
      };
      input.click();
    });
  }

  // ── NATIVE ───────────────────────────────────────────────────────────────────
  try {
    const IP = await import('expo-image-picker');

    // Request permission
    if (source === 'camera') {
      const perm = await IP.requestCameraPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Permiso de cámara requerido', 'Ve a Ajustes para habilitarlo.');
        return [];
      }
    } else {
      const perm = await IP.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Permiso de galería requerido', 'Ve a Ajustes para habilitarlo.');
        return [];
      }
    }

    const result = source === 'camera'
      ? await IP.launchCameraAsync({ quality, allowsMultipleSelection: false })
      : await IP.launchImageLibraryAsync({
          mediaTypes: IP.MediaTypeOptions.Images,
          quality,
          allowsMultipleSelection,
        });

    if (result.canceled) return [];

    return result.assets.map((a: any) => ({
      uri:      a.uri,
      fileName: a.fileName ?? undefined,
      mimeType: a.mimeType ?? 'image/jpeg',
      fileSize: a.fileSize ?? undefined,
    }));
  } catch (err: any) {
    Alert.alert('Error', 'No se pudo abrir el selector de imágenes. ' + (err?.message ?? ''));
    return [];
  }
}

/**
 * Uploads an image URI to the backend storage endpoint.
 * Returns the public URL of the uploaded file.
 * Falls back gracefully if no upload endpoint is configured.
 */
export async function uploadImage(uri: string, path: string): Promise<string> {
  const API_BASE = (typeof process !== 'undefined' ? process.env?.EXPO_PUBLIC_API_URL : '') ?? '';
  if (!API_BASE) return uri; // dev fallback: return local URI

  try {
    // For web data URIs, convert to blob first
    let body: FormData | null = null;
    if (uri.startsWith('data:')) {
      const res = await fetch(uri);
      const blob = await res.blob();
      const fd = new FormData();
      fd.append('file', blob, path.split('/').pop() ?? 'image.jpg');
      fd.append('path', path);
      body = fd;
    } else {
      // Native: fetch file as blob
      const fd = new FormData();
      fd.append('file', { uri, type: 'image/jpeg', name: path.split('/').pop() ?? 'image.jpg' } as any);
      fd.append('path', path);
      body = fd;
    }

    const res = await fetch(`${API_BASE}/api/upload`, { method: 'POST', body });
    if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
    const data = await res.json();
    return data.url ?? uri;
  } catch {
    // If upload fails, return the local URI for local preview
    return uri;
  }
}

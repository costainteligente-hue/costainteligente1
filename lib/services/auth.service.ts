/**
 * AuthService — Costa Inteligente
 *
 * Browser (Expo Web): llama a /api/auth/* en Vercel
 * Nativo (iOS/Android): llama directo a Railway via postgres.js
 *
 * @module lib/services/auth.service
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { UserRole } from '@/types';

const SESSION_KEY = 'costa:session_token';
const IS_BROWSER  = typeof window !== 'undefined';
const API_BASE    = process.env.EXPO_PUBLIC_API_URL ?? '';

// ─── Tipos públicos ───────────────────────────────────────────────────────────

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  fullName: string | null;
}

export interface AuthSession {
  token: string;
  user: AuthUser;
  expiresAt: string;
}

export interface AuthResult {
  session: AuthSession | null;
  error: string | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function apiPost(path: string, body: unknown): Promise<any> {
  const res = await fetch(`${API_BASE}/api${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? `Error ${res.status}`);
  return data;
}

async function apiGet(path: string, token: string): Promise<any> {
  const res = await fetch(`${API_BASE}/api${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? `Error ${res.status}`);
  return data;
}

function responseToResult(data: any): AuthResult {
  return {
    session: {
      token:     data.token,
      expiresAt: data.expiresAt,
      user: {
        id:       data.user.id,
        email:    data.user.email,
        role:     data.user.role as UserRole,
        fullName: data.user.fullName,
      },
    },
    error: null,
  };
}

// ─── Auth functions ───────────────────────────────────────────────────────────

export async function signUp(params: {
  email: string;
  password: string;
  fullName: string;
  role: UserRole;
}): Promise<AuthResult> {
  try {
    if (IS_BROWSER) {
      const data = await apiPost('/auth/signup', params);
      await AsyncStorage.setItem(SESSION_KEY, data.token);
      return responseToResult(data);
    }

    // Nativo: usa el servicio local con postgres
    const { signUpNative } = await import('./auth.service.native');
    return signUpNative(params);
  } catch (err: any) {
    return { session: null, error: err.message ?? 'Error al crear la cuenta.' };
  }
}

export async function signIn(params: {
  email: string;
  password: string;
}): Promise<AuthResult> {
  try {
    if (IS_BROWSER) {
      const data = await apiPost('/auth/signin', params);
      await AsyncStorage.setItem(SESSION_KEY, data.token);
      return responseToResult(data);
    }

    const { signInNative } = await import('./auth.service.native');
    return signInNative(params);
  } catch (err: any) {
    return { session: null, error: err.message ?? 'Error al iniciar sesión.' };
  }
}

export async function signOut(): Promise<void> {
  await AsyncStorage.removeItem(SESSION_KEY);
}

export async function getSession(): Promise<AuthResult> {
  try {
    const token = await AsyncStorage.getItem(SESSION_KEY);
    if (!token) return { session: null, error: null };

    if (IS_BROWSER) {
      try {
        const data = await apiGet('/auth/session', token);
        return responseToResult(data);
      } catch {
        await AsyncStorage.removeItem(SESSION_KEY);
        return { session: null, error: null };
      }
    }

    const { getSessionNative } = await import('./auth.service.native');
    return getSessionNative(token);
  } catch {
    return { session: null, error: null };
  }
}

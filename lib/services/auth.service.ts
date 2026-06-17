/**
 * AuthService — Costa Inteligente
 * Autenticación local con PostgreSQL (Railway) + Drizzle ORM.
 * Hash SHA-256 con salt. Sesiones en tabla sessions, token en AsyncStorage.
 * @module lib/services/auth.service
 */

import * as Crypto from 'expo-crypto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { eq, and, gt } from 'drizzle-orm';
import { getDb } from '@/lib/db/client';
import { users, profiles, sessions } from '@/lib/db/schema';
import type { UserRole } from '@/types';

const SESSION_KEY      = 'costa:session_token';
const SESSION_TTL_DAYS = 30;

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
  expiresAt: string; // ISO string
}

export interface AuthResult {
  session: AuthSession | null;
  error: string | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generateId(): string {
  const bytes = Crypto.getRandomBytes(16);
  const hex   = Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('');
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    '4' + hex.slice(13, 16),
    ((parseInt(hex[16], 16) & 0x3) | 0x8).toString(16) + hex.slice(17, 20),
    hex.slice(20, 32),
  ].join('-');
}

async function hashPassword(password: string, salt: string): Promise<string> {
  const hash = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    `${salt}:${password}`,
  );
  return `${salt}$${hash}`;
}

async function createPasswordHash(password: string): Promise<string> {
  return hashPassword(password, generateId());
}

async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [salt] = stored.split('$');
  if (!salt) return false;
  return (await hashPassword(password, salt)) === stored;
}

function expiresAtDate(days = SESSION_TTL_DAYS): Date {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
}

// ─── Helpers PG — Drizzle con postgres.js devuelve arrays, no .get() ─────────

async function queryFirst<T>(promise: Promise<T[]>): Promise<T | null> {
  const rows = await promise;
  return rows[0] ?? null;
}

// ─── Auth functions ───────────────────────────────────────────────────────────

/** Registra un usuario nuevo */
export async function signUp(params: {
  email: string;
  password: string;
  fullName: string;
  role: UserRole;
}): Promise<AuthResult> {
  const db = getDb();
  const { email, password, fullName, role } = params;

  try {
    const existing = await queryFirst(
      db.select({ id: users.id }).from(users).where(eq(users.email, email.toLowerCase().trim())),
    );
    if (existing) return { session: null, error: 'Este correo ya está registrado.' };

    const userId      = generateId();
    const passwordHash = await createPasswordHash(password);

    await db.transaction(async (tx) => {
      await tx.insert(users).values({ id: userId, email: email.toLowerCase().trim(), passwordHash, emailVerified: false });
      await tx.insert(profiles).values({ id: userId, role, fullName: fullName.trim() });
    });

    return createSession(userId, email.toLowerCase().trim(), role, fullName.trim());
  } catch (err) {
    console.error('[AuthService] signUp error:', err);
    return { session: null, error: 'Error al crear la cuenta. Intenta de nuevo.' };
  }
}

/** Inicia sesión */
export async function signIn(params: {
  email: string;
  password: string;
}): Promise<AuthResult> {
  const db = getDb();
  const { email, password } = params;

  try {
    const user = await queryFirst(
      db.select().from(users).where(eq(users.email, email.toLowerCase().trim())),
    );
    if (!user) return { session: null, error: 'Correo o contraseña incorrectos.' };

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) return { session: null, error: 'Correo o contraseña incorrectos.' };

    const profile = await queryFirst(
      db.select({ role: profiles.role, fullName: profiles.fullName })
        .from(profiles)
        .where(eq(profiles.id, user.id)),
    );

    const role = (profile?.role ?? 'client') as UserRole;
    return createSession(user.id, user.email, role, profile?.fullName ?? null);
  } catch (err) {
    console.error('[AuthService] signIn error:', err);
    return { session: null, error: 'Error al iniciar sesión. Intenta de nuevo.' };
  }
}

/** Cierra sesión */
export async function signOut(): Promise<void> {
  try {
    const token = await AsyncStorage.getItem(SESSION_KEY);
    if (token) {
      await getDb().delete(sessions).where(eq(sessions.token, token));
      await AsyncStorage.removeItem(SESSION_KEY);
    }
  } catch (err) {
    console.error('[AuthService] signOut error:', err);
  }
}

/** Recupera la sesión activa */
export async function getSession(): Promise<AuthResult> {
  try {
    const token = await AsyncStorage.getItem(SESSION_KEY);
    if (!token) return { session: null, error: null };

    const db  = getDb();
    const now = new Date();

    const session = await queryFirst(
      db.select()
        .from(sessions)
        .where(and(eq(sessions.token, token), gt(sessions.expiresAt, now))),
    );

    if (!session) {
      await AsyncStorage.removeItem(SESSION_KEY);
      return { session: null, error: null };
    }

    const [user, profile] = await Promise.all([
      queryFirst(db.select({ email: users.email }).from(users).where(eq(users.id, session.userId))),
      queryFirst(db.select({ role: profiles.role, fullName: profiles.fullName }).from(profiles).where(eq(profiles.id, session.userId))),
    ]);

    if (!user || !profile) {
      await AsyncStorage.removeItem(SESSION_KEY);
      return { session: null, error: null };
    }

    return {
      session: {
        token:     session.token,
        expiresAt: session.expiresAt.toISOString(),
        user: {
          id:       session.userId,
          email:    user.email,
          role:     profile.role as UserRole,
          fullName: profile.fullName,
        },
      },
      error: null,
    };
  } catch (err) {
    console.error('[AuthService] getSession error:', err);
    return { session: null, error: null };
  }
}

// ─── Internal ─────────────────────────────────────────────────────────────────

async function createSession(
  userId: string,
  email: string,
  role: UserRole,
  fullName: string | null,
): Promise<AuthResult> {
  const db        = getDb();
  const sessionId = generateId();
  const token     = generateId() + generateId();
  const exp       = expiresAtDate();

  await db.insert(sessions).values({ id: sessionId, userId, token, expiresAt: exp });
  await AsyncStorage.setItem(SESSION_KEY, token);

  return {
    session: {
      token,
      expiresAt: exp.toISOString(),
      user: { id: userId, email, role, fullName },
    },
    error: null,
  };
}

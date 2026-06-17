/**
 * auth.service.native — Solo para iOS/Android
 * Conecta directo a PostgreSQL. No se importa en el browser.
 */

import * as Crypto from 'expo-crypto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { eq, and, gt } from 'drizzle-orm';
import { getDb } from '@/lib/db/client';
import { users, profiles, sessions } from '@/lib/db/schema';
import type { UserRole } from '@/types';
import type { AuthResult } from './auth.service';

const SESSION_KEY = 'costa:session_token';

function generateId(): string {
  const bytes = Crypto.getRandomBytes(16);
  const hex   = Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('');
  return [hex.slice(0,8), hex.slice(8,12), '4'+hex.slice(13,16),
    ((parseInt(hex[16],16)&0x3)|0x8).toString(16)+hex.slice(17,20), hex.slice(20,32)].join('-');
}

async function hashPassword(password: string, salt: string): Promise<string> {
  const hash = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, `${salt}:${password}`);
  return `${salt}$${hash}`;
}

async function queryFirst<T>(p: Promise<T[]>): Promise<T | null> {
  return (await p)[0] ?? null;
}

function expiresAtDate(): Date {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  return d;
}

async function createSession(userId: string, email: string, role: UserRole, fullName: string | null): Promise<AuthResult> {
  const db    = getDb();
  const token = generateId() + generateId();
  const exp   = expiresAtDate();
  await db.insert(sessions).values({ id: generateId(), userId, token, expiresAt: exp });
  await AsyncStorage.setItem(SESSION_KEY, token);
  return { session: { token, expiresAt: exp.toISOString(), user: { id: userId, email, role, fullName } }, error: null };
}

export async function signUpNative(params: { email: string; password: string; fullName: string; role: UserRole }): Promise<AuthResult> {
  const db = getDb();
  const existing = await queryFirst(db.select({ id: users.id }).from(users).where(eq(users.email, params.email.toLowerCase().trim())));
  if (existing) return { session: null, error: 'Este correo ya está registrado.' };

  const userId = generateId();
  const salt   = generateId();
  const passwordHash = await hashPassword(params.password, salt);

  await db.transaction(async (tx) => {
    await tx.insert(users).values({ id: userId, email: params.email.toLowerCase().trim(), passwordHash, emailVerified: false });
    await tx.insert(profiles).values({ id: userId, role: params.role, fullName: params.fullName.trim() });
  });

  return createSession(userId, params.email.toLowerCase().trim(), params.role, params.fullName.trim());
}

export async function signInNative(params: { email: string; password: string }): Promise<AuthResult> {
  const db   = getDb();
  const user = await queryFirst(db.select().from(users).where(eq(users.email, params.email.toLowerCase().trim())));
  if (!user) return { session: null, error: 'Correo o contraseña incorrectos.' };

  const [salt] = user.passwordHash.split('$');
  const expected = await hashPassword(params.password, salt);
  if (expected !== user.passwordHash) return { session: null, error: 'Correo o contraseña incorrectos.' };

  const profile = await queryFirst(db.select({ role: profiles.role, fullName: profiles.fullName }).from(profiles).where(eq(profiles.id, user.id)));
  return createSession(user.id, user.email, (profile?.role ?? 'client') as UserRole, profile?.fullName ?? null);
}

export async function getSessionNative(token: string): Promise<AuthResult> {
  const db      = getDb();
  const now     = new Date();
  const session = await queryFirst(db.select().from(sessions).where(and(eq(sessions.token, token), gt(sessions.expiresAt, now))));
  if (!session) { await AsyncStorage.removeItem(SESSION_KEY); return { session: null, error: null }; }

  const [user, profile] = await Promise.all([
    queryFirst(db.select({ email: users.email }).from(users).where(eq(users.id, session.userId))),
    queryFirst(db.select({ role: profiles.role, fullName: profiles.fullName }).from(profiles).where(eq(profiles.id, session.userId))),
  ]);

  if (!user || !profile) { await AsyncStorage.removeItem(SESSION_KEY); return { session: null, error: null }; }

  return {
    session: { token: session.token, expiresAt: session.expiresAt.toISOString(),
      user: { id: session.userId, email: user.email, role: profile.role as UserRole, fullName: profile.fullName } },
    error: null,
  };
}

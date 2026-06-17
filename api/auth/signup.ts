import type { VercelRequest, VercelResponse } from '@vercel/node';
import { eq } from 'drizzle-orm';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from '../../lib/db/schema';
import * as Crypto from 'node:crypto';

const client = postgres(process.env.DATABASE_URL!, { ssl: 'require' });
const db = drizzle(client, { schema });

function generateId(): string { return Crypto.randomUUID(); }

function hashPassword(password: string, salt: string): string {
  return `${salt}$${Crypto.createHash('sha256').update(`${salt}:${password}`).digest('hex')}`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { email, password, fullName, role } = req.body ?? {};
  if (!email || !password || !fullName || !role)
    return res.status(400).json({ error: 'Todos los campos son requeridos' });

  try {
    const existing = await db.select({ id: schema.users.id }).from(schema.users)
      .where(eq(schema.users.email, email.toLowerCase().trim()));
    if (existing[0]) return res.status(409).json({ error: 'Este correo ya está registrado.' });

    const userId = generateId();
    const salt   = generateId();
    const passwordHash = hashPassword(password, salt);

    await db.transaction(async (tx) => {
      await tx.insert(schema.users).values({ id: userId, email: email.toLowerCase().trim(), passwordHash, emailVerified: false });
      await tx.insert(schema.profiles).values({ id: userId, role, fullName: fullName.trim() });
    });

    const token     = generateId() + generateId();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    await db.insert(schema.sessions).values({ id: generateId(), userId, token, expiresAt });

    return res.status(201).json({
      token, expiresAt: expiresAt.toISOString(),
      user: { id: userId, email: email.toLowerCase().trim(), role, fullName: fullName.trim() },
    });
  } catch (err) {
    console.error('[API /auth/signup]', err);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}

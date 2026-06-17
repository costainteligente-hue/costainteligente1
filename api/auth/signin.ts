import type { VercelRequest, VercelResponse } from '@vercel/node';
import { eq } from 'drizzle-orm';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from '../../lib/db/schema';
import * as Crypto from 'node:crypto';

const client = postgres(process.env.DATABASE_URL!, { ssl: 'require' });
const db = drizzle(client, { schema });

async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [salt] = stored.split('$');
  if (!salt) return false;
  const hash = Crypto.createHash('sha256').update(`${salt}:${password}`).digest('hex');
  return `${salt}$${hash}` === stored;
}

function generateId(): string {
  return Crypto.randomUUID();
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { email, password } = req.body ?? {};
  if (!email || !password) return res.status(400).json({ error: 'Email y contraseña requeridos' });

  try {
    const users = await db.select().from(schema.users).where(eq(schema.users.email, email.toLowerCase().trim()));
    const user = users[0];
    if (!user) return res.status(401).json({ error: 'Correo o contraseña incorrectos.' });

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) return res.status(401).json({ error: 'Correo o contraseña incorrectos.' });

    const profiles = await db.select({ role: schema.profiles.role, fullName: schema.profiles.fullName })
      .from(schema.profiles).where(eq(schema.profiles.id, user.id));
    const profile = profiles[0];

    const token = generateId() + generateId();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    await db.insert(schema.sessions).values({
      id: generateId(), userId: user.id, token, expiresAt,
    });

    return res.status(200).json({
      token,
      expiresAt: expiresAt.toISOString(),
      user: { id: user.id, email: user.email, role: profile?.role ?? 'client', fullName: profile?.fullName ?? null },
    });
  } catch (err) {
    console.error('[API /auth/signin]', err);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}

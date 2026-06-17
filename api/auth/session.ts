import type { VercelRequest, VercelResponse } from '@vercel/node';
import { eq, and, gt } from 'drizzle-orm';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from '../../lib/db/schema';

const client = postgres(process.env.DATABASE_URL!, { ssl: 'require' });
const db = drizzle(client, { schema });

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Token requerido' });

  try {
    const now      = new Date();
    const sessions = await db.select().from(schema.sessions)
      .where(and(eq(schema.sessions.token, token), gt(schema.sessions.expiresAt, now)));
    const session = sessions[0];
    if (!session) return res.status(401).json({ error: 'Sesión expirada o inválida' });

    const [users, profiles] = await Promise.all([
      db.select({ email: schema.users.email }).from(schema.users).where(eq(schema.users.id, session.userId)),
      db.select({ role: schema.profiles.role, fullName: schema.profiles.fullName })
        .from(schema.profiles).where(eq(schema.profiles.id, session.userId)),
    ]);

    if (!users[0] || !profiles[0]) return res.status(401).json({ error: 'Usuario no encontrado' });

    return res.status(200).json({
      token: session.token,
      expiresAt: session.expiresAt.toISOString(),
      user: { id: session.userId, email: users[0].email, role: profiles[0].role, fullName: profiles[0].fullName },
    });
  } catch (err) {
    console.error('[API /auth/session]', err);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}

/**
 * Database client — Costa Inteligente
 *
 * En el SERVIDOR (API routes / Node.js): conecta directo a PostgreSQL via postgres.js
 * En el BROWSER (Expo Web): no se usa directamente — los repositorios llaman a /api/
 *
 * @module lib/db/client
 */

import { Platform } from 'react-native';

// Solo importamos postgres en entorno servidor (Node.js)
let _db: any = null;

export function getDb() {
  if (typeof window !== 'undefined') {
    throw new Error('[DB] getDb() no debe llamarse en el browser. Usa los repositorios que llaman a /api/');
  }
  if (!_db) {
    // Dynamic require para evitar que el bundler web lo incluya
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const postgres = require('postgres');
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { drizzle } = require('drizzle-orm/postgres-js');
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const schema = require('./schema');

    const DATABASE_URL = process.env.DATABASE_URL ?? '';
    const client = postgres(DATABASE_URL, { ssl: 'require', max: 10 });
    _db = drizzle(client, { schema });
  }
  return _db;
}

export async function initDatabase(): Promise<void> {
  // En el browser no hay DB local — la conexión es via API
  if (typeof window !== 'undefined') {
    console.log('[DB] Browser mode: usando API endpoints');
    return;
  }
  try {
    const db = getDb();
    await db.execute('SELECT 1' as any);
    console.log('[DB] PostgreSQL conectado correctamente.');
  } catch (err) {
    console.error('[DB] Error al conectar con PostgreSQL:', err);
    throw err;
  }
}

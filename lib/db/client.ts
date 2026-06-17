/**
 * Database client — Costa Inteligente
 * PostgreSQL via Railway usando postgres.js + Drizzle ORM.
 * @module lib/db/client
 */

import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from './schema';

const DATABASE_URL = process.env.DATABASE_URL ?? process.env.EXPO_PUBLIC_DATABASE_URL ?? '';

if (!DATABASE_URL) {
  console.warn('[DB] DATABASE_URL no está definida. La base de datos no funcionará.');
}

// Singleton — una sola conexión por proceso
let _db: ReturnType<typeof drizzle> | null = null;

/**
 * Devuelve la instancia Drizzle (lazy init).
 * Usar siempre getDb() en lugar de instanciar directamente.
 */
export function getDb() {
  if (!_db) {
    const client = postgres(DATABASE_URL, {
      ssl: 'require',           // Railway requiere SSL
      max: 10,                  // pool de conexiones
      idle_timeout: 20,
      connect_timeout: 10,
    });
    _db = drizzle(client, { schema });
  }
  return _db;
}

/**
 * Inicializa la conexión a la base de datos.
 * Llamar una vez en el arranque de la app (_layout.tsx).
 * Con PostgreSQL las migraciones se aplican via: npx drizzle-kit push
 */
export async function initDatabase(): Promise<void> {
  try {
    const db = getDb();
    // Verificar conexión con una query simple
    await db.execute('SELECT 1' as any);
    console.log('[DB] PostgreSQL conectado correctamente.');
  } catch (err) {
    console.error('[DB] Error al conectar con PostgreSQL:', err);
    throw err;
  }
}

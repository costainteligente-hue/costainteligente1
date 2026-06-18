/**
 * Script para crear el usuario administrador inicial.
 * Uso: npx tsx scripts/create-admin.ts
 */

import 'dotenv/config';
import postgres from 'postgres';
import crypto from 'node:crypto';

const EMAIL    = 'costainteligente@gmail.com';
const PASSWORD = 'costainteligenteadmin1';
const ROLE     = 'admin';
const FULLNAME = 'Administrador Costa Inteligente';

function generateId(): string {
  return crypto.randomUUID();
}

function hashPassword(password: string, salt: string): string {
  const hash = crypto.createHash('sha256').update(`${salt}:${password}`).digest('hex');
  return `${salt}$${hash}`;
}

async function main() {
  const sql = postgres(process.env.DATABASE_URL!, { ssl: 'require' });

  try {
    // Verificar si ya existe
    const existing = await sql`SELECT id FROM users WHERE email = ${EMAIL}`;
    if (existing.length > 0) {
      console.log('✓ El usuario admin ya existe:', EMAIL);
      await sql.end();
      return;
    }

    const userId = generateId();
    const salt   = generateId();
    const passwordHash = hashPassword(PASSWORD, salt);

    // Insertar user
    await sql`
      INSERT INTO users (id, email, password_hash, email_verified, created_at, updated_at)
      VALUES (${userId}, ${EMAIL}, ${passwordHash}, true, NOW(), NOW())
    `;

    // Insertar profile con rol admin
    await sql`
      INSERT INTO profiles (id, role, full_name, created_at, updated_at)
      VALUES (${userId}, ${ROLE}, ${FULLNAME}, NOW(), NOW())
    `;

    console.log('✅ Admin creado exitosamente');
    console.log('   Email:', EMAIL);
    console.log('   Role:', ROLE);
    console.log('   ID:', userId);
  } catch (err) {
    console.error('❌ Error:', err);
  } finally {
    await sql.end();
  }
}

main();

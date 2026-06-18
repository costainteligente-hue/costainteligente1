const postgres = require('postgres');
const crypto   = require('node:crypto');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { email, password, businessName, rfc, phone, address } = req.body ?? {};
  if (!email || !password || !businessName || !rfc || !phone || !address)
    return res.status(400).json({ error: 'Todos los campos son requeridos' });

  const sql = postgres(process.env.DATABASE_URL, { ssl: 'require', max: 1 });

  try {
    // Verificar si el correo ya existe
    const existing = await sql`SELECT id FROM users WHERE email = ${email.toLowerCase().trim()}`;
    if (existing.length > 0)
      return res.status(409).json({ error: 'Este correo ya está registrado.' });

    const userId = crypto.randomUUID();
    const salt   = crypto.randomUUID();
    const hash   = crypto.createHash('sha256').update(`${salt}:${password}`).digest('hex');
    const passwordHash = `${salt}$${hash}`;

    // Crear usuario
    await sql`INSERT INTO users (id, email, password_hash, email_verified, created_at, updated_at)
              VALUES (${userId}, ${email.toLowerCase().trim()}, ${passwordHash}, false, NOW(), NOW())`;

    // Crear perfil con rol provider
    await sql`INSERT INTO profiles (id, role, full_name, created_at, updated_at)
              VALUES (${userId}, 'provider', ${businessName.trim()}, NOW(), NOW())`;

    // Crear registro de proveedor pendiente
    await sql`INSERT INTO providers (id, user_id, business_name, service_type, rfc, phone, address, status, created_at, updated_at)
              VALUES (${crypto.randomUUID()}, ${userId}, ${businessName.trim()}, 'general', ${rfc.toUpperCase().trim()}, ${phone.trim()}, ${address.trim()}, 'pending', NOW(), NOW())`;

    return res.status(201).json({ success: true, userId });
  } catch (err) {
    console.error('[/api/auth/register-provider]', err);
    return res.status(500).json({ error: 'Error interno: ' + err.message });
  } finally {
    await sql.end();
  }
};

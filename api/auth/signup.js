const postgres = require('postgres');
const crypto   = require('node:crypto');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { email, password, fullName, role } = req.body ?? {};
  if (!email || !password || !fullName || !role)
    return res.status(400).json({ error: 'Todos los campos son requeridos' });

  const sql = postgres(process.env.DATABASE_URL, { ssl: 'require', max: 1 });

  try {
    const existing = await sql`SELECT id FROM users WHERE email = ${email.toLowerCase().trim()}`;
    if (existing.length > 0)
      return res.status(409).json({ error: 'Este correo ya está registrado.' });

    const userId = crypto.randomUUID();
    const salt   = crypto.randomUUID();
    const hash   = crypto.createHash('sha256').update(`${salt}:${password}`).digest('hex');
    const passwordHash = `${salt}$${hash}`;

    await sql`INSERT INTO users (id, email, password_hash, email_verified, created_at, updated_at)
              VALUES (${userId}, ${email.toLowerCase().trim()}, ${passwordHash}, false, NOW(), NOW())`;
    await sql`INSERT INTO profiles (id, role, full_name, created_at, updated_at)
              VALUES (${userId}, ${role}, ${fullName.trim()}, NOW(), NOW())`;

    const token     = crypto.randomUUID() + crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    await sql`INSERT INTO sessions (id, user_id, token, expires_at, created_at)
              VALUES (${crypto.randomUUID()}, ${userId}, ${token}, ${expiresAt}, NOW())`;

    return res.status(201).json({
      token,
      expiresAt: expiresAt.toISOString(),
      user: { id: userId, email: email.toLowerCase().trim(), role, fullName: fullName.trim() },
    });
  } catch (err) {
    console.error('[/api/auth/signup]', err);
    return res.status(500).json({ error: 'Error interno: ' + err.message });
  } finally {
    await sql.end();
  }
};

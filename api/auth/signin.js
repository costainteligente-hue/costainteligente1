const postgres = require('postgres');
const crypto   = require('node:crypto');

module.exports = async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { email, password } = req.body ?? {};
  if (!email || !password) return res.status(400).json({ error: 'Email y contraseña requeridos' });

  const sql = postgres(process.env.DATABASE_URL, { ssl: 'require', max: 1 });

  try {
    const users = await sql`SELECT * FROM users WHERE email = ${email.toLowerCase().trim()}`;
    const user  = users[0];
    if (!user) return res.status(401).json({ error: 'Correo o contraseña incorrectos.' });

    const [salt] = user.password_hash.split('$');
    const hash   = crypto.createHash('sha256').update(`${salt}:${password}`).digest('hex');
    if (`${salt}$${hash}` !== user.password_hash)
      return res.status(401).json({ error: 'Correo o contraseña incorrectos.' });

    const profiles = await sql`SELECT role, full_name FROM profiles WHERE id = ${user.id}`;
    const profile  = profiles[0];

    const token     = crypto.randomUUID() + crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    await sql`
      INSERT INTO sessions (id, user_id, token, expires_at, created_at)
      VALUES (${crypto.randomUUID()}, ${user.id}, ${token}, ${expiresAt}, NOW())
    `;

    return res.status(200).json({
      token,
      expiresAt: expiresAt.toISOString(),
      user: { id: user.id, email: user.email, role: profile?.role ?? 'client', fullName: profile?.full_name ?? null },
    });
  } catch (err) {
    console.error('[/api/auth/signin]', err);
    return res.status(500).json({ error: 'Error interno: ' + err.message });
  } finally {
    await sql.end();
  }
};

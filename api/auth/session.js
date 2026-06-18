const postgres = require('postgres');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Token requerido' });

  const sql = postgres(process.env.DATABASE_URL, { ssl: 'require', max: 1 });

  try {
    const now      = new Date();
    const sessions = await sql`SELECT * FROM sessions WHERE token = ${token} AND expires_at > ${now}`;
    const session  = sessions[0];
    if (!session) return res.status(401).json({ error: 'Sesión expirada' });

    const [users, profiles] = await Promise.all([
      sql`SELECT email FROM users WHERE id = ${session.user_id}`,
      sql`SELECT role, full_name FROM profiles WHERE id = ${session.user_id}`,
    ]);

    if (!users[0]) return res.status(401).json({ error: 'Usuario no encontrado' });

    return res.status(200).json({
      token:     session.token,
      expiresAt: session.expires_at.toISOString(),
      user: {
        id:       session.user_id,
        email:    users[0].email,
        role:     profiles[0]?.role ?? 'client',
        fullName: profiles[0]?.full_name ?? null,
      },
    });
  } catch (err) {
    console.error('[/api/auth/session]', err);
    return res.status(500).json({ error: 'Error interno: ' + err.message });
  } finally {
    await sql.end();
  }
};

const postgres = require('postgres');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const sql = postgres(process.env.DATABASE_URL, { ssl: 'require', max: 1 });

  try {
    const [clients, approved, pending] = await Promise.all([
      sql`SELECT COUNT(*) as count FROM profiles WHERE role = 'client'`,
      sql`SELECT COUNT(*) as count FROM providers WHERE status = 'approved'`,
      sql`SELECT COUNT(*) as count FROM providers WHERE status = 'pending'`,
    ]);

    return res.status(200).json({
      clients:   parseInt(clients[0].count),
      providers: parseInt(approved[0].count),
      pending:   parseInt(pending[0].count),
    });
  } catch (err) {
    console.error('[/api/admin/stats]', err);
    return res.status(500).json({ error: err.message });
  } finally {
    await sql.end();
  }
};

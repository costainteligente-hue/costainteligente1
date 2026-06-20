/**
 * GET /api/auth/provider-status?userId=xxx
 * Devuelve el estado de aprobación del proveedor
 */
const postgres = require('postgres');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { userId } = req.query;
  if (!userId) return res.status(400).json({ error: 'userId requerido' });

  const sql = postgres(process.env.DATABASE_URL, { ssl: 'require', max: 1 });
  try {
    const rows = await sql`
      SELECT status FROM providers WHERE user_id = ${userId} LIMIT 1
    `;
    if (!rows[0]) return res.status(404).json({ status: null });
    return res.status(200).json({ status: rows[0].status });
  } catch (err) {
    console.error('[/api/auth/provider-status]', err);
    return res.status(500).json({ error: err.message });
  } finally {
    await sql.end();
  }
};

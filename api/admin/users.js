/**
 * GET /api/admin/users — Lista todos los usuarios reales
 * Vercel serverless function
 */
const postgres = require('postgres');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const sql = postgres(process.env.DATABASE_URL, { ssl: 'require', max: 1 });
  const search = req.query.search ?? '';

  try {
    let rows;
    if (search.trim()) {
      const q = `%${search.trim()}%`;
      rows = await sql`
        SELECT p.id, p.full_name, p.phone, p.role, p.created_at, u.email
        FROM profiles p
        INNER JOIN users u ON u.id = p.id
        WHERE
          p.full_name ILIKE ${q} OR
          u.email ILIKE ${q} OR
          p.phone ILIKE ${q}
        ORDER BY p.created_at DESC
      `;
    } else {
      rows = await sql`
        SELECT p.id, p.full_name, p.phone, p.role, p.created_at, u.email
        FROM profiles p
        INNER JOIN users u ON u.id = p.id
        ORDER BY p.created_at DESC
      `;
    }

    const data = rows.map((r) => ({
      id:           r.id,
      fullName:     r.full_name,
      email:        r.email,
      phone:        r.phone,
      role:         r.role,
      status:       'active',
      registeredAt: r.created_at
        ? new Date(r.created_at).toLocaleDateString('es-MX')
        : '',
    }));

    return res.status(200).json(data);
  } catch (err) {
    console.error('[/api/admin/users]', err);
    return res.status(500).json({ error: err.message });
  } finally {
    await sql.end();
  }
};

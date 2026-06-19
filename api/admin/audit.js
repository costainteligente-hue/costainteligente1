/**
 * GET /api/admin/audit — logs de auditoría reales
 */
const postgres = require('postgres');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const sql = postgres(process.env.DATABASE_URL, { ssl: 'require', max: 1 });
  try {
    const rows = await sql`
      SELECT al.id, al.action, al.target_type, al.target_id, al.description, al.created_at,
             p.full_name AS admin_name
      FROM audit_logs al
      LEFT JOIN profiles p ON p.id = al.admin_id
      ORDER BY al.created_at DESC
      LIMIT 100
    `;
    return res.status(200).json(rows.map((r) => ({
      id:          r.id,
      action:      r.action,
      targetType:  r.target_type,
      targetId:    r.target_id,
      description: r.description,
      adminName:   r.admin_name ?? 'Admin',
      createdAt:   r.created_at ? new Date(r.created_at).toLocaleString('es-MX') : '',
    })));
  } catch (err) {
    console.error('[/api/admin/audit]', err);
    return res.status(500).json({ error: err.message });
  } finally {
    await sql.end();
  }
};

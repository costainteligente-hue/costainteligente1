/**
 * GET  /api/admin/reports  — lista todos los reportes
 * POST /api/admin/reports  — resuelve un reporte { id }
 */
const postgres = require('postgres');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const sql = postgres(process.env.DATABASE_URL, { ssl: 'require', max: 1 });

  try {
    if (req.method === 'GET') {
      const rows = await sql`
        SELECT r.id, r.report_type, r.target_id, r.description, r.status, r.created_at,
               p.full_name AS reporter_name
        FROM reports r
        LEFT JOIN profiles p ON p.id = r.reporter_id
        ORDER BY r.created_at DESC
        LIMIT 100
      `;
      return res.status(200).json(rows.map((r) => ({
        id:           r.id,
        reportType:   r.report_type,
        targetId:     r.target_id,
        description:  r.description,
        status:       r.status,
        reporterName: r.reporter_name ?? 'Usuario',
        createdAt:    r.created_at ? new Date(r.created_at).toLocaleDateString('es-MX') : '',
      })));
    }

    if (req.method === 'POST') {
      const { id } = req.body ?? {};
      if (!id) return res.status(400).json({ error: 'id requerido' });
      await sql`UPDATE reports SET status = 'resolved', updated_at = NOW() WHERE id = ${id}`;
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('[/api/admin/reports]', err);
    return res.status(500).json({ error: err.message });
  } finally {
    await sql.end();
  }
};

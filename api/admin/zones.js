/**
 * GET  /api/admin/zones  — lista todas las zonas
 * POST /api/admin/zones  — activa/desactiva { id, isActive }
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
        SELECT id, name, level, zone_type, is_active, latitude, longitude, description
        FROM fishing_zones
        ORDER BY created_at DESC
      `;
      return res.status(200).json(rows.map((r) => ({
        id: r.id, name: r.name, level: r.level, zoneType: r.zone_type,
        isActive: r.is_active, latitude: r.latitude, longitude: r.longitude,
        description: r.description,
      })));
    }

    if (req.method === 'POST') {
      const { id, isActive } = req.body ?? {};
      if (!id || isActive === undefined)
        return res.status(400).json({ error: 'id e isActive requeridos' });
      await sql`UPDATE fishing_zones SET is_active = ${isActive}, updated_at = NOW() WHERE id = ${id}`;
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('[/api/admin/zones]', err);
    return res.status(500).json({ error: err.message });
  } finally {
    await sql.end();
  }
};

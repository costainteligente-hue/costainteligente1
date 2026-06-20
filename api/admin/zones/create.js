/**
 * POST /api/admin/zones/create — Crea una nueva zona de pesca
 */
const postgres = require('postgres');

function generateId() {
  return 'z_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { name, level, zoneType, latitude, longitude, description, species, photoUrls } = req.body ?? {};

  if (!name || !level || !zoneType || latitude === undefined || longitude === undefined) {
    return res.status(400).json({ error: 'Campos requeridos: name, level, zoneType, latitude, longitude' });
  }

  const sql = postgres(process.env.DATABASE_URL, { ssl: 'require', max: 1 });
  try {
    const id = generateId();
    await sql`
      INSERT INTO fishing_zones (id, name, level, zone_type, latitude, longitude, description, photo_urls, is_active, created_at, updated_at)
      VALUES (
        ${id}, ${name}, ${level}, ${zoneType},
        ${parseFloat(latitude)}, ${parseFloat(longitude)},
        ${description ?? ''},
        ${JSON.stringify(photoUrls ?? [])},
        true, NOW(), NOW()
      )
    `;
    return res.status(200).json({ id, ok: true });
  } catch (err) {
    console.error('[/api/admin/zones/create]', err);
    return res.status(500).json({ error: err.message });
  } finally {
    await sql.end();
  }
};

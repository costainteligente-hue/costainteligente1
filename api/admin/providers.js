/**
 * GET  /api/admin/providers — lista todos los proveedores
 * POST /api/admin/providers — aprueba o rechaza un proveedor { id, status, rejectionReason? }
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
        SELECT p.id, p.business_name, p.service_type, p.rfc, p.phone, p.address,
               p.status, p.rejection_reason, p.created_at,
               u.email, pr.full_name as owner_name
        FROM providers p
        INNER JOIN profiles pr ON pr.id = p.user_id
        INNER JOIN users u ON u.id = p.user_id
        ORDER BY p.created_at DESC
      `;
      return res.status(200).json(rows.map((r) => ({
        id:              r.id,
        businessName:    r.business_name,
        serviceType:     r.service_type,
        rfc:             r.rfc,
        phone:           r.phone,
        address:         r.address,
        status:          r.status,
        rejectionReason: r.rejection_reason,
        email:           r.email,
        ownerName:       r.owner_name,
        registeredAt:    r.created_at
          ? new Date(r.created_at).toLocaleDateString('es-MX') : '',
      })));
    }

    if (req.method === 'POST') {
      const { id, status, rejectionReason } = req.body ?? {};
      if (!id || !['approved', 'rejected'].includes(status))
        return res.status(400).json({ error: 'id y status (approved|rejected) requeridos' });
      await sql`
        UPDATE providers
        SET status = ${status}, rejection_reason = ${rejectionReason ?? null}, updated_at = NOW()
        WHERE id = ${id}
      `;
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('[/api/admin/providers]', err);
    return res.status(500).json({ error: err.message });
  } finally {
    await sql.end();
  }
};

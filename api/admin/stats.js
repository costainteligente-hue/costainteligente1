/**
 * GET /api/admin/stats — resumen completo para el dashboard del admin
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
    const [
      clientsRes, providersRes, pendingRes, boatsRes,
      urgentRes, zonesRes, reservationsRes, photosRes, servicesRes,
      verificationRes, prioritiesRes,
    ] = await Promise.all([
      sql`SELECT COUNT(*) AS count FROM profiles WHERE role = 'client'`,
      sql`SELECT COUNT(*) AS count FROM providers WHERE status = 'approved'`,
      sql`SELECT COUNT(*) AS count FROM providers WHERE status = 'pending'`,
      sql`SELECT COUNT(*) AS count FROM providers WHERE service_type ILIKE '%lancha%' OR service_type ILIKE '%embarcaci%' OR service_type ILIKE '%boat%'`,
      sql`SELECT COUNT(*) AS count FROM reports WHERE status = 'pending'`,
      sql`SELECT COUNT(*) AS count FROM fishing_zones WHERE is_active = true`,
      sql`SELECT COUNT(*) AS count FROM reservations`,
      sql`SELECT 0 AS count`, // fotos pendientes — ampliar cuando exista tabla
      sql`SELECT COUNT(*) AS count FROM provider_services WHERE status = 'active'`,
      // conteo por estado de proveedores para la gráfica
      sql`
        SELECT
          SUM(CASE WHEN status = 'pending'  THEN 1 ELSE 0 END) AS pending,
          SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) AS approved,
          SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) AS rejected
        FROM providers
      `,
      // prioridades: reportes pendientes más recientes + proveedores pendientes
      sql`
        SELECT r.id, r.report_type, r.description, r.created_at, p.full_name AS reporter
        FROM reports r
        LEFT JOIN profiles p ON p.id = r.reporter_id
        WHERE r.status = 'pending'
        ORDER BY r.created_at DESC
        LIMIT 3
      `,
    ]);

    const vStats = verificationRes[0] ?? {};
    const verificationByStatus = [
      { label: 'Pendiente',   value: parseInt(vStats.pending  ?? 0) },
      { label: 'Aprobado',    value: parseInt(vStats.approved ?? 0) },
      { label: 'Rechazado',   value: parseInt(vStats.rejected ?? 0) },
    ];

    const priorities = prioritiesRes.map((r) => ({
      id:          r.id,
      title:       r.report_type === 'provider' ? 'Reporte de proveedor'
                 : r.report_type === 'user'     ? 'Reporte de usuario'
                 : 'Reporte de publicación',
      subtitle:    r.description?.slice(0, 80) ?? '',
      responsible: r.reporter ?? 'Sistema',
      status:      'pending',
    }));

    return res.status(200).json({
      clients:             parseInt(clientsRes[0]?.count      ?? 0),
      providers:           parseInt(providersRes[0]?.count    ?? 0),
      pendingVerification: parseInt(pendingRes[0]?.count      ?? 0),
      boats:               parseInt(boatsRes[0]?.count        ?? 0),
      urgentReports:       parseInt(urgentRes[0]?.count       ?? 0),
      activeZones:         parseInt(zonesRes[0]?.count        ?? 0),
      reservations:        parseInt(reservationsRes[0]?.count ?? 0),
      suspended:           0,
      pendingPhotos:       parseInt(photosRes[0]?.count       ?? 0),
      activeServices:      parseInt(servicesRes[0]?.count     ?? 0),
      verificationByStatus,
      priorities,
    });
  } catch (err) {
    console.error('[/api/admin/stats]', err);
    return res.status(500).json({ error: err.message });
  } finally {
    await sql.end();
  }
};

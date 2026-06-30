/**
 * /api/admin — Router consolidado para todas las funciones admin
 * Rutas:  GET  /api/admin?r=stats
 *         GET  /api/admin?r=users
 *         GET  /api/admin?r=providers   POST /api/admin?r=providers
 *         GET  /api/admin?r=zones       POST /api/admin?r=zones
 *         POST /api/admin?r=zones-create
 *         GET  /api/admin?r=reports     POST /api/admin?r=reports
 *         GET  /api/admin?r=audit
 */
const postgres = require('postgres');
const crypto   = require('crypto');

function generateId() {
  return 'z_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const route = req.query.r;
  const sql   = postgres(process.env.DATABASE_URL, { ssl: 'require', max: 1 });

  try {
    // ── STATS ──────────────────────────────────────────────────────────────────
    if (route === 'stats' && req.method === 'GET') {
      const [clientsRes, providersRes, pendingRes, boatsRes, urgentRes, zonesRes, reservationsRes, servicesRes, verificationRes, prioritiesRes] = await Promise.all([
        sql`SELECT COUNT(*) AS count FROM profiles WHERE role = 'client'`,
        sql`SELECT COUNT(*) AS count FROM providers WHERE status = 'approved'`,
        sql`SELECT COUNT(*) AS count FROM providers WHERE status = 'pending'`,
        sql`SELECT COUNT(*) AS count FROM providers WHERE service_type ILIKE '%lancha%' OR service_type ILIKE '%embarcaci%'`,
        sql`SELECT COUNT(*) AS count FROM reports WHERE status = 'pending'`,
        sql`SELECT COUNT(*) AS count FROM fishing_zones WHERE is_active = true`,
        sql`SELECT COUNT(*) AS count FROM reservations`,
        sql`SELECT COUNT(*) AS count FROM provider_services WHERE status = 'active'`,
        sql`SELECT SUM(CASE WHEN status='pending' THEN 1 ELSE 0 END) AS pending, SUM(CASE WHEN status='approved' THEN 1 ELSE 0 END) AS approved, SUM(CASE WHEN status='rejected' THEN 1 ELSE 0 END) AS rejected FROM providers`,
        sql`SELECT r.id, r.report_type, r.description, r.created_at, p.full_name AS reporter FROM reports r LEFT JOIN profiles p ON p.id = r.reporter_id WHERE r.status = 'pending' ORDER BY r.created_at DESC LIMIT 3`,
      ]);
      const v = verificationRes[0] ?? {};
      return res.status(200).json({
        clients: parseInt(clientsRes[0]?.count ?? 0), providers: parseInt(providersRes[0]?.count ?? 0),
        pendingVerification: parseInt(pendingRes[0]?.count ?? 0), boats: parseInt(boatsRes[0]?.count ?? 0),
        urgentReports: parseInt(urgentRes[0]?.count ?? 0), activeZones: parseInt(zonesRes[0]?.count ?? 0),
        reservations: parseInt(reservationsRes[0]?.count ?? 0), suspended: 0, pendingPhotos: 0,
        activeServices: parseInt(servicesRes[0]?.count ?? 0),
        verificationByStatus: [
          { label: 'Pendiente', value: parseInt(v.pending ?? 0) },
          { label: 'Aprobado',  value: parseInt(v.approved ?? 0) },
          { label: 'Rechazado', value: parseInt(v.rejected ?? 0) },
        ],
        priorities: prioritiesRes.map((r) => ({
          id: r.id, title: r.report_type === 'provider' ? 'Reporte de proveedor' : 'Reporte',
          subtitle: r.description?.slice(0, 80) ?? '', responsible: r.reporter ?? 'Sistema', status: 'pending',
        })),
      });
    }

    // ── USERS ─────────────────────────────────────────────────────────────────
    if (route === 'users') {
      if (req.method === 'GET') {
        const search = req.query.search ?? '';
        const rows = search.trim()
          ? await sql`SELECT p.id, p.full_name, p.phone, p.role, p.created_at, u.email,
                        COALESCE(bs.status, 'active') AS block_status
                      FROM profiles p
                      INNER JOIN users u ON u.id = p.id
                      LEFT JOIN user_blocks bs ON bs.user_id = p.id
                      WHERE p.full_name ILIKE ${'%' + search + '%'} OR u.email ILIKE ${'%' + search + '%'}
                      ORDER BY p.created_at DESC`
          : await sql`SELECT p.id, p.full_name, p.phone, p.role, p.created_at, u.email,
                        COALESCE(bs.status, 'active') AS block_status
                      FROM profiles p
                      INNER JOIN users u ON u.id = p.id
                      LEFT JOIN user_blocks bs ON bs.user_id = p.id
                      ORDER BY p.created_at DESC`;
        return res.status(200).json(rows.map((r) => ({
          id: r.id, fullName: r.full_name, email: r.email, phone: r.phone,
          role: r.role, status: r.block_status ?? 'active',
          registeredAt: r.created_at ? new Date(r.created_at).toLocaleDateString('es-MX') : '',
        })));
      }
      // POST: block / suspend / activate user
      if (req.method === 'POST') {
        const { userId, status, reason } = req.body ?? {};
        if (!userId || !['active', 'suspended', 'blocked'].includes(status))
          return res.status(400).json({ error: 'userId y status requeridos' });
        // Upsert into user_blocks table (create if not exists via plain SQL)
        await sql`
          INSERT INTO user_blocks (user_id, status, reason, updated_at)
          VALUES (${userId}, ${status}, ${reason ?? null}, NOW())
          ON CONFLICT (user_id) DO UPDATE SET status = ${status}, reason = ${reason ?? null}, updated_at = NOW()`;
        return res.status(200).json({ ok: true });
      }
    }

    // ── PROVIDERS ─────────────────────────────────────────────────────────────
    if (route === 'providers') {
      if (req.method === 'GET') {
        const rows = await sql`SELECT p.id, p.business_name, p.service_type, p.rfc, p.phone, p.address, p.status, p.rejection_reason, p.created_at, u.email, pr.full_name as owner_name FROM providers p INNER JOIN profiles pr ON pr.id = p.user_id INNER JOIN users u ON u.id = p.user_id ORDER BY p.created_at DESC`;
        return res.status(200).json(rows.map((r) => ({ id: r.id, businessName: r.business_name, serviceType: r.service_type, rfc: r.rfc, phone: r.phone, address: r.address, status: r.status, rejectionReason: r.rejection_reason, email: r.email, ownerName: r.owner_name, registeredAt: r.created_at ? new Date(r.created_at).toLocaleDateString('es-MX') : '' })));
      }
      if (req.method === 'POST') {
        const { id, status, rejectionReason } = req.body ?? {};
        if (!id || !['approved','rejected'].includes(status)) return res.status(400).json({ error: 'id y status requeridos' });
        await sql`UPDATE providers SET status = ${status}, rejection_reason = ${rejectionReason ?? null}, updated_at = NOW() WHERE id = ${id}`;
        return res.status(200).json({ ok: true });
      }
    }

    // ── ZONES ─────────────────────────────────────────────────────────────────
    if (route === 'zones') {
      if (req.method === 'GET') {
        const rows = await sql`SELECT id, name, level, zone_type, is_active, latitude, longitude, description FROM fishing_zones ORDER BY created_at DESC`;
        return res.status(200).json(rows.map((r) => ({ id: r.id, name: r.name, level: r.level, zoneType: r.zone_type, isActive: r.is_active, latitude: r.latitude, longitude: r.longitude, description: r.description })));
      }
      if (req.method === 'POST') {
        const { id, isActive } = req.body ?? {};
        if (!id || isActive === undefined) return res.status(400).json({ error: 'id e isActive requeridos' });
        await sql`UPDATE fishing_zones SET is_active = ${isActive}, updated_at = NOW() WHERE id = ${id}`;
        return res.status(200).json({ ok: true });
      }
    }

    // ── ZONES CREATE ──────────────────────────────────────────────────────────
    if (route === 'zones-create' && req.method === 'POST') {
      const { name, level, zoneType, latitude, longitude, description, photoUrls } = req.body ?? {};
      if (!name || !level || !zoneType) return res.status(400).json({ error: 'Faltan campos requeridos' });
      const id = generateId();
      await sql`INSERT INTO fishing_zones (id, name, level, zone_type, latitude, longitude, description, photo_urls, is_active, created_at, updated_at) VALUES (${id}, ${name}, ${level}, ${zoneType}, ${parseFloat(latitude)}, ${parseFloat(longitude)}, ${description ?? ''}, ${JSON.stringify(photoUrls ?? [])}, true, NOW(), NOW())`;
      return res.status(200).json({ id, ok: true });
    }

    // ── REPORTS ───────────────────────────────────────────────────────────────
    if (route === 'reports') {
      if (req.method === 'GET') {
        const rows = await sql`
          SELECT r.id, r.report_type, r.target_id, r.description, r.status, r.created_at,
                 p.full_name AS reporter_name
          FROM reports r
          LEFT JOIN profiles p ON p.id = r.reporter_id
          ORDER BY r.created_at DESC LIMIT 100`;
        return res.status(200).json(rows.map((r) => ({
          id: r.id, reportType: r.report_type, targetId: r.target_id,
          description: r.description, status: r.status,
          reporterName: r.reporter_name ?? 'Usuario',
          createdAt: r.created_at ? new Date(r.created_at).toLocaleDateString('es-MX') : '',
        })));
      }
      if (req.method === 'POST') {
        const { id, action, targetUserId, reason } = req.body ?? {};
        if (!id) return res.status(400).json({ error: 'id requerido' });

        // Resolve the report
        await sql`UPDATE reports SET status = 'resolved', updated_at = NOW() WHERE id = ${id}`;

        // Optional: also block the reported user
        if (action === 'block-user' && targetUserId) {
          await sql`
            INSERT INTO user_blocks (user_id, status, reason, updated_at)
            VALUES (${targetUserId}, 'blocked', ${reason ?? 'Bloqueado por reporte'}, NOW())
            ON CONFLICT (user_id) DO UPDATE SET status = 'blocked', reason = ${reason ?? 'Bloqueado por reporte'}, updated_at = NOW()`;
        }
        return res.status(200).json({ ok: true });
      }
    }

    // ── AUDIT ─────────────────────────────────────────────────────────────────
    if (route === 'audit' && req.method === 'GET') {
      const rows = await sql`SELECT al.id, al.action, al.target_type, al.target_id, al.description, al.created_at, p.full_name AS admin_name FROM audit_logs al LEFT JOIN profiles p ON p.id = al.admin_id ORDER BY al.created_at DESC LIMIT 100`;
      return res.status(200).json(rows.map((r) => ({ id: r.id, action: r.action, targetType: r.target_type, targetId: r.target_id, description: r.description, adminName: r.admin_name ?? 'Admin', createdAt: r.created_at ? new Date(r.created_at).toLocaleString('es-MX') : '' })));
    }

    return res.status(404).json({ error: `Ruta '${route}' no encontrada` });
  } catch (err) {
    console.error(`[/api/admin?r=${route}]`, err);
    return res.status(500).json({ error: err.message });
  } finally {
    await sql.end();
  }
};

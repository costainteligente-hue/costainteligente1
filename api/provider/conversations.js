/**
 * GET /api/provider/conversations?providerId=xxx
 * Devuelve las reservaciones (con info de cliente y servicio) del proveedor
 * para mostrar la lista de conversaciones del chat.
 */
const postgres = require('postgres');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { providerId } = req.query;
  if (!providerId) return res.status(400).json({ error: 'providerId requerido' });

  const sql = postgres(process.env.DATABASE_URL, { ssl: 'require', max: 1 });
  try {
    // Traer reservaciones + último mensaje de cada una
    const rows = await sql`
      SELECT
        r.id            AS reservation_id,
        r.status,
        ps.name         AS service_name,
        p.full_name     AS client_name,
        m.content       AS last_message,
        m.sent_at       AS last_time,
        (
          SELECT COUNT(*)::int
          FROM messages m2
          WHERE m2.reservation_id = r.id
            AND m2.sender_id != ${providerId}
        ) AS unread
      FROM reservations r
      INNER JOIN provider_services ps ON ps.id = r.service_id
      INNER JOIN profiles p           ON p.id  = r.client_id
      LEFT JOIN LATERAL (
        SELECT content, sent_at
        FROM messages
        WHERE reservation_id = r.id
        ORDER BY sent_at DESC
        LIMIT 1
      ) m ON true
      WHERE r.provider_id = ${providerId}
      ORDER BY COALESCE(m.sent_at, r.created_at) DESC
      LIMIT 50
    `;

    return res.status(200).json(rows.map((r) => ({
      reservationId: r.reservation_id,
      clientName:    r.client_name ?? 'Cliente',
      serviceName:   r.service_name ?? 'Servicio',
      lastMessage:   r.last_message ?? 'Toca para ver los mensajes',
      lastTime:      r.last_time
        ? new Date(r.last_time).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
        : '',
      unread: r.unread ?? 0,
      status: r.status,
    })));
  } catch (err) {
    console.error('[/api/provider/conversations]', err);
    return res.status(500).json({ error: err.message });
  } finally {
    await sql.end();
  }
};

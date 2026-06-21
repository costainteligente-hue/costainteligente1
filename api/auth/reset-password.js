/**
 * POST /api/auth/reset-password
 * Valida el token y actualiza la contraseña del usuario.
 */
const postgres = require('postgres');
const crypto   = require('crypto');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { token, newPassword } = req.body ?? {};

  if (!token)                      return res.status(400).json({ error: 'Token requerido.' });
  if (!newPassword || newPassword.length < 8)
    return res.status(400).json({ error: 'La contraseña debe tener mínimo 8 caracteres.' });

  const sql = postgres(process.env.DATABASE_URL, { ssl: 'require', max: 1 });

  try {
    // Buscar token válido y no usado
    const rows = await sql`
      SELECT id, user_id, expires_at, used
      FROM password_reset_tokens
      WHERE token = ${token}
      LIMIT 1
    `;

    if (rows.length === 0)
      return res.status(400).json({ error: 'Enlace inválido o expirado. Solicita uno nuevo.' });

    const record = rows[0];

    if (record.used)
      return res.status(400).json({ error: 'Este enlace ya fue utilizado. Solicita uno nuevo.' });

    if (new Date(record.expires_at) < new Date())
      return res.status(400).json({ error: 'Este enlace expiró. Solicita uno nuevo.' });

    // Generar nuevo hash de contraseña (mismo formato que auth.service.native.ts)
    const salt         = crypto.randomBytes(16).toString('hex');
    const hash         = crypto.createHash('sha256').update(`${salt}:${newPassword}`).digest('hex');
    const passwordHash = `${salt}$${hash}`;

    // Actualizar contraseña y marcar token como usado
    await sql.begin(async (tx) => {
      await tx`
        UPDATE users SET password_hash = ${passwordHash}, updated_at = NOW()
        WHERE id = ${record.user_id}
      `;
      await tx`
        UPDATE password_reset_tokens SET used = true WHERE id = ${record.id}
      `;
      // Invalidar sesiones activas del usuario para forzar re-login
      await tx`
        DELETE FROM sessions WHERE user_id = ${record.user_id}
      `;
    });

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('[/api/auth/reset-password]', err);
    return res.status(500).json({ error: 'Error interno. Intenta de nuevo.' });
  } finally {
    await sql.end();
  }
};

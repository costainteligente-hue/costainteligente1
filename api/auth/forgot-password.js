/**
 * POST /api/auth/forgot-password
 * Genera token de recuperación y envía correo con Resend.
 * Por seguridad SIEMPRE responde 200 aunque el correo no exista.
 */
const postgres = require('postgres');
const crypto   = require('crypto');

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const APP_URL        = process.env.EXPO_PUBLIC_API_URL ?? 'https://costainteligente1.vercel.app';
const FROM_EMAIL     = process.env.RESEND_FROM_EMAIL ?? 'noreply@costainteligente.mx';

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { email } = req.body ?? {};
  if (!email) return res.status(400).json({ error: 'Email requerido' });

  const sql = postgres(process.env.DATABASE_URL, { ssl: 'require', max: 1 });

  try {
    // Buscar si el usuario existe
    const users = await sql`SELECT id FROM users WHERE email = ${email.toLowerCase().trim()} LIMIT 1`;

    if (users.length > 0) {
      const userId  = users[0].id;
      const token   = crypto.randomBytes(32).toString('hex');
      const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

      // Crear tabla si no existe y guardar token
      await sql`
        CREATE TABLE IF NOT EXISTS password_reset_tokens (
          id         TEXT PRIMARY KEY,
          user_id    TEXT NOT NULL,
          token      TEXT NOT NULL UNIQUE,
          expires_at TIMESTAMPTZ NOT NULL,
          used       BOOLEAN NOT NULL DEFAULT false,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;

      // Eliminar tokens anteriores del mismo usuario
      await sql`DELETE FROM password_reset_tokens WHERE user_id = ${userId}`;

      // Insertar nuevo token
      await sql`
        INSERT INTO password_reset_tokens (id, user_id, token, expires_at)
        VALUES (${crypto.randomUUID()}, ${userId}, ${token}, ${expires})
      `;

      // Enviar correo con Resend
      if (RESEND_API_KEY) {
        const resetUrl = `${APP_URL}/auth/reset-password?token=${token}`;
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type':  'application/json',
            'Authorization': `Bearer ${RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from:    FROM_EMAIL,
            to:      email.toLowerCase().trim(),
            subject: 'Restablecer contraseña — Costa Inteligente',
            html: `
              <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;background:#F8FAFC;border-radius:16px">
                <div style="text-align:center;margin-bottom:24px">
                  <img src="${APP_URL}/assets/images/Logo_No_LETRAS.jpg" style="width:80px;height:80px;border-radius:16px;object-fit:contain" alt="Costa Inteligente"/>
                </div>
                <h2 style="color:#0F172A;font-size:22px;margin-bottom:8px;text-align:center">Restablecer contraseña</h2>
                <p style="color:#64748B;font-size:15px;line-height:1.6;text-align:center;margin-bottom:28px">
                  Recibimos una solicitud para restablecer la contraseña de tu cuenta en Costa Inteligente. Toca el botón para continuar.
                </p>
                <div style="text-align:center;margin-bottom:28px">
                  <a href="${resetUrl}"
                     style="background:#0F766E;color:#fff;font-weight:700;font-size:16px;padding:14px 32px;border-radius:12px;text-decoration:none;display:inline-block">
                    Restablecer contraseña
                  </a>
                </div>
                <p style="color:#94A3B8;font-size:12px;text-align:center;line-height:1.6">
                  Este enlace expira en <strong>1 hora</strong>. Si no solicitaste este cambio, puedes ignorar este correo.<br/>
                  O copia este enlace: <a href="${resetUrl}" style="color:#0F766E">${resetUrl}</a>
                </p>
                <hr style="border:none;border-top:1px solid #E2E8F0;margin:24px 0"/>
                <p style="color:#CBD5E1;font-size:11px;text-align:center">
                  Costa Inteligente · Zihuatanejo, Guerrero · soporte@costainteligente.mx
                </p>
              </div>
            `,
          }),
        });
      }
    }

    // Siempre 200 para no revelar si el email existe
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('[/api/auth/forgot-password]', err);
    return res.status(200).json({ ok: true }); // No revelar errores internos
  } finally {
    await sql.end();
  }
};

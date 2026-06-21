/**
 * POST /api/auth/forgot-password
 * Genera token de recuperación y envía correo con Resend.
 * Por seguridad SIEMPRE responde 200 aunque el correo no exista.
 */
const postgres = require('postgres');
const crypto   = require('crypto');

const RESEND_API_KEY = process.env.RESEND_API_KEY;
// APP_URL: URL pública de la app en Vercel
const APP_URL    = (process.env.EXPO_PUBLIC_API_URL ?? '').replace(/\/$/, '') || 'https://costainteligente1.vercel.app';
// Con plan Resend gratuito SIN dominio verificado, el from debe ser onboarding@resend.dev
// y solo puede enviar al correo con el que te registraste en Resend.
// Una vez que verifiques tu dominio en Resend, cambia esto a noreply@tudominio.com
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? 'onboarding@resend.dev';

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
    console.log(`[forgot-password] Solicitud para: ${email}`);
    console.log(`[forgot-password] RESEND_API_KEY configurada: ${!!RESEND_API_KEY}`);
    console.log(`[forgot-password] APP_URL: ${APP_URL}`);
    console.log(`[forgot-password] FROM_EMAIL: ${FROM_EMAIL}`);

    // Buscar si el usuario existe
    const users = await sql`SELECT id FROM users WHERE email = ${email.toLowerCase().trim()} LIMIT 1`;
    console.log(`[forgot-password] Usuario encontrado: ${users.length > 0}`);

    if (users.length > 0) {
      const userId  = users[0].id;
      const token   = crypto.randomBytes(32).toString('hex');
      const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

      // Crear tabla si no existe
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
      console.log(`[forgot-password] Token generado y guardado`);

      if (!RESEND_API_KEY) {
        console.error('[forgot-password] ERROR: RESEND_API_KEY no está configurada en las variables de entorno de Vercel');
        // Aún así devolvemos 200 al cliente
        return res.status(200).json({ ok: true });
      }

      const resetUrl = `${APP_URL}/auth/reset-password?token=${token}`;
      console.log(`[forgot-password] Enviando correo a: ${email}, reset URL: ${resetUrl}`);

      const emailRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from:    `Costa Inteligente <${FROM_EMAIL}>`,
          to:      [email.toLowerCase().trim()],
          subject: 'Restablecer tu contraseña — Costa Inteligente',
          html: `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F1F5F9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px">
    <tr><td align="center">
      <table width="100%" style="max-width:520px;background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)">
        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#0F172A,#0F766E);padding:32px 24px;text-align:center">
            <div style="width:72px;height:72px;background:rgba(255,255,255,0.15);border-radius:16px;margin:0 auto 16px;display:flex;align-items:center;justify-content:center;font-size:36px">🐟</div>
            <h1 style="margin:0;color:#fff;font-size:22px;font-weight:800;letter-spacing:-0.5px">Costa Inteligente</h1>
            <p style="margin:6px 0 0;color:rgba(255,255,255,0.75);font-size:13px">Zihuatanejo · Pesca y turismo</p>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:32px 24px">
            <h2 style="margin:0 0 12px;color:#0F172A;font-size:20px;font-weight:800">Restablecer contraseña</h2>
            <p style="margin:0 0 24px;color:#64748B;font-size:15px;line-height:1.6">
              Recibimos una solicitud para restablecer la contraseña de tu cuenta. Si fuiste tú, haz clic en el botón de abajo.
            </p>
            <!-- Botón -->
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td align="center" style="padding-bottom:24px">
                  <a href="${resetUrl}"
                     style="display:inline-block;background:#0F766E;color:#fff;font-weight:800;font-size:15px;padding:14px 36px;border-radius:12px;text-decoration:none;letter-spacing:0.2px">
                    Restablecer mi contraseña
                  </a>
                </td>
              </tr>
            </table>
            <!-- Aviso -->
            <div style="background:#F8FAFC;border-radius:12px;border:1px solid #E2E8F0;padding:14px 16px;margin-bottom:20px">
              <p style="margin:0;color:#64748B;font-size:13px;line-height:1.6">
                ⏱ Este enlace <strong>expira en 1 hora</strong>.<br>
                🔒 Si no solicitaste este cambio, ignora este correo — tu contraseña no cambiará.
              </p>
            </div>
            <!-- Link alternativo -->
            <p style="margin:0;color:#94A3B8;font-size:12px;line-height:1.6">
              ¿El botón no funciona? Copia y pega este enlace en tu navegador:<br>
              <a href="${resetUrl}" style="color:#0F766E;word-break:break-all">${resetUrl}</a>
            </p>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="background:#F8FAFC;border-top:1px solid #E2E8F0;padding:16px 24px;text-align:center">
            <p style="margin:0;color:#CBD5E1;font-size:11px">
              Costa Inteligente · Zihuatanejo, Guerrero<br>
              soporte@costainteligente.mx
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
        }),
      });

      const emailData = await emailRes.json();
      if (!emailRes.ok) {
        console.error('[forgot-password] Error de Resend:', JSON.stringify(emailData));
      } else {
        console.log('[forgot-password] Correo enviado exitosamente. ID:', emailData.id);
      }
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('[forgot-password] Error inesperado:', err);
    return res.status(200).json({ ok: true });
  } finally {
    await sql.end();
  }
};

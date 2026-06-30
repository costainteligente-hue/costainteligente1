const postgres = require('postgres');
const crypto   = require('node:crypto');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const {
    email, password, businessName, rfc, phone, address,
    // New fields
    services,    // array of service IDs
    photoUrl,    // main business photo URL (optional)
    description, // business description (optional)
    latitude,    // GPS lat (optional)
    longitude,   // GPS lon (optional)
  } = req.body ?? {};

  if (!email || !password || !businessName || !rfc || !phone || !address)
    return res.status(400).json({ error: 'Todos los campos son requeridos' });

  const sql = postgres(process.env.DATABASE_URL, { ssl: 'require', max: 1 });

  try {
    // Check duplicate email
    const existing = await sql`SELECT id FROM users WHERE email = ${email.toLowerCase().trim()}`;
    if (existing.length > 0)
      return res.status(409).json({ error: 'Este correo ya está registrado.' });

    const userId = crypto.randomUUID();
    const salt   = crypto.randomUUID();
    const hash   = crypto.createHash('sha256').update(`${salt}:${password}`).digest('hex');
    const passwordHash = `${salt}$${hash}`;

    // Build service_type from selected services array
    const serviceType = Array.isArray(services) && services.length > 0
      ? services.join(',')
      : 'general';

    // Build metadata JSON with extra fields
    const metadata = JSON.stringify({
      description:  description?.trim() ?? '',
      photoUrl:     photoUrl?.trim() ?? '',
      latitude:     latitude ?? null,
      longitude:    longitude ?? null,
      services:     Array.isArray(services) ? services : [],
    });

    // Create user
    await sql`
      INSERT INTO users (id, email, password_hash, email_verified, created_at, updated_at)
      VALUES (${userId}, ${email.toLowerCase().trim()}, ${passwordHash}, false, NOW(), NOW())`;

    // Create profile with role = provider, store avatar if provided
    await sql`
      INSERT INTO profiles (id, role, full_name, avatar_url, created_at, updated_at)
      VALUES (${userId}, 'provider', ${businessName.trim()}, ${photoUrl?.trim() || null}, NOW(), NOW())`;

    // Create provider record — status pending, include metadata
    await sql`
      INSERT INTO providers (id, user_id, business_name, service_type, rfc, phone, address, status, metadata, created_at, updated_at)
      VALUES (
        ${crypto.randomUUID()}, ${userId},
        ${businessName.trim()}, ${serviceType},
        ${rfc.toUpperCase().trim()}, ${phone.trim()}, ${address.trim()},
        'pending', ${metadata}, NOW(), NOW()
      )`;

    return res.status(201).json({ success: true, userId });
  } catch (err) {
    console.error('[/api/auth/register-provider]', err);
    return res.status(500).json({ error: 'Error interno: ' + err.message });
  } finally {
    await sql.end();
  }
};

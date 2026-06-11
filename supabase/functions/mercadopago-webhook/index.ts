import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { createHmac } from 'https://deno.land/std@0.208.0/crypto/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function validateSignature(req: Request, secret: string): Promise<boolean> {
  try {
    const xSignature = req.headers.get('x-signature') ?? '';
    const xRequestId = req.headers.get('x-request-id') ?? '';
    const urlObj = new URL(req.url);
    const dataId = urlObj.searchParams.get('data.id') ?? '';

    // MP signature format: ts=<timestamp>,v1=<hash>
    const parts: Record<string, string> = {};
    xSignature.split(',').forEach((part) => {
      const [k, v] = part.split('=');
      if (k && v) parts[k.trim()] = v.trim();
    });

    const ts = parts['ts'] ?? '';
    const v1 = parts['v1'] ?? '';
    const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;

    const key = new TextEncoder().encode(secret);
    const msg = new TextEncoder().encode(manifest);
    const hmac = createHmac('sha256', key);
    hmac.update(msg);
    const computed = Array.from(new Uint8Array(await hmac.digest()))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');

    return computed === v1;
  } catch {
    return false;
  }
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const webhookSecret = Deno.env.get('MP_WEBHOOK_SECRET') ?? '';
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  try {
    // Validate HMAC signature (req 17.7)
    const valid = await validateSignature(req, webhookSecret);
    if (!valid && webhookSecret) {
      // Log invalid attempt to audit_logs
      await supabase.from('audit_logs').insert({
        admin_id: '00000000-0000-0000-0000-000000000000',
        action: 'invalid_mp_webhook',
        description: 'Webhook signature validation failed.',
      });
      return new Response(JSON.stringify({ error: 'Invalid signature' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();
    const { action, data } = body;

    // Only process payment events
    if (action !== 'payment.created' && action !== 'payment.updated') {
      return new Response(JSON.stringify({ received: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const paymentId = String(data?.id);

    // Idempotency check (req 17.3): if payment already processed, return 200
    const { data: existing } = await supabase
      .from('payments')
      .select('id')
      .eq('mp_payment_id', paymentId)
      .single();

    if (existing) {
      return new Response(JSON.stringify({ received: true, idempotent: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch payment details from MP API
    const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: { Authorization: `Bearer ${Deno.env.get('MP_ACCESS_TOKEN')}` },
    });
    const payment = await mpRes.json();

    const reservationId = payment.external_reference;
    const status = payment.status; // 'approved' | 'rejected' | 'pending'
    const paymentStatus = status === 'approved' ? 'paid' : status === 'rejected' ? 'failed' : 'pending';

    // Insert payment record
    await supabase.from('payments').insert({
      reservation_id: reservationId,
      mp_payment_id: paymentId,
      mp_preference_id: payment.preference_id,
      amount: payment.transaction_amount,
      currency: 'MXN',
      status: paymentStatus,
      processed_at: new Date().toISOString(),
    });

    // Update reservation payment_status
    await supabase
      .from('reservations')
      .update({ payment_status: paymentStatus })
      .eq('id', reservationId);

    // Send push notification on failure (req 17.6)
    if (paymentStatus === 'failed') {
      const { data: reservation } = await supabase
        .from('reservations')
        .select('client_id, provider_id')
        .eq('id', reservationId)
        .single();

      if (reservation) {
        await supabase.functions.invoke('send-push-notification', {
          body: {
            title: 'Pago no procesado',
            body: `El pago de la reservación no pudo procesarse. Intenta de nuevo desde el detalle de tu reservación.`,
            userIds: [reservation.client_id],
          },
        });
      }
    }

    return new Response(JSON.stringify({ received: true, status: paymentStatus }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

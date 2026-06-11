import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const payloadSchema = z.object({
  reservationId: z.string().uuid(),
  amount: z.number().positive(),
  serviceName: z.string().min(1),
  clientEmail: z.string().email(),
});

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body = await req.json();

    // Validate input with Zod (req 24.5)
    const parsed = payloadSchema.safeParse(body);
    if (!parsed.success) {
      return new Response(
        JSON.stringify({ error: parsed.error.flatten() }),
        { status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const { reservationId, amount, serviceName, clientEmail } = parsed.data;
    const mpAccessToken = Deno.env.get('MP_ACCESS_TOKEN');

    if (!mpAccessToken) {
      throw new Error('MP_ACCESS_TOKEN no configurado.');
    }

    const preference = {
      items: [
        {
          title: serviceName,
          quantity: 1,
          unit_price: amount,
          currency_id: 'MXN',
        },
      ],
      payer: { email: clientEmail },
      external_reference: reservationId,
      notification_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/mercadopago-webhook`,
      back_urls: {
        success: 'costainteligente://payment/success',
        failure: 'costainteligente://payment/failure',
        pending: 'costainteligente://payment/pending',
      },
      auto_return: 'approved',
    };

    const res = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${mpAccessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(preference),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Mercado Pago error: ${res.status} — ${errText}`);
    }

    const data = await res.json();

    return new Response(
      JSON.stringify({
        checkoutUrl: data.init_point,
        preferenceId: data.id,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});

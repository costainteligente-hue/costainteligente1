import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

interface PushPayload {
  title: string;
  body: string;
  userIds?: string[];     // if empty → send to all
  data?: Record<string, unknown>;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const payload: PushPayload = await req.json();
    const { title, body, userIds, data } = payload;

    if (!title || !body) {
      return new Response(
        JSON.stringify({ error: 'title y body son obligatorios.' }),
        { status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Fetch tokens
    let query = supabase.from('push_tokens').select('token, user_id');
    if (userIds && userIds.length > 0) {
      query = query.in('user_id', userIds);
    }
    const { data: tokens, error } = await query;
    if (error) throw error;

    if (!tokens || tokens.length === 0) {
      return new Response(
        JSON.stringify({ sent: 0, message: 'No hay tokens registrados.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const messages = tokens.map((t: { token: string }) => ({
      to: t.token,
      title,
      body,
      sound: 'default',
      data: data ?? {},
    }));

    const invalidTokens: string[] = [];
    const BATCH = 100;

    for (let i = 0; i < messages.length; i += BATCH) {
      const batch = messages.slice(i, i + BATCH);
      const res = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(batch),
      });
      const result = await res.json();

      // Collect invalid tokens
      if (Array.isArray(result.data)) {
        result.data.forEach((r: { status: string; details?: { error?: string } }, idx: number) => {
          if (r.details?.error === 'DeviceNotRegistered') {
            invalidTokens.push(batch[idx].to);
          }
        });
      }
    }

    // Clean up invalid tokens
    if (invalidTokens.length > 0) {
      await supabase.from('push_tokens').delete().in('token', invalidTokens);
    }

    return new Response(
      JSON.stringify({ sent: messages.length, invalidRemoved: invalidTokens.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});

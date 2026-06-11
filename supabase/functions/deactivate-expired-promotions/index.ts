import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Cron job: runs daily at 00:01 CDMX (06:01 UTC)
// Set in supabase/config.toml:
//   [functions.deactivate-expired-promotions]
//   schedule = "1 6 * * *"

serve(async (_req: Request) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

  const { data, error } = await supabase
    .from('promotions')
    .update({ status: 'inactive' })
    .lt('end_date', today)
    .eq('status', 'active')
    .select('id, title');

  if (error) {
    console.error('[deactivate-expired-promotions] Error:', error.message);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  console.log(`[deactivate-expired-promotions] Deactivated ${data?.length ?? 0} promotions.`);
  return new Response(
    JSON.stringify({ deactivated: data?.length ?? 0, promotions: data }),
    { headers: { 'Content-Type': 'application/json' } },
  );
});

import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';

const ZIHUATANEJO_LAT = 17.6392;
const ZIHUATANEJO_LON = -101.5507;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const url =
      `https://api.open-meteo.com/v1/forecast` +
      `?latitude=${ZIHUATANEJO_LAT}` +
      `&longitude=${ZIHUATANEJO_LON}` +
      `&current=temperature_2m,weathercode,windspeed_10m,relativehumidity_2m` +
      `&hourly=wave_height` +
      `&timezone=America%2FMexico_City` +
      `&forecast_days=1`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Open-Meteo API error: ${response.status}`);
    }

    const data = await response.json();

    return new Response(JSON.stringify(data), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=3600', // 60 min cache
      },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'No se pudo obtener el clima. Intenta de nuevo.' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  }
});

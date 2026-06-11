import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface WeatherData {
  temperature: number;
  weathercode: number;
  windspeed: number;
}

async function fetchWeather(): Promise<WeatherData> {
  const { data, error } = await supabase.functions.invoke('get-weather');
  if (error) throw error;
  const current = data?.current;
  return {
    temperature: current?.temperature_2m ?? 0,
    weathercode: current?.weathercode ?? 0,
    windspeed: current?.windspeed_10m ?? 0,
  };
}

export function useWeather() {
  return useQuery({
    queryKey: ['weather', 'zihuatanejo'],
    queryFn: fetchWeather,
    staleTime: 1000 * 60 * 60,      // 60 minutes
    gcTime: 1000 * 60 * 60 * 2,
    retry: 2,
  });
}

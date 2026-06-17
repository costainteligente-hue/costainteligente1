/**
 * useWeather — Costa Inteligente
 * Datos meteorológicos de Zihuatanejo via Open-Meteo (API pública gratuita).
 * https://open-meteo.com/
 */

import { useQuery } from '@tanstack/react-query';
import { ZIHUATANEJO } from '@/lib/constants';

export interface WeatherData {
  temperature: number;
  weathercode: number;
  windspeed: number;
}

async function fetchWeather(): Promise<WeatherData> {
  const { latitude, longitude } = ZIHUATANEJO;
  const url =
    `https://api.open-meteo.com/v1/forecast` +
    `?latitude=${latitude}&longitude=${longitude}` +
    `&current=temperature_2m,weathercode,windspeed_10m` +
    `&timezone=America%2FMexico_City`;

  const response = await fetch(url);
  if (!response.ok) throw new Error(`Weather API error: ${response.status}`);

  const data = await response.json();
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
    staleTime: 1000 * 60 * 60,
    gcTime: 1000 * 60 * 60 * 2,
    retry: 2,
  });
}

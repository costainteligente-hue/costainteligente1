import React from 'react';
import { View, Text } from 'react-native';

function getPillColors(status: string): { bg: string; border: string; text: string } {
  const s = status.toLowerCase().trim();

  const isGreen =
    s.includes('verificad') || s.includes('aceptad') || s.includes('aprobad') ||
    s.includes('activo') || s.includes('confirmad') || s.includes('completad') ||
    s.includes('pagado') || s.includes('respondida');

  const isOrange =
    s.includes('pendiente') || s.includes('solicitud') || s.includes('espera') ||
    s.includes('revisión') || s.includes('sin responder');

  const isRed =
    s.includes('rechaz') || s.includes('cancel') || s.includes('no disponible') ||
    s.includes('pausad') || s.includes('error') || s.includes('fallido');

  const isBlue =
    s.includes('guardado') || s.includes('borrador') || s.includes('programad');

  const isPurple =
    s.includes('promoción') || s.includes('descuento') || s.includes('destacado');

  if (isGreen) return { bg: '#DCFCE7', border: '#16A34A', text: '#166534' };
  if (isOrange) return { bg: '#FFEDD5', border: '#EA580C', text: '#9A3412' };
  if (isRed) return { bg: '#FEE2E2', border: '#DC2626', text: '#991B1B' };
  if (isBlue) return { bg: '#DBEAFE', border: '#2563EB', text: '#1D4ED8' };
  if (isPurple) return { bg: '#EDE9FE', border: '#7C3AED', text: '#5B21B6' };
  return { bg: '#CCFBF1', border: '#0F766E', text: '#134E4A' };
}

interface Props {
  status: string;
}

export function StatusPill({ status }: Props) {
  const { bg, border, text } = getPillColors(status);
  return (
    <View
      style={{ backgroundColor: bg, borderColor: border, borderWidth: 1 }}
      className="rounded-full px-2.5 py-1 self-start"
    >
      <Text style={{ color: text }} className="text-xs font-bold">
        {status}
      </Text>
    </View>
  );
}

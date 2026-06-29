import React from 'react';
import { View, Text } from 'react-native';

const C = {
  green:  '#16a34a',
  orange: '#ea580c',
  red:    '#dc2626',
  blue:   '#2563eb',
  purple: '#7c3aed',
  yellow: '#ca8a04',
  ocean:  '#0f766e',
};

function getPillColor(status: string): string {
  const s = status.toLowerCase().trim();
  const rating = parseFloat(s);
  if (!isNaN(rating)) {
    if (rating >= 4.5) return C.yellow;
    if (rating >= 3.5) return C.green;
    if (rating >= 2.5) return C.orange;
    return C.red;
  }
  if (/(verificado|aceptado|aprobado|activo|confirmad|completad|pagado|respondida|foto recibida|foto cargada|visible|principal|listo|finaliz)/.test(s)) return C.green;
  if (/(pendiente|solicitud|solicitad|sin responder|espera|revisión|revision|obligatorio|comprobante)/.test(s)) return C.orange;
  if (/(no disponible|pausad|bloquead|rechaz|cancel|error|conflicto|report|vencid|fallid)/.test(s)) return C.red;
  if (/(guardado|programad|configurad|borrador)/.test(s)) return C.blue;
  if (/(promoción|promocion|descuento|destacado)/.test(s)) return C.purple;
  return C.ocean;
}

interface Props {
  status: string;
}

/** Equivalent to .pill in PWA */
export function StatusPill({ status }: Props) {
  const color = getPillColor(status);
  return (
    <View
      style={{
        backgroundColor: `${color}20`,
        borderColor: `${color}40`,
        borderWidth: 1,
        borderRadius: 999,
        paddingHorizontal: 10,
        paddingVertical: 7,
        alignSelf: 'flex-start',
        minHeight: 28,
        justifyContent: 'center',
      }}
    >
      <Text style={{ color, fontSize: 11, fontWeight: '800', lineHeight: 13 }}>
        {status}
      </Text>
    </View>
  );
}

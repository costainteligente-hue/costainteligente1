/**
 * VerificationScreen — fiel al PWA
 * 8 pasos con pill "Pendiente" + caja CONAPESCA + infoBox
 */
import React from 'react';
import { ScrollView, View, Text } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '@/lib/constants';
import { CardBox } from '@/components/ui/CardBox';
import { HeaderCard } from '@/components/ui/HeaderCard';
import { InfoBox } from '@/components/ui/InfoBox';
import { StatusPill } from '@/components/ui/StatusPill';

const STEPS = [
  { title: 'Correo electrónico',        subtitle: 'Confirmación de correo de la cuenta responsable.',                                                            icon: 'email'           as const },
  { title: 'Número telefónico',          subtitle: 'Confirmación por teléfono o WhatsApp para avisos de reservas.',                                               icon: 'phone'           as const },
  { title: 'Identificación oficial',     subtitle: 'INE o identificación del responsable legal del servicio.',                                                    icon: 'badge'           as const },
  { title: 'Capitanía de Puerto',        subtitle: 'Certificado de seguridad y certificado de matrícula cuando exista embarcación.',                              icon: 'directions-boat' as const },
  { title: 'CONAPESCA',                  subtitle: 'Permiso de pesca vigente para servicios que ofrecen captura o pesca deportivo-recreativa.',                   icon: 'set-meal'        as const },
  { title: 'Turismo náutico y seguros',  subtitle: 'Permiso de turismo náutico y pólizas para pasajeros, tripulación y terceros.',                                icon: 'sailing'         as const },
  { title: 'Licencia de funcionamiento', subtitle: 'Licencia del negocio para restaurante, tienda de pesca o pescadería.',                                        icon: 'storefront'      as const },
  { title: 'Ubicación real',             subtitle: 'Ubicación del negocio, muelle, punto de salida o punto de reunión.',                                          icon: 'place'           as const },
];

const CONAPESCA = [
  'El permiso de pesca deportivo-recreativa es individual y aplica para la persona que realizará la actividad.',
  'Los servicios de pesca deben capturar y mostrar nombre completo de cada participante antes de confirmar la salida.',
  'Las especies como marlín, pez vela, pez espada, sábalo o chiro, pez gallo y dorado se tratan como especies reservadas para pesca deportivo-recreativa en la franja aplicable.',
  'Las capturas de pesca deportivo-recreativa no deben registrarse como producto comercial dentro de la app.',
  'La app debe dejar evidencia de permiso, fecha, hora, zona, embarcación y responsable para facilitar revisión administrativa.',
];

export default function VerificationScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 100 }}>
        <HeaderCard
          title="Verificación del proveedor"
          subtitle="Revisión previa para publicar embarcaciones, pesca, turismo náutico y negocios físicos."
          icon="verified-user"
          color={COLORS.caution}
        />

        {/* 8 step cards */}
        {STEPS.map((s) => (
          <CardBox key={s.title}>
            {/* list-item: auto | 1fr | auto */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{ width: 48, height: 48, borderRadius: 999, backgroundColor: `${COLORS.caution}20`, alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <MaterialIcons name={s.icon} size={24} color={COLORS.caution} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: '900', color: '#0F172A', fontSize: 15 }}>{s.title}</Text>
                <Text style={{ color: 'rgba(15,23,42,0.62)', fontSize: 13, marginTop: 2, lineHeight: 18 }}>{s.subtitle}</Text>
              </View>
              <StatusPill status="Pendiente" />
            </View>
          </CardBox>
        ))}

        {/* CONAPESCA box — list-item con avatar § + bullets */}
        <CardBox>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
            <View style={{ width: 48, height: 48, borderRadius: 999, backgroundColor: `${COLORS.ocean}20`, alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <MaterialIcons name="article" size={24} color={COLORS.ocean} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: '900', color: '#0F172A', fontSize: 15, marginBottom: 10 }}>Puntos CONAPESCA para revisión</Text>
              {CONAPESCA.map((pt, i) => (
                <View key={i} style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
                  <MaterialIcons name="check-circle-outline" size={14} color={COLORS.ocean} style={{ marginTop: 3 }} />
                  <Text style={{ flex: 1, color: 'rgba(15,23,42,0.62)', fontSize: 13, lineHeight: 19 }}>{pt}</Text>
                </View>
              ))}
            </View>
          </View>
        </CardBox>

        <InfoBox text="Los documentos deben subirse en foto. Administración debe validar que el documento corresponda al proveedor, servicio, embarcación o negocio registrado antes de publicarlo al usuario." />
      </ScrollView>
    </SafeAreaView>
  );
}

/**
 * VerificationScreen — Proveedor
 * Checklist de documentos y requisitos para publicar servicios
 */
import React from 'react';
import { ScrollView, View, Text, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '@/lib/constants';
import { CardBox } from '@/components/ui/CardBox';
import { HeaderCard } from '@/components/ui/HeaderCard';
import { InfoBox } from '@/components/ui/InfoBox';
import { StatusPill } from '@/components/ui/StatusPill';

const VERIFICATION_STEPS = [
  { title: 'Correo electrónico', subtitle: 'Confirmación de correo de la cuenta responsable.', icon: 'email' as const },
  { title: 'Número telefónico', subtitle: 'Confirmación por teléfono o WhatsApp para avisos de reservas.', icon: 'phone' as const },
  { title: 'Identificación oficial', subtitle: 'INE o identificación del responsable legal del servicio.', icon: 'badge' as const },
  { title: 'Capitanía de Puerto', subtitle: 'Certificado de seguridad y certificado de matrícula cuando exista embarcación.', icon: 'directions-boat' as const },
  { title: 'CONAPESCA', subtitle: 'Permiso de pesca vigente para servicios que ofrecen captura o pesca deportivo-recreativa.', icon: 'set-meal' as const },
  { title: 'Turismo náutico y seguros', subtitle: 'Permiso de turismo náutico y pólizas para pasajeros, tripulación y terceros.', icon: 'sailing' as const },
  { title: 'Licencia de funcionamiento', subtitle: 'Licencia del negocio para restaurante, tienda de pesca o pescadería.', icon: 'storefront' as const },
  { title: 'Ubicación real', subtitle: 'Ubicación del negocio, muelle, punto de salida o punto de reunión.', icon: 'place' as const },
];

const CONAPESCA_POINTS = [
  'El permiso de pesca deportivo-recreativa es individual y aplica para la persona que realizará la actividad.',
  'Los servicios de pesca deben capturar y mostrar nombre completo de cada participante antes de confirmar la salida.',
  'Las especies como marlín, pez vela, pez espada, sábalo, pez gallo y dorado se tratan como especies reservadas para pesca deportivo-recreativa.',
  'Las capturas de pesca deportivo-recreativa no deben registrarse como producto comercial dentro de la app.',
  'La app debe dejar evidencia de permiso, fecha, hora, zona, embarcación y responsable para facilitar revisión administrativa.',
];

export default function ProviderVerificationScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        <HeaderCard
          title="Verificación del proveedor"
          subtitle="Revisión previa para publicar embarcaciones, pesca, turismo náutico y negocios físicos."
          icon="verified-user"
          color={COLORS.warning}
        />

        {/* Pasos */}
        {VERIFICATION_STEPS.map((step) => (
          <CardBox key={step.title}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: `${COLORS.warning}18`, alignItems: 'center', justifyContent: 'center' }}>
                <MaterialIcons name={step.icon} size={22} color={COLORS.warning} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: '800', color: '#0F172A', fontSize: 14 }}>{step.title}</Text>
                <Text style={{ color: '#64748B', fontSize: 12, marginTop: 2 }}>{step.subtitle}</Text>
              </View>
              <StatusPill status="Pendiente" />
            </View>
          </CardBox>
        ))}

        {/* Puntos CONAPESCA */}
        <CardBox>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
            <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: `${COLORS.ocean}15`, alignItems: 'center', justifyContent: 'center' }}>
              <MaterialIcons name="article" size={22} color={COLORS.ocean} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: '800', color: '#0F172A', fontSize: 14, marginBottom: 10 }}>
                Puntos CONAPESCA para revisión
              </Text>
              {CONAPESCA_POINTS.map((point, i) => (
                <View key={i} style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
                  <MaterialIcons name="check-circle" size={14} color={COLORS.ocean} style={{ marginTop: 2 }} />
                  <Text style={{ color: '#64748B', fontSize: 12, lineHeight: 18, flex: 1 }}>{point}</Text>
                </View>
              ))}
            </View>
          </View>
        </CardBox>

        <InfoBox text="Los documentos deben subirse en foto. Administración validará que el documento corresponda al proveedor, servicio, embarcación o negocio registrado antes de publicarlo al usuario." />
      </ScrollView>
    </SafeAreaView>
  );
}

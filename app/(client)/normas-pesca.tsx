import React, { useState } from 'react';
import { ScrollView, View, Text, TouchableOpacity, Linking } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '@/lib/constants';
import { CardBox } from '@/components/ui/CardBox';
import { InfoBox } from '@/components/ui/InfoBox';

// ─── Sección colapsable ───────────────────────────────────────────────────────
function Section({
  icon, title, color, children,
}: {
  icon: keyof typeof MaterialIcons.glyphMap;
  title: string;
  color: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(true);
  return (
    <CardBox>
      <TouchableOpacity
        onPress={() => setOpen((v) => !v)}
        style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: open ? 12 : 0 }}
      >
        <View style={{
          width: 40, height: 40, borderRadius: 12,
          backgroundColor: `${color}20`, alignItems: 'center', justifyContent: 'center',
        }}>
          <MaterialIcons name={icon} size={22} color={color} />
        </View>
        <Text style={{ flex: 1, fontWeight: '800', color: '#0F172A', fontSize: 15 }}>{title}</Text>
        <MaterialIcons name={open ? 'expand-less' : 'expand-more'} size={22} color="#94A3B8" />
      </TouchableOpacity>
      {open && children}
    </CardBox>
  );
}

// ─── Fila de regla ────────────────────────────────────────────────────────────
function Rule({
  icon, text, color = COLORS.ocean,
}: {
  icon: keyof typeof MaterialIcons.glyphMap;
  text: string;
  color?: string;
}) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 10 }}>
      <MaterialIcons name={icon} size={18} color={color} style={{ marginTop: 1 }} />
      <Text style={{ flex: 1, color: '#0F172A', fontSize: 13, lineHeight: 20 }}>{text}</Text>
    </View>
  );
}

// ─── Badge de veda ────────────────────────────────────────────────────────────
function VedaBadge({ especie, periodo, status }: { especie: string; periodo: string; status: 'activa' | 'proxima' | 'inactiva' }) {
  const colors = { activa: COLORS.danger, proxima: COLORS.warning, inactiva: COLORS.success };
  const labels = { activa: 'EN VEDA', proxima: 'PRÓXIMA', inactiva: 'Abierta' };
  const c = colors[status];
  return (
    <View style={{
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
    }}>
      <View>
        <Text style={{ fontWeight: '800', color: '#0F172A', fontSize: 14 }}>{especie}</Text>
        <Text style={{ color: '#94A3B8', fontSize: 12 }}>{periodo}</Text>
      </View>
      <View style={{ backgroundColor: `${c}20`, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: `${c}40` }}>
        <Text style={{ color: c, fontWeight: '800', fontSize: 11 }}>{labels[status]}</Text>
      </View>
    </View>
  );
}

// ─── Pantalla principal ────────────────────────────────────────────────────────
export default function NormasPescaScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>

        {/* Hero */}
        <LinearGradient
          colors={['#0F172A', '#0F766E']}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={{ borderRadius: 20, padding: 22, marginBottom: 16 }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 12 }}>
            <MaterialIcons name="gavel" size={36} color="#fff" />
            <View>
              <Text style={{ color: '#fff', fontSize: 22, fontWeight: '800' }}>Normas de Pesca</Text>
              <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: 13 }}>
                México · CONAPESCA · DOF
              </Text>
            </View>
          </View>
          <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13, lineHeight: 20 }}>
            La pesca deportiva y recreativa en México está regulada por la Ley General de Pesca y Acuacultura Sustentables (LGPAS) y la CONAPESCA. Conoce tus obligaciones antes de salir a pescar.
          </Text>
        </LinearGradient>

        {/* Licencia de pesca */}
        <Section icon="badge" title="Licencia de Pesca Deportiva" color={COLORS.ocean}>
          <View style={{
            backgroundColor: `${COLORS.danger}10`, borderRadius: 12, padding: 12,
            flexDirection: 'row', gap: 8, marginBottom: 12,
            borderWidth: 1, borderColor: `${COLORS.danger}30`,
          }}>
            <MaterialIcons name="error-outline" size={20} color={COLORS.danger} style={{ marginTop: 1 }} />
            <Text style={{ flex: 1, color: COLORS.danger, fontWeight: '700', fontSize: 13, lineHeight: 19 }}>
              Es obligatorio contar con licencia de pesca deportiva para pescar en aguas marinas y continentales de México.
            </Text>
          </View>
          <Rule icon="check-circle" text="La licencia se obtiene en las oficinas de la CONAPESCA, delegaciones, o en línea en conapesca.gob.mx." />
          <Rule icon="check-circle" text="Existen licencias anuales, semestrales y por 7 días. El costo varía por tipo y duración." />
          <Rule icon="check-circle" text="La licencia es personal e intransferible. Debe portarse durante la actividad de pesca." />
          <Rule icon="check-circle" text="Los menores de 16 años pueden pescar sin licencia cuando acompañan a un adulto con licencia vigente." />
          <Rule icon="check-circle" text="Los turistas extranjeros también están obligados a obtener su licencia antes de pescar." />
          <TouchableOpacity
            onPress={() => Linking.openURL('https://www.conapesca.gob.mx')}
            style={{
              flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8,
              backgroundColor: `${COLORS.ocean}12`, borderRadius: 10,
              padding: 10, alignSelf: 'flex-start',
            }}
          >
            <MaterialIcons name="open-in-new" size={16} color={COLORS.ocean} />
            <Text style={{ color: COLORS.ocean, fontWeight: '800', fontSize: 13 }}>
              Tramitar en conapesca.gob.mx
            </Text>
          </TouchableOpacity>
        </Section>

        {/* Límites de captura */}
        <Section icon="set-meal" title="Límites de Captura Deportiva" color={COLORS.success}>
          <Rule icon="info-outline" text="La pesca deportiva tiene límites máximos de captura por especie y por día. Excederlos es una infracción." color={COLORS.info} />
          {[
            { especie: 'Pez Vela / Marlín', limite: '1 ejemplar por embarcación por día (catch & release recomendado)' },
            { especie: 'Dorado (Mahi-mahi)', limite: 'Máximo 20 kg por pescador por día' },
            { especie: 'Atún Aleta Amarilla', limite: 'Máximo 2 ejemplares por embarcación' },
            { especie: 'Huachinango / Robalo', limite: 'Máximo 10 kg por pescador por día' },
            { especie: 'Sierra / Wahoo', limite: 'Máximo 10 kg por pescador por día' },
          ].map((item) => (
            <View key={item.especie} style={{
              flexDirection: 'row', alignItems: 'flex-start', gap: 10,
              paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
            }}>
              <MaterialIcons name="phishing" size={18} color={COLORS.success} style={{ marginTop: 2 }} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: '800', color: '#0F172A', fontSize: 13 }}>{item.especie}</Text>
                <Text style={{ color: '#64748B', fontSize: 12, lineHeight: 18 }}>{item.limite}</Text>
              </View>
            </View>
          ))}
        </Section>

        {/* Vedas activas */}
        <Section icon="block" title="Vedas en Zihuatanejo / Guerrero" color={COLORS.danger}>
          <Rule icon="warning" text="Pescar una especie durante su período de veda puede resultar en multas de hasta $200,000 MXN y decomiso del equipo." color={COLORS.danger} />
          <VedaBadge especie="Tortuga Marina (todas las especies)" periodo="Todo el año · Protección permanente" status="activa" />
          <VedaBadge especie="Camarón (aguas marinas)" periodo="15 Abril – 15 Agosto (aprox.)" status="proxima" />
          <VedaBadge especie="Tiburón Martillo" periodo="Todo el año · Especie amenazada" status="activa" />
          <VedaBadge especie="Langosta de roca" periodo="1 Marzo – 30 Junio" status="inactiva" />
          <VedaBadge especie="Pez Sierra (Scomberomorus)" periodo="1 Mayo – 31 Julio (aprox.)" status="inactiva" />
          <InfoBox text="Las fechas de veda pueden variar anualmente según publicación en el Diario Oficial de la Federación (DOF). Verifica antes de salir." />
        </Section>

        {/* Zonas prohibidas */}
        <Section icon="location-off" title="Zonas Restringidas" color={COLORS.warning}>
          <Rule icon="cancel" text="Áreas Naturales Protegidas (ANP): Parque Nacional Ixtapa y zonas de arrecife. Pesca totalmente prohibida." color={COLORS.danger} />
          <Rule icon="cancel" text="Zona de exclusión de 200 metros alrededor de playas públicas y áreas de natación." color={COLORS.danger} />
          <Rule icon="cancel" text="Zona marina restringida frente a instalaciones militares y portuarias." color={COLORS.danger} />
          <Rule icon="warning" text="La pesca con redes de arrastre, chinchorro y trasmallo está prohibida para la pesca deportiva. Solo artes de línea." color={COLORS.warning} />
        </Section>

        {/* Buenas prácticas */}
        <Section icon="eco" title="Catch & Release / Buenas Prácticas" color={COLORS.success}>
          <Rule icon="favorite" text="Practica el catch & release (captura y liberación) con peces de gran valor deportivo como el pez vela y marlín." color={COLORS.success} />
          <Rule icon="favorite" text="Usa anzuelos sin rebaba (barbless hooks) para facilitar la liberación sin dañar al pez." color={COLORS.success} />
          <Rule icon="favorite" text="No extraigas el pez del agua más de lo necesario. Una foto rápida y devuélvelo." color={COLORS.success} />
          <Rule icon="favorite" text="Respeta las tallas mínimas de captura. Un pez pequeño no se come ni tiene valor deportivo." color={COLORS.success} />
          <Rule icon="favorite" text="No arrojes basura al mar. Lleva bolsas para tus residuos en la embarcación." color={COLORS.success} />
        </Section>

        {/* Multas y sanciones */}
        <Section icon="account-balance" title="Multas y Sanciones" color={COLORS.purple}>
          <Rule icon="gavel" text="Pesca sin licencia: multa de $5,000 a $50,000 MXN." />
          <Rule icon="gavel" text="Exceder límites de captura: multa de $20,000 a $200,000 MXN y decomiso." />
          <Rule icon="gavel" text="Pesca en zona protegida o en veda: suspensión de licencia hasta 3 años." />
          <Rule icon="gavel" text="Captura de especie protegida (tortuga, tiburón ballena): proceso penal federal." />
          <Rule icon="gavel" text="Uso de artes de pesca prohibidas: decomiso del equipo y embarcación." />
        </Section>

        {/* Contactos */}
        <CardBox>
          <Text style={{ fontWeight: '800', color: '#0F172A', fontSize: 15, marginBottom: 12 }}>
            Contactos Oficiales
          </Text>
          {[
            { label: 'CONAPESCA Nacional', sub: 'conapesca.gob.mx · 01 800 214 6900', icon: 'phone' },
            { label: 'PROFEPA (denuncias)', sub: 'profepa.gob.mx · 01 800 737 8000', icon: 'report' },
            { label: 'Capitanía de Puerto Zihuatanejo', sub: '755 554 2030', icon: 'anchor' },
            { label: 'SEMAR Guerrero', sub: '800 201 3100', icon: 'security' },
          ].map((c) => (
            <View key={c.label} style={{
              flexDirection: 'row', alignItems: 'center', gap: 10,
              paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
            }}>
              <MaterialIcons name={c.icon as any} size={20} color={COLORS.ocean} />
              <View>
                <Text style={{ fontWeight: '700', color: '#0F172A', fontSize: 13 }}>{c.label}</Text>
                <Text style={{ color: '#94A3B8', fontSize: 12 }}>{c.sub}</Text>
              </View>
            </View>
          ))}
        </CardBox>

        <InfoBox text="Esta información es de carácter orientativo. Para información oficial y actualizada consulta siempre el Diario Oficial de la Federación (dof.gob.mx) y la CONAPESCA." />
      </ScrollView>
    </SafeAreaView>
  );
}

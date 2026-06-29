/**
 * SettingsScreen — fiel al PWA
 * Apariencia (tema + color dots) + Notificaciones + Seguridad + Soporte + Logout
 */
import React, { useState } from 'react';
import { ScrollView, View, Text, TouchableOpacity, Switch, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { signOut } from '@/lib/services/auth.service';
import { useAuthStore } from '@/stores/authStore';
import { useProviderStore } from '@/stores/providerStore';
import { COLORS } from '@/lib/constants';
import { CardBox } from '@/components/ui/CardBox';
import { HeaderCard } from '@/components/ui/HeaderCard';
import { InfoBox } from '@/components/ui/InfoBox';
import { SegmentTabs } from '@/components/ui/SegmentTabs';

const ACCENT_OPTS = [COLORS.ocean, COLORS.info, COLORS.success, COLORS.purple, COLORS.warning];

// ─── Switch row (equiv .switch-row) ──────────────────────────────────────────
function SwitchRow({ icon, title, subtitle, value, onChange, color = COLORS.ocean }: {
  icon: keyof typeof MaterialIcons.glyphMap; title: string; subtitle: string;
  value: boolean; onChange: (v: boolean) => void; color?: string;
}) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 56, paddingVertical: 6 }}>
      <View style={{ width: 38, height: 38, borderRadius: 999, backgroundColor: `${color}20`, alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <MaterialIcons name={icon} size={18} color={color} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontWeight: '900', color: '#0F172A', fontSize: 15 }}>{title}</Text>
        <Text style={{ color: 'rgba(15,23,42,0.62)', fontSize: 13, marginTop: 2, lineHeight: 18 }}>{subtitle}</Text>
      </View>
      <Switch value={value} onValueChange={onChange}
        trackColor={{ false: 'rgba(15,23,42,0.22)', true: color }}
        thumbColor="#fff" />
    </View>
  );
}

// ─── Nav row (chevron right) ──────────────────────────────────────────────────
function NavRow({ icon, title, subtitle, onPress, color = COLORS.ocean, danger = false }: {
  icon: keyof typeof MaterialIcons.glyphMap; title: string; subtitle: string;
  onPress: () => void; color?: string; danger?: boolean;
}) {
  const c = danger ? COLORS.danger : color;
  return (
    <TouchableOpacity onPress={onPress} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 56, paddingVertical: 6 }}>
      <View style={{ width: 38, height: 38, borderRadius: 999, backgroundColor: `${c}20`, alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <MaterialIcons name={icon} size={18} color={c} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontWeight: '900', color: danger ? COLORS.danger : '#0F172A', fontSize: 15 }}>{title}</Text>
        <Text style={{ color: 'rgba(15,23,42,0.62)', fontSize: 13, marginTop: 2 }}>{subtitle}</Text>
      </View>
      <MaterialIcons name="chevron-right" size={22} color="#CBD5E1" />
    </TouchableOpacity>
  );
}

// ─── Settings group ───────────────────────────────────────────────────────────
function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <CardBox style={{ marginBottom: 12 }}>
      <Text style={{ fontWeight: '900', color: '#0F172A', fontSize: 18, marginBottom: 4 }}>{title}</Text>
      {children}
    </CardBox>
  );
}

export default function SettingsScreen() {
  const router  = useRouter();
  const { clear } = useAuthStore();
  const { confirmBeforeDelete, setConfirmBeforeDelete } = useProviderStore();

  const [themeIdx,   setThemeIdx]   = useState(0); // 0=Claro,1=Oscuro,2=Auto
  const [accent,     setAccent]     = useState(COLORS.ocean);
  const [notifs,     setNotifs]     = useState(true);
  const [resAlerts,  setResAlerts]  = useState(true);
  const [payAlerts,  setPayAlerts]  = useState(true);
  const [chatAlerts, setChatAlerts] = useState(true);
  const [hideSens,   setHideSens]   = useState(false);

  const logout = async () => {
    await signOut(); clear(); router.replace('/auth/login');
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 100 }}>
        <HeaderCard title="Centro de ajustes" subtitle="Controla apariencia, alertas, seguridad y privacidad del panel." icon="settings" color={accent} />

        {/* Apariencia */}
        <Group title="Apariencia">
          <SegmentTabs tabs={['Claro', 'Oscuro', 'Auto']} active={themeIdx} onChange={setThemeIdx} color={accent} />
          <Text style={{ color: 'rgba(15,23,42,0.62)', fontSize: 12, fontWeight: '850', marginBottom: 10, marginTop: 4 }}>Color principal</Text>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            {ACCENT_OPTS.map((c) => (
              <TouchableOpacity key={c} onPress={() => setAccent(c)}
                style={{ width: 44, height: 44, borderRadius: 999, backgroundColor: c, alignItems: 'center', justifyContent: 'center',
                  borderWidth: accent === c ? 3 : 0, borderColor: '#0F172A',
                  shadowColor: c, shadowOffset: { width: 0, height: 5 }, shadowOpacity: accent === c ? 0.35 : 0.15, shadowRadius: 8, elevation: 3 }}>
                {accent === c && <MaterialIcons name="check" size={18} color="#fff" />}
              </TouchableOpacity>
            ))}
          </View>
        </Group>

        {/* Notificaciones */}
        <Group title="Notificaciones">
          <SwitchRow icon="notifications-active" title="Notificaciones generales" subtitle="Alertas de actividad en la cuenta." value={notifs} onChange={setNotifs} color={accent} />
          <SwitchRow icon="event-available" title="Alertas de reservaciones" subtitle="Solicitudes, cambios y confirmaciones." value={resAlerts} onChange={notifs ? setResAlerts : () => {}} color={accent} />
          <SwitchRow icon="payments" title="Alertas de pagos" subtitle="Cobros, comprobantes y pagos pendientes." value={payAlerts} onChange={notifs ? setPayAlerts : () => {}} color={accent} />
          <SwitchRow icon="chat-bubble-outline" title="Mensajes de clientes" subtitle="Conversaciones de reservaciones activas." value={chatAlerts} onChange={notifs ? setChatAlerts : () => {}} color={accent} />
        </Group>

        {/* Seguridad */}
        <Group title="Seguridad y privacidad">
          <SwitchRow icon="delete-outline" title="Confirmar antes de eliminar" subtitle="Solicitar confirmación antes de borrar registros." value={confirmBeforeDelete} onChange={setConfirmBeforeDelete} color={accent} />
          <SwitchRow icon="visibility-off" title="Ocultar información sensible" subtitle="Oculta datos internos del panel." value={hideSens} onChange={setHideSens} color={accent} />
          <NavRow icon="lock-outline" title="Seguridad de cuenta" subtitle="Contraseña, verificación en dos pasos y acceso." onPress={() => {}} color={accent} />
          <NavRow icon="privacy-tip" title="Privacidad del panel" subtitle="Datos visibles para clientes." onPress={() => {}} color={accent} />
        </Group>

        {/* Soporte */}
        <Group title="Soporte">
          <NavRow icon="support-agent" title="Contactar soporte" subtitle="Reportar errores, dudas o conflictos." onPress={() => {}} color={COLORS.info} />
          <NavRow icon="info-outline" title="Información del sistema" subtitle="Estado del frontend y módulos." onPress={() => Alert.alert('Sistema', 'Frontend funcional. Módulos activos.')} color={accent} />
          <NavRow icon="verified-user" title="Verificación del negocio" subtitle="Estado de documentos y aprobación." onPress={() => router.push('/(provider)/verification')} color={accent} />
        </Group>

        {/* Logout — secondary danger button */}
        <TouchableOpacity onPress={logout}
          style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 14, borderRadius: 14, borderWidth: 1, borderColor: COLORS.danger, minHeight: 44, marginBottom: 4 }}>
          <MaterialIcons name="logout" size={20} color={COLORS.danger} />
          <Text style={{ color: COLORS.danger, fontWeight: '900' }}>Cerrar sesión</Text>
        </TouchableOpacity>

        <InfoBox text="Los cambios de apariencia se aplican al instante y no modifican tus datos comerciales." />
      </ScrollView>
    </SafeAreaView>
  );
}

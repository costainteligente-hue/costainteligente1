import React, { useState } from 'react';
import {
  ScrollView, View, Text, TouchableOpacity, Switch, Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useProviderStore } from '@/stores/providerStore';
import { COLORS } from '@/lib/constants';
import { CardBox } from '@/components/ui/CardBox';
import { HeaderCard } from '@/components/ui/HeaderCard';
import { InfoBox } from '@/components/ui/InfoBox';

// ─── Accent color dots ────────────────────────────────────────────────────────
const ACCENT_OPTIONS = [COLORS.ocean, COLORS.info, COLORS.success, COLORS.purple, COLORS.warning];

// ─── Settings toggle row ──────────────────────────────────────────────────────
function ToggleRow({
  icon, title, subtitle, value, onValueChange, accentColor = COLORS.ocean,
}: {
  icon: keyof typeof MaterialIcons.glyphMap;
  title: string;
  subtitle: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
  accentColor?: string;
}) {
  return (
    <View className="flex-row items-center gap-3 py-3">
      <View
        style={{
          width: 38,
          height: 38,
          borderRadius: 99,
          backgroundColor: `${accentColor}20`,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <MaterialIcons name={icon} size={20} color={accentColor} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontWeight: '800', color: '#0F172A' }}>{title}</Text>
        <Text style={{ color: '#0F172A99', fontSize: 12 }}>{subtitle}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: '#E2E8F0', true: `${accentColor}60` }}
        thumbColor={value ? accentColor : '#fff'}
      />
    </View>
  );
}

// ─── Tappable row ─────────────────────────────────────────────────────────────
function ActionRow({
  icon, title, subtitle, onPress, accentColor = COLORS.ocean, danger = false,
}: {
  icon: keyof typeof MaterialIcons.glyphMap;
  title: string;
  subtitle: string;
  onPress: () => void;
  accentColor?: string;
  danger?: boolean;
}) {
  return (
    <TouchableOpacity onPress={onPress} className="flex-row items-center gap-3 py-3">
      <View
        style={{
          width: 38,
          height: 38,
          borderRadius: 99,
          backgroundColor: `${danger ? COLORS.danger : accentColor}20`,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <MaterialIcons name={icon} size={20} color={danger ? COLORS.danger : accentColor} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontWeight: '800', color: danger ? COLORS.danger : '#0F172A' }}>{title}</Text>
        <Text style={{ color: '#0F172A99', fontSize: 12 }}>{subtitle}</Text>
      </View>
      <MaterialIcons name="chevron-right" size={22} color="#94A3B8" />
    </TouchableOpacity>
  );
}

// ─── Section group ────────────────────────────────────────────────────────────
function SettingsGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <CardBox>
      <Text style={{ fontWeight: '800', color: '#0F172A', fontSize: 16, marginBottom: 4 }}>{title}</Text>
      {children}
    </CardBox>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function SettingsScreen() {
  const router = useRouter();
  const { confirmBeforeDelete, setConfirmBeforeDelete } = useProviderStore();

  const [notifications, setNotifications] = useState(true);
  const [reservationAlerts, setReservationAlerts] = useState(true);
  const [paymentAlerts, setPaymentAlerts] = useState(true);
  const [chatAlerts, setChatAlerts] = useState(true);
  const [hideSensitive, setHideSensitive] = useState(false);
  const [accentColor, setAccentColor] = useState(COLORS.ocean);
  const [darkMode, setDarkMode] = useState(false);

  const handleLogout = () => {
    Alert.alert('Cerrar sesión', '¿Deseas cerrar tu sesión?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Cerrar sesión', style: 'destructive', onPress: () => {} },
    ]);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        <HeaderCard
          title="Centro de ajustes"
          subtitle="Controla apariencia, alertas, seguridad y privacidad del panel."
          icon="settings"
          color={accentColor}
        />

        {/* Appearance */}
        <SettingsGroup title="Apariencia">
          <View style={{ marginBottom: 12 }}>
            <Text style={{ color: '#0F172A99', fontSize: 13, marginBottom: 10 }}>
              Color principal
            </Text>
            <View className="flex-row gap-3">
              {ACCENT_OPTIONS.map((c) => (
                <TouchableOpacity
                  key={c}
                  onPress={() => setAccentColor(c)}
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 99,
                    backgroundColor: c,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderWidth: accentColor === c ? 3 : 0,
                    borderColor: '#0F172A',
                    shadowColor: c,
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: accentColor === c ? 0.4 : 0.15,
                    shadowRadius: 8,
                    elevation: 3,
                  }}
                >
                  {accentColor === c && <MaterialIcons name="check" size={18} color="#fff" />}
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <ToggleRow
            icon="dark-mode"
            title="Modo oscuro"
            subtitle="Cambia el tema visual del panel."
            value={darkMode}
            onValueChange={setDarkMode}
            accentColor={accentColor}
          />
        </SettingsGroup>

        {/* Notifications */}
        <SettingsGroup title="Notificaciones">
          <ToggleRow
            icon="notifications-active"
            title="Notificaciones generales"
            subtitle="Alertas de actividad en la cuenta."
            value={notifications}
            onValueChange={setNotifications}
            accentColor={accentColor}
          />
          <ToggleRow
            icon="event-available"
            title="Alertas de reservaciones"
            subtitle="Solicitudes, cambios y confirmaciones."
            value={reservationAlerts}
            onValueChange={notifications ? setReservationAlerts : () => {}}
            accentColor={accentColor}
          />
          <ToggleRow
            icon="payments"
            title="Alertas de pagos"
            subtitle="Cobros, comprobantes y pagos pendientes."
            value={paymentAlerts}
            onValueChange={notifications ? setPaymentAlerts : () => {}}
            accentColor={accentColor}
          />
          <ToggleRow
            icon="chat-bubble-outline"
            title="Mensajes de clientes"
            subtitle="Conversaciones de reservaciones activas."
            value={chatAlerts}
            onValueChange={notifications ? setChatAlerts : () => {}}
            accentColor={accentColor}
          />
        </SettingsGroup>

        {/* Security */}
        <SettingsGroup title="Seguridad y privacidad">
          <ToggleRow
            icon="delete-outline"
            title="Confirmar antes de eliminar"
            subtitle="Solicitar confirmación antes de borrar registros."
            value={confirmBeforeDelete}
            onValueChange={setConfirmBeforeDelete}
            accentColor={accentColor}
          />
          <ToggleRow
            icon="visibility-off"
            title="Ocultar información sensible"
            subtitle="Oculta datos internos del panel."
            value={hideSensitive}
            onValueChange={setHideSensitive}
            accentColor={accentColor}
          />
          <ActionRow
            icon="lock-outline"
            title="Seguridad de cuenta"
            subtitle="Contraseña, verificación y acceso."
            onPress={() => {}}
            accentColor={accentColor}
          />
          <ActionRow
            icon="privacy-tip"
            title="Privacidad del panel"
            subtitle="Datos visibles para clientes."
            onPress={() => {}}
            accentColor={accentColor}
          />
        </SettingsGroup>

        {/* Support */}
        <SettingsGroup title="Soporte">
          <ActionRow
            icon="support-agent"
            title="Contactar soporte"
            subtitle="Reportar errores, dudas o conflictos."
            onPress={() => {}}
            accentColor={COLORS.info}
          />
          <ActionRow
            icon="info-outline"
            title="Información del sistema"
            subtitle="Estado del frontend y módulos."
            onPress={() => Alert.alert('Sistema', 'Frontend funcional. Backend: Supabase pendiente de conexión.')}
            accentColor={accentColor}
          />
          <ActionRow
            icon="verified"
            title="Verificación del negocio"
            subtitle="Estado de documentos y aprobación."
            onPress={() => {}}
            accentColor={accentColor}
          />
        </SettingsGroup>

        {/* Logout */}
        <TouchableOpacity
          onPress={handleLogout}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            padding: 14,
            borderRadius: 14,
            borderWidth: 1,
            borderColor: COLORS.danger,
            marginTop: 4,
          }}
        >
          <MaterialIcons name="logout" size={20} color={COLORS.danger} />
          <Text style={{ color: COLORS.danger, fontWeight: '800' }}>Cerrar sesión</Text>
        </TouchableOpacity>

        <InfoBox text="Los cambios de apariencia se aplican al instante y no modifican tus datos comerciales." />
      </ScrollView>
    </SafeAreaView>
  );
}

import React, { useState } from 'react';
import {
  ScrollView, View, Text, TouchableOpacity, Modal,
  TextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '@/lib/constants';
import { CardBox } from '@/components/ui/CardBox';
import { HeaderCard } from '@/components/ui/HeaderCard';
import { StatusPill } from '@/components/ui/StatusPill';
import { EmptyState } from '@/components/ui/EmptyState';
import { InfoBox } from '@/components/ui/InfoBox';

interface PendingProvider {
  id: string;
  businessName: string;
  serviceType: string;
  rfc: string;
  phone: string;
  email: string;
  address: string;
  registeredAt: string;
  status: 'pending' | 'approved' | 'rejected';
}

const INITIAL_PROVIDERS: PendingProvider[] = [
  { id: 'pv1', businessName: 'Lanchas El Cazador', serviceType: 'Pescador de lancha', rfc: 'CAVE890312AB1', phone: '7551234567', email: 'cazador@email.com', address: 'Muelle Ppal. Zihuatanejo, Guerrero', registeredAt: '14/07/2026', status: 'pending' },
  { id: 'pv2', businessName: 'Mariscos La Gaviota', serviceType: 'Restaurante de mariscos', rfc: 'GABI780905XY2', phone: '7559876543', email: 'gaviota@email.com', address: 'Playa La Ropa 42, Zihuatanejo', registeredAt: '12/07/2026', status: 'pending' },
  { id: 'pv3', businessName: 'Pesca Deportiva Ixtapa', serviceType: 'Pesca deportiva', rfc: 'PDIX920714MN3', phone: '7558765432', email: 'ixtapa@email.com', address: 'Marina Ixtapa, Guerrero', registeredAt: '10/07/2026', status: 'pending' },
];

function ProviderDetailModal({
  provider,
  onApprove,
  onReject,
  onClose,
}: {
  provider: PendingProvider;
  onApprove: () => void;
  onReject: (reason: string) => void;
  onClose: () => void;
}) {
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);
  const reasonValid = rejectReason.trim().length >= 10;

  const handleReject = () => {
    if (!showRejectInput) { setShowRejectInput(true); return; }
    if (!reasonValid) return;
    onReject(rejectReason.trim());
  };

  const fields: { label: string; value: string; icon: keyof typeof MaterialIcons.glyphMap }[] = [
    { label: 'Negocio', value: provider.businessName, icon: 'storefront' },
    { label: 'Tipo de servicio', value: provider.serviceType, icon: 'category' },
    { label: 'RFC', value: provider.rfc, icon: 'badge' },
    { label: 'Teléfono', value: provider.phone, icon: 'phone' },
    { label: 'Correo', value: provider.email, icon: 'email' },
    { label: 'Dirección', value: provider.address, icon: 'location-on' },
    { label: 'Registro', value: provider.registeredAt, icon: 'calendar-today' },
  ];

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
          <View className="flex-row items-center justify-between px-4 pt-4 pb-2">
            <Text style={{ fontSize: 18, fontWeight: '800', color: '#0F172A' }}>Revisar proveedor</Text>
            <TouchableOpacity onPress={onClose}>
              <MaterialIcons name="close" size={24} color="#0F172A" />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
            <CardBox>
              {fields.map((f) => (
                <View key={f.label} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 12 }}>
                  <MaterialIcons name={f.icon} size={18} color={COLORS.ocean} style={{ marginTop: 1 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: '#0F172A99', fontSize: 11, fontWeight: '700' }}>{f.label}</Text>
                    <Text style={{ color: '#0F172A', fontWeight: '700', fontSize: 14 }}>{f.value}</Text>
                  </View>
                </View>
              ))}
            </CardBox>

            {showRejectInput && (
              <CardBox>
                <Text style={{ fontWeight: '700', color: '#0F172A', marginBottom: 6 }}>
                  Motivo del rechazo (10–300 caracteres) *
                </Text>
                <TextInput
                  value={rejectReason}
                  onChangeText={setRejectReason}
                  multiline numberOfLines={4}
                  maxLength={300}
                  placeholder="Describe el motivo del rechazo para notificar al proveedor..."
                  placeholderTextColor="#94A3B8"
                  style={{
                    backgroundColor: '#F8FAFC', borderRadius: 12, borderWidth: 1,
                    borderColor: !reasonValid && rejectReason.length > 0 ? COLORS.danger : '#E2E8F0',
                    padding: 12, fontSize: 14, color: '#0F172A', textAlignVertical: 'top', minHeight: 90,
                  }}
                />
                <Text style={{ color: '#94A3B8', fontSize: 11, marginTop: 4, textAlign: 'right' }}>
                  {rejectReason.length}/300
                </Text>
              </CardBox>
            )}

            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={handleReject}
                style={{
                  flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                  gap: 6, borderRadius: 14, borderWidth: 1, borderColor: COLORS.danger, padding: 13,
                  opacity: showRejectInput && !reasonValid ? 0.5 : 1,
                }}
              >
                <MaterialIcons name="close" size={18} color={COLORS.danger} />
                <Text style={{ color: COLORS.danger, fontWeight: '800' }}>
                  {showRejectInput ? 'Confirmar rechazo' : 'Rechazar'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => { onApprove(); onClose(); }}
                style={{
                  flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                  gap: 6, backgroundColor: COLORS.success, borderRadius: 14, padding: 13,
                }}
              >
                <MaterialIcons name="check" size={18} color="#fff" />
                <Text style={{ color: '#fff', fontWeight: '800' }}>Aprobar</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export default function VerificationScreen() {
  const [providers, setProviders] = useState<PendingProvider[]>(INITIAL_PROVIDERS);
  const [selected, setSelected] = useState<PendingProvider | null>(null);

  const pending = providers.filter((p) => p.status === 'pending');

  const approve = (id: string) => {
    setProviders((prev) => prev.map((p) => p.id === id ? { ...p, status: 'approved' } : p));
  };

  const reject = (id: string, _reason: string) => {
    setProviders((prev) => prev.map((p) => p.id === id ? { ...p, status: 'rejected' } : p));
    setSelected(null);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }} edges={['top']}>
      {selected && (
        <ProviderDetailModal
          provider={selected}
          onApprove={() => approve(selected.id)}
          onReject={(reason) => reject(selected.id, reason)}
          onClose={() => setSelected(null)}
        />
      )}

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
        <HeaderCard
          title="Cola de verificación"
          subtitle={`${pending.length} proveedor${pending.length !== 1 ? 'es' : ''} pendiente${pending.length !== 1 ? 's' : ''} de revisión.`}
          icon="verified-user"
          color={COLORS.warning}
        />

        {pending.length === 0 ? (
          <EmptyState
            icon="check-circle"
            title="Cola vacía"
            message="Todos los proveedores han sido revisados."
            buttonLabel="Actualizar"
            onPress={() => {}}
          />
        ) : (
          pending.map((p) => (
            <TouchableOpacity key={p.id} onPress={() => setSelected(p)}>
              <CardBox>
                <View className="flex-row items-center gap-3">
                  <View style={{ width: 48, height: 48, borderRadius: 16, backgroundColor: `${COLORS.warning}20`, alignItems: 'center', justifyContent: 'center' }}>
                    <MaterialIcons name="storefront" size={24} color={COLORS.warning} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontWeight: '800', color: '#0F172A', fontSize: 15 }}>{p.businessName}</Text>
                    <Text style={{ color: '#0F172A99', fontSize: 13 }}>{p.serviceType}</Text>
                    <Text style={{ color: '#94A3B8', fontSize: 12, marginTop: 2 }}>
                      Registrado: {p.registeredAt}
                    </Text>
                  </View>
                  <StatusPill status="Pendiente" />
                </View>
              </CardBox>
            </TouchableOpacity>
          ))
        )}

        {/* Recently processed */}
        {providers.filter((p) => p.status !== 'pending').length > 0 && (
          <>
            <Text style={{ fontWeight: '800', color: '#0F172A', fontSize: 15, marginBottom: 10, marginTop: 4 }}>
              Revisados recientemente
            </Text>
            {providers.filter((p) => p.status !== 'pending').map((p) => (
              <CardBox key={p.id}>
                <View className="flex-row items-center gap-3">
                  <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: `${p.status === 'approved' ? COLORS.success : COLORS.danger}15`, alignItems: 'center', justifyContent: 'center' }}>
                    <MaterialIcons name={p.status === 'approved' ? 'check-circle' : 'cancel'} size={22} color={p.status === 'approved' ? COLORS.success : COLORS.danger} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontWeight: '800', color: '#0F172A' }}>{p.businessName}</Text>
                    <Text style={{ color: '#0F172A99', fontSize: 13 }}>{p.serviceType}</Text>
                  </View>
                  <StatusPill status={p.status === 'approved' ? 'Aprobado' : 'Rechazado'} />
                </View>
              </CardBox>
            ))}
          </>
        )}

        <InfoBox text="Al aprobar o rechazar, el proveedor recibe una notificación push automáticamente. Todas las acciones se registran en el log de auditoría." />
      </ScrollView>
    </SafeAreaView>
  );
}

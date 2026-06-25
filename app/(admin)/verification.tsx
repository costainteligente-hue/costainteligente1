/**
 * Admin — Cola de verificación de proveedores (datos reales)
 */
import React, { useState } from 'react';
import {
  ScrollView, View, Text, TouchableOpacity, Modal,
  TextInput, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { COLORS } from '@/lib/constants';
import { CardBox } from '@/components/ui/CardBox';
import { HeaderCard } from '@/components/ui/HeaderCard';
import { StatusPill } from '@/components/ui/StatusPill';
import { EmptyState } from '@/components/ui/EmptyState';
import { InfoBox } from '@/components/ui/InfoBox';

const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? '';

interface PendingProvider {
  id: string; businessName: string; serviceType: string;
  rfc: string; phone: string; email: string; address: string;
  registeredAt: string; status: 'pending' | 'approved' | 'rejected';
  rejectionReason: string | null; ownerName: string | null;
}

// ─── Fetch / mutate ───────────────────────────────────────────────────────────
async function fetchProviders(): Promise<PendingProvider[]> {
  if (typeof window !== 'undefined') {
    const res = await fetch(`${API_BASE}/api/admin?r=providers`);
    if (!res.ok) throw new Error('Error cargando proveedores');
    return res.json();
  }
  const { adminProvidersRepository } = await import('@/lib/repositories/admin-providers.repository');
  return adminProvidersRepository.findAll();
}

async function mutateProviderStatus(payload: { id: string; status: 'approved' | 'rejected'; rejectionReason?: string }) {
  if (typeof window !== 'undefined') {
    const res = await fetch(`${API_BASE}/api/admin?r=providers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Error al actualizar proveedor');
    return res.json();
  }
  const { adminProvidersRepository } = await import('@/lib/repositories/admin-providers.repository');
  await adminProvidersRepository.updateStatus(payload.id, payload.status, payload.rejectionReason);
}

// ─── Modal detalle ────────────────────────────────────────────────────────────
function ProviderDetailModal({ provider, onApprove, onReject, onClose }: {
  provider: PendingProvider;
  onApprove: () => void;
  onReject: (reason: string) => void;
  onClose: () => void;
}) {
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);
  const reasonValid = rejectReason.trim().length >= 10;

  const fields: { label: string; value: string; icon: keyof typeof MaterialIcons.glyphMap }[] = [
    { label: 'Negocio',          value: provider.businessName,       icon: 'storefront' },
    { label: 'Tipo de servicio', value: provider.serviceType,        icon: 'category' },
    { label: 'Propietario',      value: provider.ownerName ?? '—',   icon: 'person' },
    { label: 'RFC',              value: provider.rfc,                icon: 'badge' },
    { label: 'Teléfono',         value: provider.phone,              icon: 'phone' },
    { label: 'Correo',           value: provider.email,              icon: 'email' },
    { label: 'Dirección',        value: provider.address,            icon: 'location-on' },
    { label: 'Registro',         value: provider.registeredAt,       icon: 'calendar-today' },
  ];

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12 }}>
            <Text style={{ fontSize: 18, fontWeight: '800', color: '#0F172A' }}>Revisar proveedor</Text>
            <TouchableOpacity onPress={onClose}><MaterialIcons name="close" size={24} color="#0F172A" /></TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
            <CardBox>
              {fields.map((f) => (
                <View key={f.label} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 12 }}>
                  <MaterialIcons name={f.icon} size={18} color={COLORS.ocean} style={{ marginTop: 1 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: '#94A3B8', fontSize: 11, fontWeight: '700' }}>{f.label}</Text>
                    <Text style={{ color: '#0F172A', fontWeight: '700', fontSize: 14 }}>{f.value}</Text>
                  </View>
                </View>
              ))}
            </CardBox>

            {showRejectInput && (
              <CardBox>
                <Text style={{ fontWeight: '700', color: '#0F172A', marginBottom: 6 }}>Motivo del rechazo *</Text>
                <TextInput
                  value={rejectReason} onChangeText={setRejectReason}
                  multiline numberOfLines={4} maxLength={300}
                  placeholder="Describe el motivo del rechazo (mínimo 10 caracteres)..."
                  placeholderTextColor="#94A3B8"
                  style={{ backgroundColor: '#F8FAFC', borderRadius: 12, borderWidth: 1, borderColor: !reasonValid && rejectReason.length > 0 ? COLORS.danger : '#E2E8F0', padding: 12, fontSize: 14, color: '#0F172A', textAlignVertical: 'top', minHeight: 90 }}
                />
                <Text style={{ color: '#94A3B8', fontSize: 11, marginTop: 4, textAlign: 'right' }}>{rejectReason.length}/300</Text>
              </CardBox>
            )}

            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity
                onPress={() => { if (!showRejectInput) { setShowRejectInput(true); return; } if (!reasonValid) return; onReject(rejectReason.trim()); onClose(); }}
                style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: 14, borderWidth: 1, borderColor: COLORS.danger, padding: 13, opacity: showRejectInput && !reasonValid ? 0.5 : 1 }}
              >
                <MaterialIcons name="close" size={18} color={COLORS.danger} />
                <Text style={{ color: COLORS.danger, fontWeight: '800' }}>{showRejectInput ? 'Confirmar rechazo' : 'Rechazar'}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => { onApprove(); onClose(); }}
                style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: COLORS.success, borderRadius: 14, padding: 13 }}
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

// ─── Pantalla principal ───────────────────────────────────────────────────────
export default function VerificationScreen() {
  const qc = useQueryClient();
  const { data, isLoading, error, refetch } = useQuery({ queryKey: ['admin_providers'], queryFn: fetchProviders, staleTime: 0, refetchInterval: 4000 });
  const mutation = useMutation({
    mutationFn: mutateProviderStatus,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin_providers'] }),
  });
  const [selected, setSelected] = useState<PendingProvider | null>(null);

  const providers = data ?? [];
  const pending   = providers.filter((p) => p.status === 'pending');
  const reviewed  = providers.filter((p) => p.status !== 'pending');

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }} edges={['top']}>
      {selected && (
        <ProviderDetailModal
          provider={selected}
          onApprove={() => mutation.mutate({ id: selected.id, status: 'approved' })}
          onReject={(reason) => mutation.mutate({ id: selected.id, status: 'rejected', rejectionReason: reason })}
          onClose={() => setSelected(null)}
        />
      )}

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
        <HeaderCard
          title="Cola de verificación"
          subtitle={isLoading ? 'Cargando...' : `${pending.length} proveedor${pending.length !== 1 ? 'es' : ''} pendiente${pending.length !== 1 ? 's' : ''}`}
          icon="verified-user"
          color={COLORS.warning}
        />

        {isLoading && (
          <View style={{ alignItems: 'center', paddingVertical: 40 }}>
            <ActivityIndicator size="large" color={COLORS.ocean} />
            <Text style={{ color: '#64748B', marginTop: 12 }}>Cargando proveedores...</Text>
          </View>
        )}

        {!isLoading && error && (
          <View style={{ backgroundColor: `${COLORS.danger}10`, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: `${COLORS.danger}30` }}>
            <Text style={{ color: COLORS.danger, fontWeight: '700' }}>Error al cargar proveedores.</Text>
            <TouchableOpacity onPress={() => refetch()}><Text style={{ color: COLORS.ocean, fontWeight: '800', marginTop: 8 }}>Reintentar</Text></TouchableOpacity>
          </View>
        )}

        {!isLoading && !error && pending.length === 0 && (
          <EmptyState icon="check-circle" title="Cola vacía" message="Todos los proveedores han sido revisados." buttonLabel="Actualizar" onPress={() => refetch()} />
        )}

        {pending.map((p) => (
          <TouchableOpacity key={p.id} onPress={() => setSelected(p)}>
            <CardBox>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={{ width: 48, height: 48, borderRadius: 16, backgroundColor: `${COLORS.warning}20`, alignItems: 'center', justifyContent: 'center' }}>
                  <MaterialIcons name="storefront" size={24} color={COLORS.warning} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: '800', color: '#0F172A', fontSize: 15 }}>{p.businessName}</Text>
                  <Text style={{ color: '#64748B', fontSize: 13 }}>{p.serviceType}</Text>
                  <Text style={{ color: '#94A3B8', fontSize: 12, marginTop: 2 }}>{p.email} · {p.registeredAt}</Text>
                </View>
                <StatusPill status="Pendiente" />
              </View>
            </CardBox>
          </TouchableOpacity>
        ))}

        {reviewed.length > 0 && (
          <>
            <Text style={{ fontWeight: '800', color: '#0F172A', fontSize: 15, marginBottom: 10, marginTop: 8 }}>Revisados recientemente</Text>
            {reviewed.slice(0, 10).map((p) => (
              <CardBox key={p.id}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: `${p.status === 'approved' ? COLORS.success : COLORS.danger}15`, alignItems: 'center', justifyContent: 'center' }}>
                    <MaterialIcons name={p.status === 'approved' ? 'check-circle' : 'cancel'} size={22} color={p.status === 'approved' ? COLORS.success : COLORS.danger} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontWeight: '800', color: '#0F172A' }}>{p.businessName}</Text>
                    <Text style={{ color: '#64748B', fontSize: 13 }}>{p.serviceType}</Text>
                  </View>
                  <StatusPill status={p.status === 'approved' ? 'Aprobado' : 'Rechazado'} />
                </View>
              </CardBox>
            ))}
          </>
        )}

        <InfoBox text="Al aprobar o rechazar, el proveedor recibe notificación automática. Todas las acciones se registran en el log de auditoría." />
      </ScrollView>
    </SafeAreaView>
  );
}

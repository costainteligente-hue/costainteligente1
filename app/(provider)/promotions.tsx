/**
 * PromotionsScreen — Proveedor
 * Campañas, descuentos y promociones visibles para usuarios
 */
import React, { useState } from 'react';
import {
  ScrollView, View, Text, TouchableOpacity, Modal,
  TextInput, KeyboardAvoidingView, Platform, Alert, Switch,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '@/lib/constants';
import { CardBox } from '@/components/ui/CardBox';
import { HeaderCard } from '@/components/ui/HeaderCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { InfoBox } from '@/components/ui/InfoBox';

interface Promo { id: string; title: string; discount: string; conditions: string; active: boolean; }

const SEED_PROMOS: Promo[] = [
  { id: 'pr1', title: 'Temporada alta julio-agosto', discount: '15%', conditions: 'Válido para salidas de más de 4 horas. No acumulable.', active: true },
  { id: 'pr2', title: 'Grupo de 6+ personas', discount: '10%', conditions: 'Aplica en reservas grupales confirmadas.', active: false },
];

function PromoModal({ promo, onSave, onClose }: { promo?: Promo; onSave: (p: Omit<Promo, 'id' | 'active'>) => void; onClose: () => void }) {
  const [title, setTitle]       = useState(promo?.title ?? '');
  const [discount, setDiscount] = useState(promo?.discount?.replace('%', '') ?? '');
  const [conditions, setConditions] = useState(promo?.conditions ?? '');

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12 }}>
            <Text style={{ fontSize: 18, fontWeight: '800', color: '#0F172A' }}>{promo ? 'Editar promoción' : 'Nueva promoción'}</Text>
            <TouchableOpacity onPress={onClose}><MaterialIcons name="close" size={24} color="#0F172A" /></TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
            <CardBox>
              {[
                { label: 'Nombre o descripción', value: title, set: setTitle, placeholder: 'Ej. Temporada alta julio-agosto' },
                { label: 'Descuento (%)', value: discount, set: setDiscount, placeholder: 'Ej. 15', keyboard: 'numeric' as const },
                { label: 'Condiciones', value: conditions, set: setConditions, placeholder: 'Ej. No acumulable. Válido en salidas de 4h+', multiline: true },
              ].map((f) => (
                <View key={f.label} style={{ marginBottom: 14 }}>
                  <Text style={{ fontWeight: '700', color: '#0F172A', fontSize: 13, marginBottom: 6 }}>{f.label}</Text>
                  <TextInput value={f.value} onChangeText={f.set} placeholder={f.placeholder} placeholderTextColor="#94A3B8"
                    keyboardType={f.keyboard ?? 'default'} multiline={f.multiline}
                    style={{ backgroundColor: '#F8FAFC', borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', paddingHorizontal: 12, paddingVertical: 11, fontSize: 14, color: '#0F172A', textAlignVertical: f.multiline ? 'top' : 'center', minHeight: f.multiline ? 80 : undefined }} />
                </View>
              ))}
            </CardBox>
            <TouchableOpacity
              onPress={() => {
                if (!title.trim() || !discount.trim()) { Alert.alert('Agrega nombre y descuento.'); return; }
                onSave({ title: title.trim(), discount: `${discount.trim()}%`, conditions: conditions.trim() || 'Sin condiciones.' });
                onClose();
              }}
              style={{ backgroundColor: COLORS.purple, borderRadius: 14, padding: 14, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8, marginTop: 8 }}>
              <MaterialIcons name="check" size={18} color="#fff" />
              <Text style={{ color: '#fff', fontWeight: '800' }}>Guardar promoción</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export default function PromotionsScreen() {
  const [promos, setPromos]     = useState<Promo[]>(SEED_PROMOS);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing]   = useState<Promo | undefined>(undefined);

  const add = (data: Omit<Promo, 'id' | 'active'>) =>
    setPromos((prev) => [...prev, { ...data, id: `pr${Date.now()}`, active: true }]);

  const update = (id: string, data: Omit<Promo, 'id' | 'active'>) =>
    setPromos((prev) => prev.map((p) => p.id === id ? { ...p, ...data } : p));

  const toggle = (id: string) =>
    setPromos((prev) => prev.map((p) => p.id === id ? { ...p, active: !p.active } : p));

  const remove = (id: string) =>
    Alert.alert('Eliminar promoción', '¿Eliminar esta promoción?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: () => setPromos((prev) => prev.filter((p) => p.id !== id)) },
    ]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }} edges={['top']}>
      {showModal && (
        <PromoModal promo={editing} onSave={(d) => editing ? update(editing.id, d) : add(d)} onClose={() => { setShowModal(false); setEditing(undefined); }} />
      )}
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        <HeaderCard title="Promociones" subtitle="Campañas por servicio con fecha, descuento y condiciones." icon="local-offer" color={COLORS.purple} />

        <TouchableOpacity onPress={() => { setEditing(undefined); setShowModal(true); }}
          style={{ backgroundColor: COLORS.purple, borderRadius: 14, padding: 14, marginBottom: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <MaterialIcons name="add" size={20} color="#fff" />
          <Text style={{ color: '#fff', fontWeight: '800' }}>Crear promoción</Text>
        </TouchableOpacity>

        {promos.length === 0 ? (
          <EmptyState icon="local-offer" title="Sin promociones" message="Agrega descuentos o campañas visibles para usuarios." buttonLabel="Crear promoción" onPress={() => setShowModal(true)} />
        ) : (
          promos.map((p) => (
            <CardBox key={p.id}>
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
                <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: p.active ? `${COLORS.purple}15` : '#F1F5F9', alignItems: 'center', justifyContent: 'center' }}>
                  <MaterialIcons name="local-offer" size={22} color={p.active ? COLORS.purple : '#94A3B8'} />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                    <Text style={{ fontWeight: '800', color: '#0F172A', fontSize: 14, flex: 1 }}>{p.title}</Text>
                    <View style={{ backgroundColor: `${COLORS.success}15`, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 }}>
                      <Text style={{ color: COLORS.success, fontWeight: '900', fontSize: 13 }}>{p.discount}</Text>
                    </View>
                  </View>
                  <Text style={{ color: '#64748B', fontSize: 12 }}>{p.conditions}</Text>
                  <Text style={{ color: p.active ? COLORS.success : '#94A3B8', fontSize: 11, fontWeight: '700', marginTop: 4 }}>
                    {p.active ? '✓ Activa — visible cuando el servicio esté publicado' : 'Pausada'}
                  </Text>
                </View>
              </View>
              <View style={{ height: 1, backgroundColor: '#E2E8F0', marginVertical: 10 }} />
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Switch value={p.active} onValueChange={() => toggle(p.id)}
                  trackColor={{ false: '#E2E8F0', true: `${COLORS.purple}50` }}
                  thumbColor={p.active ? COLORS.purple : '#fff'} />
                <Text style={{ color: '#64748B', fontSize: 12, flex: 1 }}>{p.active ? 'Activa' : 'Pausada'}</Text>
                <TouchableOpacity onPress={() => { setEditing(p); setShowModal(true); }} style={{ padding: 8 }}>
                  <MaterialIcons name="edit" size={18} color={COLORS.ocean} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => remove(p.id)} style={{ padding: 8 }}>
                  <MaterialIcons name="delete-outline" size={18} color={COLORS.danger} />
                </TouchableOpacity>
              </View>
            </CardBox>
          ))
        )}
        <InfoBox text="Las promociones activas se muestran en el servicio cuando administración lo haya aceptado y esté visible para usuarios." />
      </ScrollView>
    </SafeAreaView>
  );
}

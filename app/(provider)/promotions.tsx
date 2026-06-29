/**
 * PromotionsScreen — fiel al PWA
 * Botón crear + cards con switch + promo sheet
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

const SEED: Promo[] = [
  { id: 'pr1', title: 'Descuento registrado · Embarcación aceptada', discount: '10%', conditions: 'Válido de lunes a jueves con anticipo confirmado.', active: true },
];

// ─── Promo sheet ──────────────────────────────────────────────────────────────
function PromoSheet({ promo, onSave, onClose }: {
  promo?: Promo;
  onSave: (p: Omit<Promo, 'id' | 'active'>) => void;
  onClose: () => void;
}) {
  const [title, setTitle]   = useState(promo?.title ?? '');
  const [disc,  setDisc]    = useState(promo?.discount?.replace('%', '') ?? '');
  const [cond,  setCond]    = useState(promo?.conditions ?? '');
  const inp = { backgroundColor: '#F8FAFC', borderRadius: 14, borderWidth: 1, borderColor: '#E2E8F0', paddingHorizontal: 14, paddingVertical: 13, fontSize: 15, color: '#0F172A' } as const;

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
          <View style={{ width: 42, height: 4, borderRadius: 999, backgroundColor: 'rgba(15,23,42,0.2)', alignSelf: 'center', marginTop: 10, marginBottom: 12 }} />
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 12 }}>
            <Text style={{ fontSize: 20, fontWeight: '900', color: '#0F172A' }}>{promo ? 'Editar promoción' : 'Nueva promoción'}</Text>
            <TouchableOpacity onPress={onClose}><MaterialIcons name="close" size={24} color="#0F172A" /></TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
            <CardBox>
              {[
                { label: 'Nombre o descripción', val: title, set: setTitle, ph: 'Ej. Temporada alta julio-agosto' },
                { label: 'Descuento (%)',         val: disc,  set: setDisc,  ph: 'Ej. 10', kb: 'numeric' as const },
                { label: 'Condiciones',           val: cond,  set: setCond,  ph: 'Ej. No acumulable. Válido en salidas de 4h+', multi: true },
              ].map((f) => (
                <View key={f.label} style={{ marginBottom: 14 }}>
                  <Text style={{ color: 'rgba(15,23,42,0.62)', fontSize: 12, fontWeight: '850', marginBottom: 8 }}>{f.label}</Text>
                  <TextInput value={f.val} onChangeText={f.set} placeholder={f.ph} placeholderTextColor="#94A3B8"
                    keyboardType={f.kb ?? 'default'} multiline={f.multi}
                    style={[inp, f.multi ? { textAlignVertical: 'top', minHeight: 80 } : {}]} />
                </View>
              ))}
            </CardBox>
            <TouchableOpacity
              onPress={() => {
                if (!title.trim() || !disc.trim()) { Alert.alert('Agrega nombre y descuento.'); return; }
                onSave({ title: title.trim(), discount: `${disc.trim()}%`, conditions: cond.trim() || 'Sin condiciones.' });
                onClose();
              }}
              style={{ backgroundColor: COLORS.purple, borderRadius: 14, padding: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 44 }}>
              <MaterialIcons name="check" size={18} color="#fff" />
              <Text style={{ color: '#fff', fontWeight: '900' }}>Guardar promoción</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export default function PromotionsScreen() {
  const [promos, setPromos] = useState<Promo[]>(SEED);
  const [show,   setShow]   = useState(false);
  const [edit,   setEdit]   = useState<Promo | undefined>();

  const add    = (d: Omit<Promo, 'id' | 'active'>) => setPromos((p) => [...p, { ...d, id: `pr${Date.now()}`, active: true }]);
  const update = (id: string, d: Omit<Promo, 'id' | 'active'>) => setPromos((p) => p.map((pr) => pr.id === id ? { ...pr, ...d } : pr));
  const toggle = (id: string) => setPromos((p) => p.map((pr) => pr.id === id ? { ...pr, active: !pr.active } : pr));
  const remove = (id: string) => Alert.alert('Eliminar promoción', '¿Eliminar esta promoción?', [
    { text: 'Cancelar', style: 'cancel' },
    { text: 'Eliminar', style: 'destructive', onPress: () => setPromos((p) => p.filter((pr) => pr.id !== id)) },
  ]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }} edges={['top']}>
      {show && (
        <PromoSheet promo={edit}
          onSave={(d) => edit ? update(edit.id, d) : add(d)}
          onClose={() => { setShow(false); setEdit(undefined); }} />
      )}
      <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 100 }}>
        <HeaderCard title="Promociones" subtitle="Campañas por servicio con fecha, descuento y condiciones." icon="local-offer" color={COLORS.purple} />

        {/* Primary button */}
        <TouchableOpacity onPress={() => { setEdit(undefined); setShow(true); }}
          style={{ backgroundColor: COLORS.purple, borderRadius: 14, padding: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 16, minHeight: 44 }}>
          <MaterialIcons name="add" size={20} color="#fff" />
          <Text style={{ color: '#fff', fontWeight: '900' }}>Crear promoción</Text>
        </TouchableOpacity>

        {promos.length === 0 ? (
          <EmptyState icon="local-offer" title="Sin promociones" message="Agrega descuentos o campañas visibles para usuarios." buttonLabel="Crear promoción" onPress={() => setShow(true)} color={COLORS.purple} />
        ) : promos.map((p) => (
          <CardBox key={p.id}>
            {/* list-item */}
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
              <View style={{ width: 48, height: 48, borderRadius: 16, backgroundColor: p.active ? `${COLORS.purple}20` : '#F1F5F9', alignItems: 'center', justifyContent: 'center' }}>
                <MaterialIcons name="local-offer" size={24} color={p.active ? COLORS.purple : '#94A3B8'} />
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                  <Text style={{ flex: 1, fontWeight: '900', color: '#0F172A', fontSize: 15 }} numberOfLines={2}>{p.title}</Text>
                  <View style={{ backgroundColor: `${COLORS.success}15`, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 4 }}>
                    <Text style={{ color: COLORS.success, fontWeight: '900', fontSize: 13 }}>{p.discount}</Text>
                  </View>
                </View>
                <Text style={{ color: 'rgba(15,23,42,0.62)', fontSize: 13, lineHeight: 18 }}>{p.conditions}</Text>
              </View>
            </View>

            <View style={{ height: 1, backgroundColor: '#E2E8F0', marginBottom: 12 }} />

            {/* Switch + actions */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Switch value={p.active} onValueChange={() => toggle(p.id)}
                trackColor={{ false: '#E2E8F0', true: `${COLORS.purple}50` }}
                thumbColor={p.active ? COLORS.purple : '#fff'} />
              <Text style={{ color: 'rgba(15,23,42,0.62)', fontSize: 12, flex: 1 }}>{p.active ? 'Activa' : 'Pausada'}</Text>
              <TouchableOpacity onPress={() => { setEdit(p); setShow(true); }} style={{ padding: 8 }}>
                <MaterialIcons name="edit" size={18} color={COLORS.ocean} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => remove(p.id)} style={{ padding: 8 }}>
                <MaterialIcons name="delete-outline" size={18} color={COLORS.danger} />
              </TouchableOpacity>
            </View>
          </CardBox>
        ))}

        <InfoBox text="Las promociones activas se muestran en el servicio cuando administración lo haya aceptado y esté visible para usuarios." />
      </ScrollView>
    </SafeAreaView>
  );
}

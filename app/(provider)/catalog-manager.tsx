/**
 * CatalogManagerScreen — Menú / Catálogo de productos
 * Para restaurant (platillos), store (productos) y fishMarket (productos frescos)
 */
import React, { useState } from 'react';
import {
  ScrollView, View, Text, TouchableOpacity, Modal,
  TextInput, KeyboardAvoidingView, Platform, Alert, Image,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { COLORS, getServiceDef, formatCurrency } from '@/lib/constants';
import { useProviderStore } from '@/stores/providerStore';
import { CardBox } from '@/components/ui/CardBox';
import { HeaderCard } from '@/components/ui/HeaderCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { InfoBox } from '@/components/ui/InfoBox';
import type { CatalogItem, ServiceModuleId, MoneyCurrency } from '@/types';

function catalogLabel(serviceId: string) {
  if (serviceId === 'restaurant') return { title: 'Menú visual y platillos', addBtn: 'Añadir platillo', itemName: 'platillo' };
  if (serviceId === 'fishMarket') return { title: 'Menú de productos frescos', addBtn: 'Añadir producto fresco', itemName: 'producto fresco' };
  return { title: 'Menú visual de productos', addBtn: 'Añadir producto', itemName: 'producto' };
}

// ─── Modal ────────────────────────────────────────────────────────────────────
function CatalogItemModal({
  initial,
  serviceId,
  onSave,
  onClose,
}: {
  initial?: CatalogItem;
  serviceId: string;
  onSave: (item: CatalogItem) => void;
  onClose: () => void;
}) {
  const label = catalogLabel(serviceId);
  const [name, setName]       = useState(initial?.name ?? '');
  const [desc, setDesc]       = useState(initial?.description ?? '');
  const [price, setPrice]     = useState(initial ? String(initial.price) : '');
  const [currency, setCurrency] = useState<MoneyCurrency>(initial?.currency ?? 'MXN');
  const [imageUrl, setImageUrl] = useState(initial?.imageUrl ?? '');

  const save = () => {
    if (!name.trim()) { Alert.alert('El nombre es obligatorio.'); return; }
    const parsed = parseFloat(price);
    if (isNaN(parsed) || parsed < 0) { Alert.alert('Ingresa un precio válido.'); return; }
    onSave({
      id: initial?.id ?? `cat-${Date.now()}`,
      name: name.trim(),
      description: desc.trim(),
      price: parsed,
      currency,
      imageUrl: imageUrl.trim(),
    });
    onClose();
  };

  const inputStyle = {
    backgroundColor: '#F8FAFC', borderRadius: 12, borderWidth: 1,
    borderColor: '#E2E8F0', paddingHorizontal: 12, paddingVertical: 10,
    fontSize: 14, color: '#0F172A',
  };

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12 }}>
            <Text style={{ fontSize: 18, fontWeight: '800', color: '#0F172A' }}>
              {initial ? `Editar ${label.itemName}` : label.addBtn}
            </Text>
            <TouchableOpacity onPress={onClose}><MaterialIcons name="close" size={24} color="#0F172A" /></TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
            <CardBox>
              {/* Preview de imagen */}
              <View style={{ width: '100%', height: 140, borderRadius: 14, backgroundColor: '#F1F5F9', marginBottom: 14, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }}>
                {imageUrl ? (
                  <Image source={{ uri: imageUrl }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                ) : (
                  <MaterialIcons name="image" size={40} color="#CBD5E1" />
                )}
              </View>

              <Text style={{ fontWeight: '700', color: '#0F172A', fontSize: 13, marginBottom: 6 }}>URL de imagen (opcional)</Text>
              <TextInput value={imageUrl} onChangeText={setImageUrl} placeholder="https://..." placeholderTextColor="#94A3B8" style={{ ...inputStyle, marginBottom: 14 }} />

              <Text style={{ fontWeight: '700', color: '#0F172A', fontSize: 13, marginBottom: 6 }}>Nombre *</Text>
              <TextInput value={name} onChangeText={setName} placeholder={serviceId === 'restaurant' ? 'Ej. Filete de mero a la plancha' : 'Ej. Anzuelos triples #4'} placeholderTextColor="#94A3B8" style={{ ...inputStyle, marginBottom: 14 }} />

              <Text style={{ fontWeight: '700', color: '#0F172A', fontSize: 13, marginBottom: 6 }}>Descripción</Text>
              <TextInput value={desc} onChangeText={setDesc} multiline numberOfLines={3} placeholder="Descripción breve..." placeholderTextColor="#94A3B8" style={{ ...inputStyle, textAlignVertical: 'top', minHeight: 70, marginBottom: 14 }} />

              <Text style={{ fontWeight: '700', color: '#0F172A', fontSize: 13, marginBottom: 6 }}>Precio *</Text>
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 4 }}>
                <TextInput value={price} onChangeText={setPrice} placeholder="250" keyboardType="numeric" placeholderTextColor="#94A3B8" style={{ ...inputStyle, flex: 1 }} />
                {(['MXN', 'USD'] as MoneyCurrency[]).map((c) => (
                  <TouchableOpacity key={c} onPress={() => setCurrency(c)}
                    style={{ paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, backgroundColor: currency === c ? COLORS.ocean : '#F1F5F9', borderWidth: 1, borderColor: currency === c ? COLORS.ocean : '#E2E8F0', justifyContent: 'center' }}>
                    <Text style={{ fontWeight: '800', fontSize: 13, color: currency === c ? '#fff' : '#0F172A' }}>{c}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </CardBox>

            <TouchableOpacity onPress={save}
              style={{ backgroundColor: COLORS.purple, borderRadius: 14, padding: 14, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8, marginTop: 8 }}>
              <MaterialIcons name="check" size={18} color="#fff" />
              <Text style={{ color: '#fff', fontWeight: '800' }}>{initial ? 'Guardar cambios' : 'Agregar al catálogo'}</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Tarjeta de item ──────────────────────────────────────────────────────────
function CatalogCard({ item, onEdit, onDelete }: {
  item: CatalogItem;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <CardBox>
      <View style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
        {/* Thumbnail */}
        <View style={{ width: 68, height: 68, borderRadius: 14, backgroundColor: '#F1F5F9', overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }}>
          {item.imageUrl ? (
            <Image source={{ uri: item.imageUrl }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
          ) : (
            <MaterialIcons name="image-not-supported" size={26} color="#CBD5E1" />
          )}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontWeight: '800', color: '#0F172A', fontSize: 14 }}>{item.name}</Text>
          {item.description ? <Text style={{ color: '#64748B', fontSize: 12, marginTop: 2 }} numberOfLines={2}>{item.description}</Text> : null}
          <View style={{ flexDirection: 'row', gap: 6, marginTop: 8 }}>
            <View style={{ backgroundColor: `${COLORS.success}15`, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 }}>
              <Text style={{ color: COLORS.success, fontWeight: '800', fontSize: 12 }}>{formatCurrency(item.price, item.currency)}</Text>
            </View>
            {!item.imageUrl && (
              <View style={{ backgroundColor: `${COLORS.warning}15`, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 }}>
                <Text style={{ color: COLORS.warning, fontWeight: '700', fontSize: 11 }}>Sin foto</Text>
              </View>
            )}
          </View>
        </View>
      </View>
      <View style={{ height: 1, backgroundColor: '#E2E8F0', marginVertical: 10 }} />
      <View style={{ flexDirection: 'row', gap: 8, justifyContent: 'flex-end' }}>
        <TouchableOpacity onPress={onEdit}
          style={{ paddingHorizontal: 10, paddingVertical: 7, borderRadius: 10, borderWidth: 1, borderColor: '#E2E8F0', flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <MaterialIcons name="edit" size={14} color="#64748B" />
          <Text style={{ color: '#64748B', fontWeight: '700', fontSize: 12 }}>Editar</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onDelete}
          style={{ paddingHorizontal: 10, paddingVertical: 7, borderRadius: 10, borderWidth: 1, borderColor: `${COLORS.danger}40`, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <MaterialIcons name="delete-outline" size={14} color={COLORS.danger} />
          <Text style={{ color: COLORS.danger, fontWeight: '700', fontSize: 12 }}>Eliminar</Text>
        </TouchableOpacity>
      </View>
    </CardBox>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function CatalogManagerScreen() {
  const router = useRouter();
  const { serviceId, recordId } = useLocalSearchParams<{ serviceId: string; recordId: string }>();
  const { records, updateRecord } = useProviderStore();

  const sid    = serviceId as ServiceModuleId;
  const def    = getServiceDef(sid);
  const record = records[sid]?.find((r) => r.id === recordId);
  const label  = catalogLabel(sid);

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing]     = useState<CatalogItem | undefined>(undefined);

  if (!record) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC', alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: COLORS.danger }}>Registro no encontrado.</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 12 }}>
          <Text style={{ color: COLORS.ocean, fontWeight: '700' }}>Volver</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const catalog = record.catalog ?? [];

  const save = (item: CatalogItem) => {
    const exists = catalog.some((c) => c.id === item.id);
    const next   = exists ? catalog.map((c) => c.id === item.id ? item : c) : [...catalog, item];
    updateRecord(sid, { ...record, catalog: next });
  };

  const remove = (id: string) => {
    Alert.alert('Eliminar', '¿Eliminar este elemento del catálogo?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: () => {
        updateRecord(sid, { ...record, catalog: catalog.filter((c) => c.id !== id) });
      }},
    ]);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }} edges={['top']}>
      {showModal && (
        <CatalogItemModal
          initial={editing}
          serviceId={sid}
          onSave={save}
          onClose={() => { setShowModal(false); setEditing(undefined); }}
        />
      )}

      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E2E8F0', gap: 12 }}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={24} color="#0F172A" />
        </TouchableOpacity>
        <Text style={{ flex: 1, fontWeight: '800', fontSize: 16, color: '#0F172A' }}>{label.title}</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        <HeaderCard title={label.title} subtitle={`${record.title} — ${catalog.length} elementos en catálogo`} icon="menu-book" color={def.color} />

        <TouchableOpacity onPress={() => { setEditing(undefined); setShowModal(true); }}
          style={{ backgroundColor: COLORS.purple, borderRadius: 14, padding: 14, marginBottom: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <MaterialIcons name="add" size={20} color="#fff" />
          <Text style={{ color: '#fff', fontWeight: '800' }}>{label.addBtn}</Text>
        </TouchableOpacity>

        {catalog.length === 0 ? (
          <EmptyState icon="menu-book" title="Catálogo vacío" message={`Agrega ${label.itemName}s con foto, descripción y precio.`} buttonLabel={label.addBtn} onPress={() => setShowModal(true)} />
        ) : (
          catalog.map((item) => (
            <CatalogCard key={item.id} item={item}
              onEdit={() => { setEditing(item); setShowModal(true); }}
              onDelete={() => remove(item.id)}
            />
          ))
        )}

        <InfoBox text="Los productos con foto aparecen mejor posicionados en el perfil público del servicio. Agrega precios reales para facilitar la decisión del cliente." />
      </ScrollView>
    </SafeAreaView>
  );
}

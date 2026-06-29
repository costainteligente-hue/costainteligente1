/**
 * RouteManagerScreen — Recorridos / Paquetes / Rutas y precios
 * Accedido desde ServiceAdminView con serviceId y recordId como params
 */
import React, { useState } from 'react';
import {
  ScrollView, View, Text, TouchableOpacity, Modal,
  TextInput, KeyboardAvoidingView, Platform, Alert, Switch,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { COLORS, getServiceDef, formatCurrency, formatDuration } from '@/lib/constants';
import { useProviderStore } from '@/stores/providerStore';
import { CardBox } from '@/components/ui/CardBox';
import { HeaderCard } from '@/components/ui/HeaderCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { InfoBox } from '@/components/ui/InfoBox';
import type { ServiceRouteOption, ServiceModuleId, MoneyCurrency } from '@/types';

// ─── Títulos según tipo de servicio ──────────────────────────────────────────
function routeLabel(serviceId: string) {
  if (serviceId === 'sport') return { title: 'Paquetes deportivos', addBtn: 'Añadir paquete', itemName: 'paquete' };
  if (serviceId === 'guide') return { title: 'Paquetes y asesorías', addBtn: 'Añadir paquete', itemName: 'paquete' };
  if (serviceId === 'transport') return { title: 'Rutas y tarifas', addBtn: 'Añadir ruta', itemName: 'ruta' };
  return { title: 'Recorridos y precios', addBtn: 'Añadir recorrido', itemName: 'recorrido' };
}

// ─── Modal para agregar / editar una opción ───────────────────────────────────
function RouteOptionModal({
  initial,
  serviceId,
  onSave,
  onClose,
}: {
  initial?: ServiceRouteOption;
  serviceId: string;
  onSave: (opt: ServiceRouteOption) => void;
  onClose: () => void;
}) {
  const label = routeLabel(serviceId);
  const [name, setName]       = useState(initial?.name ?? '');
  const [desc, setDesc]       = useState(initial?.description ?? '');
  const [price, setPrice]     = useState(initial ? String(initial.price) : '');
  const [currency, setCurrency] = useState<MoneyCurrency>(initial?.currency ?? 'MXN');
  const [hours, setHours]     = useState(initial ? String(initial.durationHours) : '2');
  const [minutes, setMinutes] = useState(initial ? String(initial.durationMinutes) : '0');
  const [capacity, setCapacity] = useState(initial ? String(initial.capacity) : '4');
  const [available, setAvailable] = useState(initial?.isAvailable ?? true);

  const save = () => {
    if (!name.trim()) { Alert.alert('El nombre es obligatorio.'); return; }
    const parsed = parseFloat(price);
    if (isNaN(parsed) || parsed < 0) { Alert.alert('El precio debe ser un número válido.'); return; }
    const opt: ServiceRouteOption = {
      id: initial?.id ?? `opt-${Date.now()}`,
      name: name.trim(),
      description: desc.trim(),
      price: parsed,
      currency,
      durationHours: parseInt(hours) || 0,
      durationMinutes: parseInt(minutes) || 0,
      capacity: parseInt(capacity) || 1,
      isAvailable: available,
    };
    onSave(opt);
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
              {/* Nombre */}
              <Text style={{ fontWeight: '700', color: '#0F172A', fontSize: 13, marginBottom: 6 }}>Nombre *</Text>
              <TextInput value={name} onChangeText={setName} placeholder={`Ej. ${serviceId === 'transport' ? 'Ruta aeropuerto' : 'Salida de día completo'}`} placeholderTextColor="#94A3B8" style={{ ...inputStyle, marginBottom: 14 }} />

              {/* Descripción */}
              <Text style={{ fontWeight: '700', color: '#0F172A', fontSize: 13, marginBottom: 6 }}>Descripción</Text>
              <TextInput value={desc} onChangeText={setDesc} multiline numberOfLines={3} placeholder="Detalla qué incluye..." placeholderTextColor="#94A3B8" style={{ ...inputStyle, textAlignVertical: 'top', minHeight: 80, marginBottom: 14 }} />

              {/* Precio + Moneda */}
              <Text style={{ fontWeight: '700', color: '#0F172A', fontSize: 13, marginBottom: 6 }}>Precio *</Text>
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 14 }}>
                <TextInput value={price} onChangeText={setPrice} placeholder="1500" keyboardType="numeric" placeholderTextColor="#94A3B8" style={{ ...inputStyle, flex: 1 }} />
                {(['MXN', 'USD'] as MoneyCurrency[]).map((c) => (
                  <TouchableOpacity key={c} onPress={() => setCurrency(c)}
                    style={{ paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, backgroundColor: currency === c ? COLORS.ocean : '#F1F5F9', borderWidth: 1, borderColor: currency === c ? COLORS.ocean : '#E2E8F0', justifyContent: 'center' }}>
                    <Text style={{ fontWeight: '800', fontSize: 13, color: currency === c ? '#fff' : '#0F172A' }}>{c}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Duración */}
              <Text style={{ fontWeight: '700', color: '#0F172A', fontSize: 13, marginBottom: 6 }}>Duración</Text>
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 14 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: '#64748B', fontSize: 11, marginBottom: 4 }}>Horas</Text>
                  <TextInput value={hours} onChangeText={setHours} keyboardType="number-pad" placeholderTextColor="#94A3B8" style={inputStyle} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: '#64748B', fontSize: 11, marginBottom: 4 }}>Minutos</Text>
                  <TextInput value={minutes} onChangeText={setMinutes} keyboardType="number-pad" placeholderTextColor="#94A3B8" style={inputStyle} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: '#64748B', fontSize: 11, marginBottom: 4 }}>Capacidad</Text>
                  <TextInput value={capacity} onChangeText={setCapacity} keyboardType="number-pad" placeholderTextColor="#94A3B8" style={inputStyle} />
                </View>
              </View>

              {/* Disponibilidad */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <Switch value={available} onValueChange={setAvailable}
                  trackColor={{ false: '#E2E8F0', true: `${COLORS.success}60` }}
                  thumbColor={available ? COLORS.success : '#fff'} />
                <Text style={{ fontWeight: '700', color: '#0F172A' }}>{available ? 'Disponible' : 'No disponible'}</Text>
              </View>
            </CardBox>

            <TouchableOpacity onPress={save}
              style={{ backgroundColor: COLORS.ocean, borderRadius: 14, padding: 14, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8, marginTop: 8 }}>
              <MaterialIcons name="check" size={18} color="#fff" />
              <Text style={{ color: '#fff', fontWeight: '800' }}>{initial ? 'Guardar cambios' : 'Agregar'}</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function RouteManagerScreen() {
  const router = useRouter();
  const { serviceId, recordId } = useLocalSearchParams<{ serviceId: string; recordId: string }>();
  const { records, updateRecord } = useProviderStore();

  const sid = serviceId as ServiceModuleId;
  const def = getServiceDef(sid);
  const record = records[sid]?.find((r) => r.id === recordId);
  const label  = routeLabel(sid);

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing]     = useState<ServiceRouteOption | undefined>(undefined);

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

  const options = record.routeOptions ?? [];

  const save = (opt: ServiceRouteOption) => {
    const exists = options.some((o) => o.id === opt.id);
    const next = exists ? options.map((o) => o.id === opt.id ? opt : o) : [...options, opt];
    updateRecord(sid, { ...record, routeOptions: next });
  };

  const toggle = (id: string) => {
    const next = options.map((o) => o.id === id ? { ...o, isAvailable: !o.isAvailable } : o);
    updateRecord(sid, { ...record, routeOptions: next });
  };

  const remove = (id: string) => {
    Alert.alert('Eliminar', '¿Eliminar este elemento?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: () => {
        const next = options.filter((o) => o.id !== id);
        updateRecord(sid, { ...record, routeOptions: next });
      }},
    ]);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }} edges={['top']}>
      {showModal && (
        <RouteOptionModal
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
        <HeaderCard title={label.title} subtitle={`${record.title} — gestión de ${label.itemName}s y precios`} icon="route" color={def.color} />

        <TouchableOpacity onPress={() => { setEditing(undefined); setShowModal(true); }}
          style={{ backgroundColor: def.color, borderRadius: 14, padding: 14, marginBottom: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <MaterialIcons name="add" size={20} color="#fff" />
          <Text style={{ color: '#fff', fontWeight: '800' }}>{label.addBtn}</Text>
        </TouchableOpacity>

        {options.length === 0 ? (
          <EmptyState icon="route" title="Sin opciones" message={`Agrega ${label.itemName}s con precio para que los clientes puedan reservar.`} buttonLabel={label.addBtn} onPress={() => setShowModal(true)} />
        ) : (
          options.map((opt) => (
            <CardBox key={opt.id}>
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
                <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: opt.isAvailable ? `${def.color}15` : '#F1F5F9', alignItems: 'center', justifyContent: 'center' }}>
                  <MaterialIcons name="route" size={22} color={opt.isAvailable ? def.color : '#94A3B8'} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: '800', color: '#0F172A', fontSize: 14 }}>{opt.name}</Text>
                  {opt.description ? <Text style={{ color: '#64748B', fontSize: 12, marginTop: 2 }} numberOfLines={2}>{opt.description}</Text> : null}
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                    <View style={{ backgroundColor: `${COLORS.success}15`, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 }}>
                      <Text style={{ color: COLORS.success, fontWeight: '800', fontSize: 12 }}>{formatCurrency(opt.price, opt.currency)}</Text>
                    </View>
                    <View style={{ backgroundColor: '#F1F5F9', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 }}>
                      <Text style={{ color: '#64748B', fontWeight: '700', fontSize: 12 }}>{formatDuration(opt.durationHours, opt.durationMinutes)}</Text>
                    </View>
                    <View style={{ backgroundColor: '#F1F5F9', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 }}>
                      <Text style={{ color: '#64748B', fontWeight: '700', fontSize: 12 }}>{opt.capacity} personas</Text>
                    </View>
                    <View style={{ backgroundColor: opt.isAvailable ? `${COLORS.success}15` : '#F1F5F9', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 }}>
                      <Text style={{ color: opt.isAvailable ? COLORS.success : '#94A3B8', fontWeight: '700', fontSize: 12 }}>{opt.isAvailable ? 'Disponible' : 'Pausado'}</Text>
                    </View>
                  </View>
                </View>
              </View>
              <View style={{ height: 1, backgroundColor: '#E2E8F0', marginVertical: 10 }} />
              <View style={{ flexDirection: 'row', gap: 8, justifyContent: 'flex-end' }}>
                <TouchableOpacity onPress={() => toggle(opt.id)}
                  style={{ paddingHorizontal: 10, paddingVertical: 7, borderRadius: 10, borderWidth: 1, borderColor: '#E2E8F0', flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <MaterialIcons name={opt.isAvailable ? 'pause' : 'play-arrow'} size={14} color="#64748B" />
                  <Text style={{ color: '#64748B', fontWeight: '700', fontSize: 12 }}>{opt.isAvailable ? 'Pausar' : 'Activar'}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => { setEditing(opt); setShowModal(true); }}
                  style={{ paddingHorizontal: 10, paddingVertical: 7, borderRadius: 10, borderWidth: 1, borderColor: '#E2E8F0', flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <MaterialIcons name="edit" size={14} color="#64748B" />
                  <Text style={{ color: '#64748B', fontWeight: '700', fontSize: 12 }}>Editar</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => remove(opt.id)}
                  style={{ paddingHorizontal: 10, paddingVertical: 7, borderRadius: 10, borderWidth: 1, borderColor: `${COLORS.danger}40`, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <MaterialIcons name="delete-outline" size={14} color={COLORS.danger} />
                  <Text style={{ color: COLORS.danger, fontWeight: '700', fontSize: 12 }}>Eliminar</Text>
                </TouchableOpacity>
              </View>
            </CardBox>
          ))
        )}

        <InfoBox text={`Los ${label.itemName}s definen las opciones que verán los clientes al reservar. El precio puede ser en MXN o USD.`} />
      </ScrollView>
    </SafeAreaView>
  );
}

import React, { useState } from 'react';
import {
  ScrollView, View, Text, TouchableOpacity, Modal,
  TextInput, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Promotion } from '@/types';
import { COLORS, SERVICE_DEFS } from '@/lib/constants';
import { useProviderStore } from '@/stores/providerStore';
import { CardBox } from '@/components/ui/CardBox';
import { HeaderCard } from '@/components/ui/HeaderCard';
import { StatusPill } from '@/components/ui/StatusPill';
import { InfoBox } from '@/components/ui/InfoBox';
import { EmptyState } from '@/components/ui/EmptyState';

const INITIAL_PROMOS: Promotion[] = [
  {
    id: 'promo-1',
    title: 'Descuento de temporada',
    description: '10% de descuento en salidas de pesca durante julio.',
    discountPercent: 10,
    serviceName: 'Embarcación verificada',
    startDate: '01/07/2026',
    endDate: '31/07/2026',
    status: 'active',
  },
];

function PromoForm({
  onSave,
  onCancel,
}: {
  onSave: (p: Promotion) => void;
  onCancel: () => void;
}) {
  const { records } = useProviderStore();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [discount, setDiscount] = useState('');
  const [serviceName, setServiceName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const allRecords = Object.values(records).flat();

  const validate = () => {
    const e: Record<string, string> = {};
    if (title.trim().length < 3) e.title = 'El título debe tener al menos 3 caracteres.';
    if (title.trim().length > 100) e.title = 'Máximo 100 caracteres.';
    if (description.trim().length < 10) e.description = 'La descripción debe tener al menos 10 caracteres.';
    const d = parseInt(discount, 10);
    if (isNaN(d) || d < 1 || d > 100) e.discount = 'Ingresa un descuento entre 1 y 100.';
    if (!serviceName) e.serviceName = 'Selecciona un servicio.';
    if (!startDate) e.startDate = 'Ingresa la fecha de inicio.';
    if (!endDate) e.endDate = 'Ingresa la fecha de fin.';
    return e;
  };

  const handleSave = () => {
    const e = validate();
    if (Object.keys(e).length > 0) { setErrors(e); return; }
    onSave({
      id: `promo-${Date.now()}`,
      title: title.trim(),
      description: description.trim(),
      discountPercent: parseInt(discount, 10),
      serviceName,
      startDate,
      endDate,
      status: 'active',
    });
  };

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onCancel}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
          <View className="flex-row items-center justify-between px-4 pt-4 pb-2">
            <Text style={{ fontSize: 18, fontWeight: '800', color: '#0F172A' }}>Nueva promoción</Text>
            <TouchableOpacity onPress={onCancel}>
              <MaterialIcons name="close" size={24} color="#0F172A" />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
            <CardBox>
              {/* Title */}
              <View style={{ marginBottom: 12 }}>
                <Text style={{ fontWeight: '700', color: '#0F172A', marginBottom: 6, fontSize: 13 }}>
                  Título (3–100 caracteres)
                </Text>
                <TextInput
                  value={title}
                  onChangeText={setTitle}
                  placeholder="Ej. Descuento de temporada"
                  placeholderTextColor="#94A3B8"
                  style={{
                    backgroundColor: '#F8FAFC', borderRadius: 12, borderWidth: 1,
                    borderColor: errors.title ? COLORS.danger : '#E2E8F0',
                    paddingHorizontal: 14, paddingVertical: 11, fontSize: 14, color: '#0F172A',
                  }}
                />
                {errors.title ? <Text style={{ color: COLORS.danger, fontSize: 12, marginTop: 3 }}>{errors.title}</Text> : null}
              </View>

              {/* Description */}
              <View style={{ marginBottom: 12 }}>
                <Text style={{ fontWeight: '700', color: '#0F172A', marginBottom: 6, fontSize: 13 }}>
                  Descripción (10–300 caracteres)
                </Text>
                <TextInput
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  numberOfLines={3}
                  placeholder="Describe las condiciones de la promoción..."
                  placeholderTextColor="#94A3B8"
                  style={{
                    backgroundColor: '#F8FAFC', borderRadius: 12, borderWidth: 1,
                    borderColor: errors.description ? COLORS.danger : '#E2E8F0',
                    paddingHorizontal: 14, paddingVertical: 11, fontSize: 14, color: '#0F172A',
                    textAlignVertical: 'top', minHeight: 80,
                  }}
                />
                {errors.description ? <Text style={{ color: COLORS.danger, fontSize: 12, marginTop: 3 }}>{errors.description}</Text> : null}
              </View>

              {/* Discount */}
              <View style={{ marginBottom: 12 }}>
                <Text style={{ fontWeight: '700', color: '#0F172A', marginBottom: 6, fontSize: 13 }}>
                  Descuento (1–100%)
                </Text>
                <TextInput
                  value={discount}
                  onChangeText={setDiscount}
                  keyboardType="number-pad"
                  placeholder="Ej. 15"
                  placeholderTextColor="#94A3B8"
                  style={{
                    backgroundColor: '#F8FAFC', borderRadius: 12, borderWidth: 1,
                    borderColor: errors.discount ? COLORS.danger : '#E2E8F0',
                    paddingHorizontal: 14, paddingVertical: 11, fontSize: 14, color: '#0F172A',
                  }}
                />
                {errors.discount ? <Text style={{ color: COLORS.danger, fontSize: 12, marginTop: 3 }}>{errors.discount}</Text> : null}
              </View>

              {/* Service selector */}
              <View style={{ marginBottom: 12 }}>
                <Text style={{ fontWeight: '700', color: '#0F172A', marginBottom: 6, fontSize: 13 }}>
                  Servicio al que aplica
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View className="flex-row gap-2">
                    {allRecords.map((r) => (
                      <TouchableOpacity
                        key={r.id}
                        onPress={() => setServiceName(r.title)}
                        style={{
                          paddingHorizontal: 14,
                          paddingVertical: 8,
                          borderRadius: 999,
                          backgroundColor: serviceName === r.title ? COLORS.ocean : '#F1F5F9',
                          borderWidth: 1,
                          borderColor: serviceName === r.title ? COLORS.ocean : '#E2E8F0',
                        }}
                      >
                        <Text
                          style={{
                            fontWeight: '700',
                            color: serviceName === r.title ? '#fff' : '#0F172A',
                            fontSize: 13,
                          }}
                        >
                          {r.title}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
                {errors.serviceName ? <Text style={{ color: COLORS.danger, fontSize: 12, marginTop: 3 }}>{errors.serviceName}</Text> : null}
              </View>

              {/* Dates */}
              <View className="flex-row gap-3">
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: '700', color: '#0F172A', marginBottom: 6, fontSize: 13 }}>Fecha inicio</Text>
                  <TextInput
                    value={startDate}
                    onChangeText={setStartDate}
                    placeholder="DD/MM/AAAA"
                    placeholderTextColor="#94A3B8"
                    style={{
                      backgroundColor: '#F8FAFC', borderRadius: 12, borderWidth: 1,
                      borderColor: errors.startDate ? COLORS.danger : '#E2E8F0',
                      paddingHorizontal: 12, paddingVertical: 11, fontSize: 14, color: '#0F172A',
                    }}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: '700', color: '#0F172A', marginBottom: 6, fontSize: 13 }}>Fecha fin</Text>
                  <TextInput
                    value={endDate}
                    onChangeText={setEndDate}
                    placeholder="DD/MM/AAAA"
                    placeholderTextColor="#94A3B8"
                    style={{
                      backgroundColor: '#F8FAFC', borderRadius: 12, borderWidth: 1,
                      borderColor: errors.endDate ? COLORS.danger : '#E2E8F0',
                      paddingHorizontal: 12, paddingVertical: 11, fontSize: 14, color: '#0F172A',
                    }}
                  />
                </View>
              </View>
            </CardBox>

            <TouchableOpacity
              onPress={handleSave}
              style={{
                backgroundColor: COLORS.purple,
                borderRadius: 14,
                padding: 14,
                alignItems: 'center',
                flexDirection: 'row',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              <MaterialIcons name="local-offer" size={18} color="#fff" />
              <Text style={{ color: '#fff', fontWeight: '800' }}>Guardar promoción</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export default function PromotionsScreen() {
  const [promos, setPromos] = useState<Promotion[]>(INITIAL_PROMOS);
  const [showForm, setShowForm] = useState(false);

  const handleDelete = (id: string) => {
    Alert.alert('Eliminar promoción', '¿Deseas eliminar esta promoción?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: () => setPromos((p) => p.filter((x) => x.id !== id)) },
    ]);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }} edges={['top']}>
      {showForm && (
        <PromoForm
          onSave={(p) => { setPromos((prev) => [...prev, p]); setShowForm(false); }}
          onCancel={() => setShowForm(false)}
        />
      )}
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
        <HeaderCard
          title="Promociones"
          subtitle="Crea descuentos y paquetes por temporada para atraer más clientes."
          icon="local-offer"
          color={COLORS.purple}
        />

        <TouchableOpacity
          onPress={() => setShowForm(true)}
          style={{
            backgroundColor: COLORS.purple,
            borderRadius: 14,
            padding: 14,
            alignItems: 'center',
            flexDirection: 'row',
            justifyContent: 'center',
            gap: 8,
            marginBottom: 16,
          }}
        >
          <MaterialIcons name="add" size={20} color="#fff" />
          <Text style={{ color: '#fff', fontWeight: '800' }}>Crear promoción</Text>
        </TouchableOpacity>

        {promos.length === 0 ? (
          <EmptyState
            icon="local-offer"
            title="Sin promociones"
            message="Crea tu primera promoción para atraer más clientes."
            buttonLabel="Crear promoción"
            onPress={() => setShowForm(true)}
          />
        ) : (
          promos.map((promo) => (
            <CardBox key={promo.id}>
              <View className="flex-row items-start gap-3">
                <View
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 99,
                    backgroundColor: `${COLORS.purple}20`,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <MaterialIcons name="local-offer" size={22} color={COLORS.purple} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: '800', color: '#0F172A', fontSize: 15 }}>
                    {promo.title}
                  </Text>
                  <Text style={{ color: '#0F172A99', fontSize: 13 }} numberOfLines={2}>
                    {promo.description}
                  </Text>
                  <View className="flex-row flex-wrap gap-2 mt-2">
                    <View
                      style={{
                        backgroundColor: `${COLORS.purple}15`,
                        borderRadius: 999,
                        paddingHorizontal: 10,
                        paddingVertical: 4,
                      }}
                    >
                      <Text style={{ color: COLORS.purple, fontWeight: '800', fontSize: 12 }}>
                        {promo.discountPercent}% OFF
                      </Text>
                    </View>
                    <StatusPill status={promo.status === 'active' ? 'Activo' : 'Vencido'} />
                  </View>
                  <Text style={{ color: '#94A3B8', fontSize: 12, marginTop: 4 }}>
                    {promo.serviceName} · {promo.startDate} – {promo.endDate}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => handleDelete(promo.id)}>
                  <MaterialIcons name="delete-outline" size={22} color={COLORS.danger} />
                </TouchableOpacity>
              </View>
            </CardBox>
          ))
        )}

        <InfoBox text="Las promociones activas se muestran al cliente con el precio original tachado y el precio con descuento aplicado." />
      </ScrollView>
    </SafeAreaView>
  );
}

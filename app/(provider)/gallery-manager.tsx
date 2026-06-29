/**
 * GalleryManagerScreen — Galería de fotos del servicio
 */
import React, { useState } from 'react';
import {
  ScrollView, View, Text, TouchableOpacity, Modal,
  TextInput, KeyboardAvoidingView, Platform, Alert, Image, Switch,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { COLORS, getServiceDef } from '@/lib/constants';
import { useProviderStore } from '@/stores/providerStore';
import { CardBox } from '@/components/ui/CardBox';
import { HeaderCard } from '@/components/ui/HeaderCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { InfoBox } from '@/components/ui/InfoBox';
import type { GalleryPhoto, ServiceModuleId } from '@/types';

const ICON_OPTIONS = [
  { value: 'photo-camera', label: 'Foto general' },
  { value: 'directions-boat', label: 'Embarcación' },
  { value: 'landscape', label: 'Paisaje' },
  { value: 'set-meal', label: 'Pesca / comida' },
  { value: 'people', label: 'Personas' },
  { value: 'star', label: 'Destacada' },
];

// ─── Modal ────────────────────────────────────────────────────────────────────
function PhotoModal({
  initial,
  onSave,
  onClose,
}: {
  initial?: GalleryPhoto;
  onSave: (p: GalleryPhoto) => void;
  onClose: () => void;
}) {
  const [title, setTitle]     = useState(initial?.title ?? '');
  const [desc, setDesc]       = useState(initial?.description ?? '');
  const [uri, setUri]         = useState(initial?.uri ?? '');
  const [icon, setIcon]       = useState(initial ? 'photo-camera' : 'photo-camera');
  const [featured, setFeatured] = useState(initial?.featured ?? false);

  const inputStyle = {
    backgroundColor: '#F8FAFC', borderRadius: 12, borderWidth: 1,
    borderColor: '#E2E8F0', paddingHorizontal: 12, paddingVertical: 10,
    fontSize: 14, color: '#0F172A',
  };

  const save = () => {
    if (!title.trim()) { Alert.alert('El título es obligatorio.'); return; }
    onSave({
      id: initial?.id ?? `ph-${Date.now()}`,
      title: title.trim(),
      description: desc.trim(),
      uri: uri.trim(),
      featured,
    });
    onClose();
  };

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12 }}>
            <Text style={{ fontSize: 18, fontWeight: '800', color: '#0F172A' }}>
              {initial ? 'Editar foto' : 'Agregar foto'}
            </Text>
            <TouchableOpacity onPress={onClose}><MaterialIcons name="close" size={24} color="#0F172A" /></TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
            <CardBox>
              {/* Preview */}
              <View style={{ width: '100%', height: 160, borderRadius: 14, backgroundColor: '#F1F5F9', marginBottom: 14, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }}>
                {uri ? (
                  <Image source={{ uri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                ) : (
                  <View style={{ alignItems: 'center', gap: 8 }}>
                    <MaterialIcons name="photo-camera" size={40} color="#CBD5E1" />
                    <Text style={{ color: '#94A3B8', fontSize: 12 }}>Vista previa de la foto</Text>
                  </View>
                )}
              </View>

              <Text style={{ fontWeight: '700', color: '#0F172A', fontSize: 13, marginBottom: 6 }}>URL de la imagen</Text>
              <TextInput value={uri} onChangeText={setUri} placeholder="https://..." placeholderTextColor="#94A3B8" style={{ ...inputStyle, marginBottom: 14 }} />

              <Text style={{ fontWeight: '700', color: '#0F172A', fontSize: 13, marginBottom: 6 }}>Título *</Text>
              <TextInput value={title} onChangeText={setTitle} placeholder="Ej. Salida de pesca al amanecer" placeholderTextColor="#94A3B8" style={{ ...inputStyle, marginBottom: 14 }} />

              <Text style={{ fontWeight: '700', color: '#0F172A', fontSize: 13, marginBottom: 6 }}>Descripción</Text>
              <TextInput value={desc} onChangeText={setDesc} multiline numberOfLines={3} placeholder="Contexto de la foto..." placeholderTextColor="#94A3B8" style={{ ...inputStyle, textAlignVertical: 'top', minHeight: 70, marginBottom: 14 }} />

              {/* Tipo de foto */}
              <Text style={{ fontWeight: '700', color: '#0F172A', fontSize: 13, marginBottom: 8 }}>Tipo de foto</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
                {ICON_OPTIONS.map((opt) => (
                  <TouchableOpacity key={opt.value} onPress={() => setIcon(opt.value)}
                    style={{ paddingHorizontal: 10, paddingVertical: 7, borderRadius: 10, backgroundColor: icon === opt.value ? COLORS.ocean : '#F1F5F9', borderWidth: 1, borderColor: icon === opt.value ? COLORS.ocean : '#E2E8F0', flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                    <MaterialIcons name={opt.value as any} size={14} color={icon === opt.value ? '#fff' : '#64748B'} />
                    <Text style={{ fontWeight: '700', fontSize: 12, color: icon === opt.value ? '#fff' : '#0F172A' }}>{opt.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Foto principal */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <Switch value={featured} onValueChange={setFeatured}
                  trackColor={{ false: '#E2E8F0', true: `${COLORS.ocean}60` }}
                  thumbColor={featured ? COLORS.ocean : '#fff'} />
                <Text style={{ fontWeight: '700', color: '#0F172A', flex: 1 }}>Usar como foto principal</Text>
                {featured && (
                  <View style={{ backgroundColor: `${COLORS.ocean}15`, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 }}>
                    <Text style={{ color: COLORS.ocean, fontWeight: '800', fontSize: 11 }}>Principal</Text>
                  </View>
                )}
              </View>
            </CardBox>

            <TouchableOpacity onPress={save}
              style={{ backgroundColor: COLORS.ocean, borderRadius: 14, padding: 14, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8, marginTop: 8 }}>
              <MaterialIcons name="check" size={18} color="#fff" />
              <Text style={{ color: '#fff', fontWeight: '800' }}>{initial ? 'Guardar cambios' : 'Agregar a galería'}</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Tarjeta de foto ──────────────────────────────────────────────────────────
function PhotoCard({ photo, onMakeFeatured, onEdit, onDelete }: {
  photo: GalleryPhoto;
  onMakeFeatured: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <CardBox>
      {/* Thumbnail */}
      <View style={{ width: '100%', height: 130, borderRadius: 12, backgroundColor: '#F1F5F9', marginBottom: 12, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }}>
        {photo.uri ? (
          <Image source={{ uri: photo.uri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
        ) : (
          <MaterialIcons name="image" size={36} color="#CBD5E1" />
        )}
        {photo.featured && (
          <View style={{ position: 'absolute', top: 8, right: 8, backgroundColor: COLORS.ocean, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 4 }}>
            <Text style={{ color: '#fff', fontWeight: '800', fontSize: 11 }}>Principal</Text>
          </View>
        )}
      </View>

      <Text style={{ fontWeight: '800', color: '#0F172A', fontSize: 13, marginBottom: 2 }}>{photo.title}</Text>
      {photo.description ? <Text style={{ color: '#64748B', fontSize: 12 }} numberOfLines={2}>{photo.description}</Text> : null}

      <View style={{ height: 1, backgroundColor: '#E2E8F0', marginVertical: 10 }} />
      <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
        {!photo.featured && (
          <TouchableOpacity onPress={onMakeFeatured}
            style={{ paddingHorizontal: 10, paddingVertical: 7, borderRadius: 10, borderWidth: 1, borderColor: '#E2E8F0', flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <MaterialIcons name="star-outline" size={14} color={COLORS.caution} />
            <Text style={{ color: COLORS.caution, fontWeight: '700', fontSize: 12 }}>Principal</Text>
          </TouchableOpacity>
        )}
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
export default function GalleryManagerScreen() {
  const router = useRouter();
  const { serviceId, recordId } = useLocalSearchParams<{ serviceId: string; recordId: string }>();
  const { records, updateRecord } = useProviderStore();

  const sid    = serviceId as ServiceModuleId;
  const def    = getServiceDef(sid);
  const record = records[sid]?.find((r) => r.id === recordId);

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing]     = useState<GalleryPhoto | undefined>(undefined);

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

  const gallery = record.gallery ?? [];

  const save = (photo: GalleryPhoto) => {
    let next: GalleryPhoto[];
    if (photo.featured) {
      // Solo una puede ser principal
      next = gallery.map((p) => ({ ...p, featured: false }));
    } else {
      next = [...gallery];
    }
    const exists = next.some((p) => p.id === photo.id);
    next = exists ? next.map((p) => p.id === photo.id ? photo : p) : [...next, photo];
    updateRecord(sid, { ...record, gallery: next });
  };

  const makeFeatured = (id: string) => {
    const next = gallery.map((p) => ({ ...p, featured: p.id === id }));
    updateRecord(sid, { ...record, gallery: next });
  };

  const remove = (id: string) => {
    Alert.alert('Eliminar foto', '¿Eliminar esta foto de la galería?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: () => {
        updateRecord(sid, { ...record, gallery: gallery.filter((p) => p.id !== id) });
      }},
    ]);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }} edges={['top']}>
      {showModal && (
        <PhotoModal
          initial={editing}
          onSave={save}
          onClose={() => { setShowModal(false); setEditing(undefined); }}
        />
      )}

      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E2E8F0', gap: 12 }}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={24} color="#0F172A" />
        </TouchableOpacity>
        <Text style={{ flex: 1, fontWeight: '800', fontSize: 16, color: '#0F172A' }}>Galería de fotos</Text>
        <Text style={{ color: '#64748B', fontSize: 13 }}>{gallery.length} fotos</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        <HeaderCard title="Galería de fotos" subtitle={`${record.title} — Fotos públicas del servicio`} icon="photo-library" color={def.color} />

        <TouchableOpacity onPress={() => { setEditing(undefined); setShowModal(true); }}
          style={{ backgroundColor: COLORS.ocean, borderRadius: 14, padding: 14, marginBottom: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <MaterialIcons name="add-photo-alternate" size={20} color="#fff" />
          <Text style={{ color: '#fff', fontWeight: '800' }}>Subir foto</Text>
        </TouchableOpacity>

        {gallery.length === 0 ? (
          <EmptyState icon="photo-library" title="Sin fotos" message="Agrega fotos para que los clientes vean tu servicio." buttonLabel="Subir foto" onPress={() => setShowModal(true)} />
        ) : (
          gallery.map((photo) => (
            <PhotoCard key={photo.id} photo={photo}
              onMakeFeatured={() => makeFeatured(photo.id)}
              onEdit={() => { setEditing(photo); setShowModal(true); }}
              onDelete={() => remove(photo.id)}
            />
          ))
        )}

        <InfoBox text="La foto marcada como principal aparece en la vista de listado de servicios. Las demás se muestran en la galería del perfil público." />
      </ScrollView>
    </SafeAreaView>
  );
}

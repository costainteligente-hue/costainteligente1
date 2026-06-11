import React, { useState } from 'react';
import {
  ScrollView, View, Text, TouchableOpacity, Modal,
  TextInput, KeyboardAvoidingView, Platform, Alert, FlatList,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '@/lib/constants';
import { CardBox } from '@/components/ui/CardBox';
import { HeaderCard } from '@/components/ui/HeaderCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { InfoBox } from '@/components/ui/InfoBox';

interface CatchPost {
  id: string;
  userName: string;
  species: string;
  zoneName: string;
  weightKg: number;
  catchDate: string;
  comment: string;
  isMine: boolean;
}

const INITIAL_POSTS: CatchPost[] = [
  { id: 'p1', userName: 'Carlos M.', species: 'Pez vela', zoneName: 'Bajo de Chila', weightKg: 18.5, catchDate: '12/07/2026', comment: '¡Increíble salida! Captura y liberación.', isMine: false },
  { id: 'p2', userName: 'Ana T.', species: 'Dorado', zoneName: 'Punta Ixtapa', weightKg: 7.2, catchDate: '10/07/2026', comment: 'Agua cristalina, condiciones perfectas.', isMine: false },
  { id: 'p3', userName: 'Tú', species: 'Marlín azul', zoneName: 'Morro de Petatlán', weightKg: 42.0, catchDate: '08/07/2026', comment: 'Mi mejor captura hasta ahora.', isMine: true },
];

const SPECIES_OPTIONS = ['Pez vela', 'Marlín azul', 'Marlín rayado', 'Dorado', 'Atún aleta amarilla', 'Wahoo', 'Sierra', 'Jurel', 'Huachinango', 'Robalo'];
const ZONE_OPTIONS = ['Bajo de Chila', 'La Ropa', 'Punta Ixtapa', 'Bahía de Zihuatanejo', 'Morro de Petatlán'];

function NewPostModal({ onSave, onClose }: { onSave: (p: CatchPost) => void; onClose: () => void }) {
  const [species, setSpecies] = useState('');
  const [zone, setZone] = useState('');
  const [weight, setWeight] = useState('');
  const [date, setDate] = useState('');
  const [comment, setComment] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!species) e.species = 'Selecciona la especie capturada.';
    if (!zone) e.zone = 'Selecciona la zona de captura.';
    if (!weight || parseFloat(weight) <= 0) e.weight = 'Ingresa el peso en kilogramos (mayor a 0).';
    if (!date.trim()) e.date = 'Ingresa la fecha de captura.';
    return e;
  };

  const handleSave = () => {
    const e = validate();
    if (Object.keys(e).length > 0) { setErrors(e); return; }
    onSave({
      id: Date.now().toString(),
      userName: 'Tú',
      species,
      zoneName: zone,
      weightKg: parseFloat(weight),
      catchDate: date,
      comment: comment.trim(),
      isMine: true,
    });
  };

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
          <View className="flex-row items-center justify-between px-4 pt-4 pb-2">
            <Text style={{ fontSize: 18, fontWeight: '800', color: '#0F172A' }}>Nueva captura</Text>
            <TouchableOpacity onPress={onClose}>
              <MaterialIcons name="close" size={24} color="#0F172A" />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
            {/* Photo placeholder */}
            <TouchableOpacity
              style={{
                height: 160,
                borderRadius: 18,
                backgroundColor: `${COLORS.ocean}12`,
                borderWidth: 2,
                borderColor: `${COLORS.ocean}30`,
                borderStyle: 'dashed',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 16,
                gap: 8,
              }}
            >
              <MaterialIcons name="add-photo-alternate" size={40} color={COLORS.ocean} />
              <Text style={{ color: COLORS.ocean, fontWeight: '700' }}>Agregar foto (máx. 3 · 5 MB c/u)</Text>
            </TouchableOpacity>

            {/* Species */}
            <Text style={{ fontWeight: '700', color: '#0F172A', marginBottom: 8, fontSize: 13 }}>Especie capturada *</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: errors.species ? 4 : 14 }}>
              <View className="flex-row gap-2">
                {SPECIES_OPTIONS.map((s) => (
                  <TouchableOpacity
                    key={s}
                    onPress={() => { setSpecies(s); setErrors((e) => ({ ...e, species: '' })); }}
                    style={{
                      paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999,
                      backgroundColor: species === s ? COLORS.ocean : '#F1F5F9',
                      borderWidth: 1, borderColor: species === s ? COLORS.ocean : '#E2E8F0',
                    }}
                  >
                    <Text style={{ fontWeight: '700', color: species === s ? '#fff' : '#0F172A', fontSize: 13 }}>{s}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
            {errors.species ? <Text style={{ color: COLORS.danger, fontSize: 12, marginBottom: 12 }}>{errors.species}</Text> : null}

            {/* Zone */}
            <Text style={{ fontWeight: '700', color: '#0F172A', marginBottom: 8, fontSize: 13 }}>Zona de captura *</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: errors.zone ? 4 : 14 }}>
              <View className="flex-row gap-2">
                {ZONE_OPTIONS.map((z) => (
                  <TouchableOpacity
                    key={z}
                    onPress={() => { setZone(z); setErrors((e) => ({ ...e, zone: '' })); }}
                    style={{
                      paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999,
                      backgroundColor: zone === z ? COLORS.success : '#F1F5F9',
                      borderWidth: 1, borderColor: zone === z ? COLORS.success : '#E2E8F0',
                    }}
                  >
                    <Text style={{ fontWeight: '700', color: zone === z ? '#fff' : '#0F172A', fontSize: 13 }}>{z}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
            {errors.zone ? <Text style={{ color: COLORS.danger, fontSize: 12, marginBottom: 12 }}>{errors.zone}</Text> : null}

            {/* Weight + date row */}
            <View className="flex-row gap-3 mb-4">
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: '700', color: '#0F172A', marginBottom: 6, fontSize: 13 }}>Peso (kg) *</Text>
                <TextInput
                  value={weight}
                  onChangeText={(v) => { setWeight(v); setErrors((e) => ({ ...e, weight: '' })); }}
                  keyboardType="decimal-pad"
                  placeholder="Ej. 12.5"
                  placeholderTextColor="#94A3B8"
                  style={{
                    backgroundColor: '#fff', borderRadius: 12, borderWidth: 1,
                    borderColor: errors.weight ? COLORS.danger : '#E2E8F0',
                    paddingHorizontal: 12, paddingVertical: 11, fontSize: 14, color: '#0F172A',
                  }}
                />
                {errors.weight ? <Text style={{ color: COLORS.danger, fontSize: 11, marginTop: 2 }}>{errors.weight}</Text> : null}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: '700', color: '#0F172A', marginBottom: 6, fontSize: 13 }}>Fecha *</Text>
                <TextInput
                  value={date}
                  onChangeText={(v) => { setDate(v); setErrors((e) => ({ ...e, date: '' })); }}
                  placeholder="DD/MM/AAAA"
                  placeholderTextColor="#94A3B8"
                  style={{
                    backgroundColor: '#fff', borderRadius: 12, borderWidth: 1,
                    borderColor: errors.date ? COLORS.danger : '#E2E8F0',
                    paddingHorizontal: 12, paddingVertical: 11, fontSize: 14, color: '#0F172A',
                  }}
                />
                {errors.date ? <Text style={{ color: COLORS.danger, fontSize: 11, marginTop: 2 }}>{errors.date}</Text> : null}
              </View>
            </View>

            {/* Comment */}
            <Text style={{ fontWeight: '700', color: '#0F172A', marginBottom: 6, fontSize: 13 }}>Comentario (opcional)</Text>
            <TextInput
              value={comment}
              onChangeText={setComment}
              multiline numberOfLines={3}
              placeholder="Cuenta tu experiencia..."
              placeholderTextColor="#94A3B8"
              style={{
                backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0',
                paddingHorizontal: 12, paddingVertical: 11, fontSize: 14, color: '#0F172A',
                textAlignVertical: 'top', minHeight: 80, marginBottom: 16,
              }}
            />

            <TouchableOpacity
              onPress={handleSave}
              style={{
                backgroundColor: COLORS.ocean, borderRadius: 14, padding: 14,
                alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8,
              }}
            >
              <MaterialIcons name="publish" size={20} color="#fff" />
              <Text style={{ color: '#fff', fontWeight: '800' }}>Publicar captura</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function CatchCard({ post, onDelete }: { post: CatchPost; onDelete?: () => void }) {
  return (
    <CardBox>
      {/* Photo placeholder */}
      <View
        style={{
          height: 140,
          borderRadius: 14,
          backgroundColor: `${COLORS.ocean}15`,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 12,
          borderWidth: 1,
          borderColor: `${COLORS.ocean}20`,
        }}
      >
        <MaterialIcons name="set-meal" size={40} color={COLORS.ocean} />
      </View>

      <View className="flex-row items-start justify-between">
        <View style={{ flex: 1 }}>
          <Text style={{ fontWeight: '800', color: '#0F172A', fontSize: 16 }}>{post.species}</Text>
          <Text style={{ color: '#0F172A99', fontSize: 13 }}>
            {post.weightKg} kg · {post.zoneName}
          </Text>
          <Text style={{ color: '#94A3B8', fontSize: 12, marginTop: 2 }}>
            {post.userName} · {post.catchDate}
          </Text>
        </View>
        {post.isMine && onDelete && (
          <TouchableOpacity
            onPress={() =>
              Alert.alert(
                '¿Eliminar esta publicación?',
                'Esta acción no se puede deshacer.',
                [
                  { text: 'Cancelar', style: 'cancel' },
                  { text: 'Eliminar', style: 'destructive', onPress: onDelete },
                ],
              )
            }
          >
            <MaterialIcons name="delete-outline" size={22} color={COLORS.danger} />
          </TouchableOpacity>
        )}
      </View>

      {post.comment ? (
        <Text style={{ color: '#0F172A99', fontSize: 13, marginTop: 8, lineHeight: 18 }}>
          {post.comment}
        </Text>
      ) : null}
    </CardBox>
  );
}

export default function CommunityScreen() {
  const [posts, setPosts] = useState<CatchPost[]>(INITIAL_POSTS);
  const [showNewPost, setShowNewPost] = useState(false);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }} edges={['top']}>
      {showNewPost && (
        <NewPostModal
          onSave={(p) => { setPosts((prev) => [p, ...prev]); setShowNewPost(false); }}
          onClose={() => setShowNewPost(false)}
        />
      )}

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
        <HeaderCard
          title="Comunidad"
          subtitle="Comparte tus capturas y conecta con otros pescadores."
          icon="people"
          color={COLORS.ocean}
        />

        <TouchableOpacity
          onPress={() => setShowNewPost(true)}
          style={{
            backgroundColor: COLORS.ocean, borderRadius: 14, padding: 14,
            alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 16,
          }}
        >
          <MaterialIcons name="add-photo-alternate" size={20} color="#fff" />
          <Text style={{ color: '#fff', fontWeight: '800' }}>Publicar mi captura</Text>
        </TouchableOpacity>

        {posts.length === 0 ? (
          <EmptyState
            icon="photo-camera"
            title="Sin publicaciones"
            message="Sé el primero en compartir una captura."
            buttonLabel="Publicar captura"
            onPress={() => setShowNewPost(true)}
          />
        ) : (
          posts.map((post) => (
            <CatchCard
              key={post.id}
              post={post}
              onDelete={post.isMine ? () => setPosts((prev) => prev.filter((p) => p.id !== post.id)) : undefined}
            />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

/**
 * ImageUploader — Componente reutilizable de carga de imágenes
 * Proveedor → fotos del negocio
 * Cliente → fotos de capturas
 * Admin → fotos de zonas / coordenadas
 */
import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, Image, ScrollView,
  ActivityIndicator, Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS } from '@/lib/constants';
import { pickImage, uploadImage } from '@/lib/utils/imageUpload';

interface Props {
  images: string[];
  onChange: (uris: string[]) => void;
  maxImages?: number;
  uploadPath?: string;   // e.g. 'providers/123/photos'
  label?: string;
  hint?: string;
  allowCamera?: boolean;
}

export function ImageUploader({
  images,
  onChange,
  maxImages = 5,
  uploadPath,
  label = 'Fotos',
  hint,
  allowCamera = true,
}: Props) {
  const [uploading, setUploading] = useState<number | null>(null); // index being uploaded

  const add = async (source: 'library' | 'camera') => {
    if (images.length >= maxImages) {
      Alert.alert(`Máximo ${maxImages} fotos`);
      return;
    }
    const picked = await pickImage({ source, allowsMultipleSelection: source === 'library', quality: 0.75 });
    if (!picked.length) return;

    for (const item of picked) {
      if (images.length >= maxImages) break;
      const idx = images.length;
      setUploading(idx);
      try {
        const finalUri = uploadPath
          ? await uploadImage(item.uri, `${uploadPath}/${Date.now()}.jpg`)
          : item.uri;
        onChange([...images, finalUri]);
      } catch {
        onChange([...images, item.uri]);
      }
    }
    setUploading(null);
  };

  const remove = (i: number) => {
    Alert.alert('Eliminar foto', '¿Eliminar esta imagen?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: () => onChange(images.filter((_, j) => j !== i)) },
    ]);
  };

  return (
    <View>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <Text style={{ fontWeight: '900', color: '#0F172A', fontSize: 15 }}>{label}</Text>
        <Text style={{ color: 'rgba(15,23,42,0.62)', fontSize: 12 }}>{images.length}/{maxImages}</Text>
      </View>
      {hint && <Text style={{ color: 'rgba(15,23,42,0.62)', fontSize: 12, marginBottom: 12, lineHeight: 18 }}>{hint}</Text>}

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
        {images.map((uri, i) => (
          <View key={i} style={{ position: 'relative' }}>
            <Image source={{ uri }} style={{ width: 96, height: 96, borderRadius: 14 }} resizeMode="cover" />
            {uploading === i && (
              <View style={{ position: 'absolute', inset: 0, borderRadius: 14, backgroundColor: 'rgba(15,23,42,0.55)', alignItems: 'center', justifyContent: 'center' }}>
                <ActivityIndicator color="#fff" size="small" />
              </View>
            )}
            <TouchableOpacity onPress={() => remove(i)}
              style={{ position: 'absolute', top: 5, right: 5, backgroundColor: 'rgba(220,38,38,0.85)', borderRadius: 999, padding: 4 }}>
              <MaterialIcons name="close" size={12} color="#fff" />
            </TouchableOpacity>
          </View>
        ))}

        {/* Add button */}
        {images.length < maxImages && (
          <TouchableOpacity
            onPress={() => {
              if (!allowCamera) { add('library'); return; }
              Alert.alert('Agregar foto', 'Selecciona la fuente', [
                { text: 'Galería', onPress: () => add('library') },
                { text: 'Cámara',  onPress: () => add('camera') },
                { text: 'Cancelar', style: 'cancel' },
              ]);
            }}
            style={{ width: 96, height: 96, borderRadius: 14, backgroundColor: '#F1F5F9', borderWidth: 2, borderColor: '#E2E8F0', borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', gap: 4 }}
          >
            <MaterialIcons name="add-photo-alternate" size={28} color="#94A3B8" />
            <Text style={{ color: '#94A3B8', fontSize: 10, fontWeight: '700', textAlign: 'center' }}>
              {uploading !== null ? 'Subiendo...' : 'Agregar'}
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

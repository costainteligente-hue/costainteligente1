import React, { useState } from 'react';
import {
  ScrollView, View, Text, TouchableOpacity, ActivityIndicator,
  Modal, StyleSheet, Platform, Image,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { eq } from 'drizzle-orm';
import { getDb } from '@/lib/db/client';
import { tutorials as tutorialsTable } from '@/lib/db/schema';
import { COLORS } from '@/lib/constants';
import { CardBox } from '@/components/ui/CardBox';
import { HeaderCard } from '@/components/ui/HeaderCard';
import { InfoBox } from '@/components/ui/InfoBox';

interface Tutorial {
  id: string;
  title: string;
  description: string | null;
  youtube_url: string;
  level: 'principiante' | 'intermedio' | 'avanzado' | null;
}

// Extract YouTube video ID from any YouTube URL
function getYouTubeId(url: string): string | null {
  const patterns = [
    /youtube\.com\/watch\?v=([^&]+)/,
    /youtu\.be\/([^?]+)/,
    /youtube\.com\/embed\/([^?]+)/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

// Seed data para cuando la base de datos está vacía
const SEED_TUTORIALS: Tutorial[] = [
  {
    id: 't1',
    title: 'Técnicas básicas de lanzamiento para principiantes',
    description: 'Aprende las técnicas fundamentales de lanzamiento con caña spinning desde la orilla.',
    youtube_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    level: 'principiante',
  },
  {
    id: 't2',
    title: 'Cómo preparar carnadas naturales',
    description: 'Técnicas de preparación de sardina, camarón y calamar para pesca costera.',
    youtube_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    level: 'principiante',
  },
  {
    id: 't3',
    title: 'Pesca de pez vela: técnica de tróleo',
    description: 'Guía completa de pesca de pez vela con tróleo en aguas del Pacífico mexicano.',
    youtube_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    level: 'intermedio',
  },
  {
    id: 't4',
    title: 'Jigging vertical para atún en aguas profundas',
    description: 'Técnica avanzada de jigging vertical para capturar atún aleta amarilla.',
    youtube_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    level: 'avanzado',
  },
];

function useTutorials() {
  return useQuery({
    queryKey: ['tutorials'],
    queryFn: async () => {
      const db = getDb();
      const rows = await db
        .select()
        .from(tutorialsTable)
        .where(eq(tutorialsTable.isActive, true));
      return rows as Tutorial[];
    },
    staleTime: 1000 * 60 * 60 * 24,
    gcTime: 1000 * 60 * 60 * 48,
    retry: 1,
  });
}

const LEVEL_COLORS: Record<string, string> = {
  principiante: COLORS.success,
  intermedio: COLORS.warning,
  avanzado: COLORS.danger,
};

// YouTube player modal — uses WebView on native, iframe on web
function YouTubeModal({
  videoId,
  title,
  onClose,
}: {
  videoId: string;
  title: string;
  onClose: () => void;
}) {
  const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=0&rel=0&modestbranding=1`;

  // Web: render inline iframe inside a Modal-like overlay
  if (Platform.OS === 'web') {
    return (
      <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
        <SafeAreaView style={{ flex: 1, backgroundColor: '#000' }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 16,
              paddingVertical: 12,
              backgroundColor: '#0F172A',
              gap: 12,
            }}
          >
            <TouchableOpacity onPress={onClose}>
              <MaterialIcons name="close" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={{ color: '#fff', fontWeight: '700', flex: 1, fontSize: 14 }} numberOfLines={1}>
              {title}
            </Text>
          </View>
          {/* @ts-ignore — iframe is valid on web */}
          <iframe
            src={embedUrl}
            style={{ flex: 1, width: '100%', border: 'none', backgroundColor: '#000' }}
            allowFullScreen
            title={title}
          />
        </SafeAreaView>
      </Modal>
    );
  }

  // Native: use WebView via dynamic require so it's not bundled on web
  const WebView = require('react-native-webview').WebView;
  const html = `
    <!DOCTYPE html><html>
      <head><meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>*{margin:0;padding:0;box-sizing:border-box}body{background:#000}
        .w{position:relative;width:100%;padding-top:56.25%}
        iframe{position:absolute;top:0;left:0;width:100%;height:100%}</style>
      </head>
      <body><div class="w">
        <iframe src="${embedUrl}" frameborder="0" allowfullscreen></iframe>
      </div></body>
    </html>`;

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: '#000' }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 16,
            paddingVertical: 12,
            backgroundColor: '#0F172A',
            gap: 12,
          }}
        >
          <TouchableOpacity onPress={onClose}>
            <MaterialIcons name="close" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={{ color: '#fff', fontWeight: '700', flex: 1, fontSize: 14 }} numberOfLines={1}>
            {title}
          </Text>
        </View>
        <WebView
          source={{ html }}
          style={{ flex: 1, backgroundColor: '#000' }}
          allowsInlineMediaPlayback
          mediaPlaybackRequiresUserAction
          javaScriptEnabled
          domStorageEnabled
        />
      </SafeAreaView>
    </Modal>
  );
}

// Tutorial card with thumbnail + play button
function TutorialCard({ item, onPlay }: { item: Tutorial; onPlay: () => void }) {
  const videoId = getYouTubeId(item.youtube_url);
  const thumbUrl = videoId
    ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`
    : null;
  const levelColor = item.level ? (LEVEL_COLORS[item.level] ?? COLORS.ocean) : COLORS.ocean;

  return (
    <CardBox>
      {/* Thumbnail with play overlay */}
      <TouchableOpacity
        onPress={onPlay}
        activeOpacity={0.8}
        style={{
          height: 160,
          borderRadius: 14,
          backgroundColor: '#0F172A',
          marginBottom: 12,
          overflow: 'hidden',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {thumbUrl ? (
          <Image
            source={{ uri: thumbUrl }}
            style={StyleSheet.absoluteFillObject}
            resizeMode="cover"
          />
        ) : null}

        {/* Dark overlay */}
        <View
          style={{
            ...StyleSheet.absoluteFillObject,
            backgroundColor: 'rgba(15,23,42,0.55)',
          }}
        />

        {/* Play button */}
        <View
          style={{
            width: 60,
            height: 60,
            borderRadius: 99,
            backgroundColor: 'rgba(255,255,255,0.92)',
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 5,
          }}
        >
          <MaterialIcons name="play-arrow" size={36} color={COLORS.ocean} />
        </View>

        {/* Level badge */}
        {item.level && (
          <View
            style={{
              position: 'absolute',
              top: 10,
              right: 10,
              backgroundColor: levelColor,
              borderRadius: 999,
              paddingHorizontal: 8,
              paddingVertical: 3,
            }}
          >
            <Text style={{ color: '#fff', fontSize: 10, fontWeight: '800' }}>
              {item.level.charAt(0).toUpperCase() + item.level.slice(1)}
            </Text>
          </View>
        )}

        {/* YouTube icon */}
        <View style={{ position: 'absolute', bottom: 10, left: 10 }}>
          <MaterialIcons name="smart-display" size={22} color="rgba(255,255,255,0.7)" />
        </View>
      </TouchableOpacity>

      {/* Info */}
      <Text style={{ fontWeight: '800', color: '#0F172A', fontSize: 15, marginBottom: 4 }}>
        {item.title}
      </Text>
      {item.description && (
        <Text style={{ color: '#0F172A99', fontSize: 13, lineHeight: 19 }}>
          {item.description}
        </Text>
      )}

      <TouchableOpacity
        onPress={onPlay}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          marginTop: 10,
          alignSelf: 'flex-start',
          backgroundColor: `${COLORS.ocean}15`,
          borderRadius: 10,
          paddingHorizontal: 12,
          paddingVertical: 6,
          borderWidth: 1,
          borderColor: `${COLORS.ocean}30`,
        }}
      >
        <MaterialIcons name="play-circle-outline" size={16} color={COLORS.ocean} />
        <Text style={{ color: COLORS.ocean, fontWeight: '800', fontSize: 13 }}>Ver tutorial</Text>
      </TouchableOpacity>
    </CardBox>
  );
}

export default function TutorialsScreen() {
  const { data, isLoading } = useTutorials();
  const [playing, setPlaying] = useState<Tutorial | null>(null);

  const tutorials = data && data.length > 0 ? data : SEED_TUTORIALS;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }} edges={['top']}>
      {playing && getYouTubeId(playing.youtube_url) && (
        <YouTubeModal
          videoId={getYouTubeId(playing.youtube_url)!}
          title={playing.title}
          onClose={() => setPlaying(null)}
        />
      )}

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        <HeaderCard
          title="Tutoriales de pesca"
          subtitle="Videos con técnicas, trucos y guías para todos los niveles."
          icon="play-circle-outline"
          color={COLORS.ocean}
        />

        {isLoading ? (
          <View style={{ alignItems: 'center', paddingVertical: 40 }}>
            <ActivityIndicator color={COLORS.ocean} size="large" />
          </View>
        ) : (
          tutorials.map((item) => (
            <TutorialCard key={item.id} item={item} onPlay={() => setPlaying(item)} />
          ))
        )}

        <InfoBox text="Los tutoriales se reproducen dentro de la app usando YouTube embed. Asegúrate de tener conexión a internet para verlos." />
      </ScrollView>
    </SafeAreaView>
  );
}

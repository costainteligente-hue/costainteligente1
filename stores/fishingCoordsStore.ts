/**
 * fishingCoordsStore — Zustand store para coordenadas de pesca
 * Admin puede CRUD, clientes leen. Preparado para unlock futuro.
 */
import { create } from 'zustand';
import type { FishingCoordinate } from '@/types/fishing-coords';

const SEED: FishingCoordinate[] = [
  {
    id: 'fc1',
    name: 'Bajo de Chila — pez vela',
    latitude: 17.58,
    longitude: -101.62,
    photoUrl: '',
    description: 'Zona de aguas profundas a 12 millas náuticas del muelle principal. Alta concentración de pez vela de mayo a agosto.',
    registeredAt: '2026-06-01T08:00:00Z',
    isLocked: false,
    unlockedByDefault: true,
    createdBy: 'admin',
  },
  {
    id: 'fc2',
    name: 'Playa La Ropa — robalo',
    latitude: 17.628,
    longitude: -101.551,
    photoUrl: '',
    description: 'Pesca nocturna de robalo desde la orilla. Mejor en marea baja con carnada viva.',
    registeredAt: '2026-06-15T08:00:00Z',
    isLocked: false,
    unlockedByDefault: true,
    createdBy: 'admin',
  },
  {
    id: 'fc3',
    name: 'Punta Ixtapa — atún',
    latitude: 17.672,
    longitude: -101.644,
    photoUrl: '',
    description: 'Corriente fría que atrae atún aleta amarilla en temporada fría (noviembre-febrero).',
    registeredAt: '2026-07-01T08:00:00Z',
    isLocked: false,
    unlockedByDefault: true,
    createdBy: 'admin',
  },
];

interface FishingCoordsState {
  coords: FishingCoordinate[];
  addCoord:    (c: Omit<FishingCoordinate, 'id' | 'registeredAt' | 'isLocked' | 'unlockedByDefault'>) => void;
  updateCoord: (id: string, data: Partial<FishingCoordinate>) => void;
  deleteCoord: (id: string) => void;
}

export const useFishingCoordsStore = create<FishingCoordsState>((set) => ({
  coords: SEED,

  addCoord: (data) =>
    set((state) => ({
      coords: [
        ...state.coords,
        {
          ...data,
          id: `fc_${Date.now()}`,
          registeredAt: new Date().toISOString(),
          isLocked: false,
          unlockedByDefault: true,
        },
      ],
    })),

  updateCoord: (id, data) =>
    set((state) => ({
      coords: state.coords.map((c) => (c.id === id ? { ...c, ...data } : c)),
    })),

  deleteCoord: (id) =>
    set((state) => ({ coords: state.coords.filter((c) => c.id !== id) })),
}));

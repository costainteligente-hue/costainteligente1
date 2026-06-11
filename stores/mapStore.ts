import { create } from 'zustand';

type LevelFilter = 'todos' | 'principiante' | 'intermedio' | 'avanzado';

interface MapState {
  levelFilter: LevelFilter;
  typeFilter: string | null;
  speciesFilter: string | null;
  selectedZoneId: string | null;
  setLevelFilter: (level: LevelFilter) => void;
  setTypeFilter: (type: string | null) => void;
  setSpeciesFilter: (species: string | null) => void;
  setSelectedZoneId: (id: string | null) => void;
  clearFilters: () => void;
}

export const useMapStore = create<MapState>((set) => ({
  levelFilter: 'todos',
  typeFilter: null,
  speciesFilter: null,
  selectedZoneId: null,

  setLevelFilter: (levelFilter) => set({ levelFilter }),
  setTypeFilter: (typeFilter) => set({ typeFilter }),
  setSpeciesFilter: (speciesFilter) => set({ speciesFilter }),
  setSelectedZoneId: (selectedZoneId) => set({ selectedZoneId }),
  clearFilters: () =>
    set({ levelFilter: 'todos', typeFilter: null, speciesFilter: null }),
}));

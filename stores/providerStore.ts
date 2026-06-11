import { create } from 'zustand';
import { BusinessRecord, ServiceModuleId } from '@/types';
import { SEED_RECORDS } from '@/lib/seed-data';

interface ProviderState {
  selectedServices: Set<ServiceModuleId>;
  records: Record<string, BusinessRecord[]>;
  confirmBeforeDelete: boolean;
  // Actions
  toggleService: (id: ServiceModuleId) => void;
  setSelectedServices: (ids: ServiceModuleId[]) => void;
  addRecord: (serviceId: string, record: BusinessRecord) => void;
  updateRecord: (serviceId: string, record: BusinessRecord) => void;
  deleteRecord: (serviceId: string, recordId: string) => void;
  setConfirmBeforeDelete: (value: boolean) => void;
}

const ALL_SERVICE_IDS: ServiceModuleId[] = [
  'boat', 'guide', 'sport', 'rental', 'restaurant', 'store', 'fishMarket', 'transport',
];

export const useProviderStore = create<ProviderState>((set) => ({
  selectedServices: new Set(ALL_SERVICE_IDS),
  records: SEED_RECORDS as Record<string, BusinessRecord[]>,
  confirmBeforeDelete: true,

  toggleService: (id) =>
    set((state) => {
      const next = new Set(state.selectedServices);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return { selectedServices: next };
    }),

  setSelectedServices: (ids) =>
    set({ selectedServices: new Set(ids) }),

  addRecord: (serviceId, record) =>
    set((state) => ({
      records: {
        ...state.records,
        [serviceId]: [...(state.records[serviceId] ?? []), record],
      },
    })),

  updateRecord: (serviceId, record) =>
    set((state) => ({
      records: {
        ...state.records,
        [serviceId]: (state.records[serviceId] ?? []).map((r) =>
          r.id === record.id ? record : r,
        ),
      },
    })),

  deleteRecord: (serviceId, recordId) =>
    set((state) => ({
      records: {
        ...state.records,
        [serviceId]: (state.records[serviceId] ?? []).filter((r) => r.id !== recordId),
      },
    })),

  setConfirmBeforeDelete: (confirmBeforeDelete) => set({ confirmBeforeDelete }),
}));

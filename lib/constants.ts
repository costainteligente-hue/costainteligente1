import { ServiceModuleId } from '@/types';

// ─── Zihuatanejo coordinates ─────────────────────────────────────────────────
export const ZIHUATANEJO = {
  latitude: 17.6392,
  longitude: -101.5507,
  latitudeDelta: 0.15,
  longitudeDelta: 0.15,
};

// ─── Emergency contacts (SOS) ─────────────────────────────────────────────────
export const EMERGENCY_CONTACTS = [
  { id: 'semar', name: 'SEMAR (Marina)', phone: '8002013100' },
  { id: 'cruz_roja', name: 'Cruz Roja Zihuatanejo', phone: '7555542009' },
  { id: 'capitania', name: 'Capitanía de Puerto', phone: '7555542030' },
];

// ─── App colors ───────────────────────────────────────────────────────────────
export const COLORS = {
  navy: '#0F172A',
  ocean: '#0F766E',
  aqua: '#14B8A6',
  bg: '#F8FAFC',
  surface: '#FFFFFF',
  line: '#E2E8F0',
  success: '#16A34A',
  warning: '#EA580C',
  caution: '#CA8A04',
  danger: '#DC2626',
  info: '#2563EB',
  purple: '#7C3AED',
  brown: '#92400E',
  olive: '#4D7C0F',
} as const;

// ─── Service module definitions ───────────────────────────────────────────────
export interface ServiceDef {
  id: ServiceModuleId;
  name: string;
  icon: string;       // @expo/vector-icons MaterialIcons name
  color: string;
  description: string;
  hasCatalog: boolean;
  requiresNavigationLicense: boolean;
  requiresBusinessLicense: boolean;
}

export const SERVICE_DEFS: ServiceDef[] = [
  {
    id: 'boat',
    name: 'Pescador de lancha',
    icon: 'directions-boat',
    color: COLORS.ocean,
    description: 'Lanchas, salidas, horarios, precios, especies objetivo y licencia de navegación.',
    hasCatalog: false,
    requiresNavigationLicense: true,
    requiresBusinessLicense: false,
  },
  {
    id: 'guide',
    name: 'Guía de pesca',
    icon: 'explore',
    color: COLORS.success,
    description: 'Acompañamiento, asesoría, clases, zonas de trabajo y experiencia.',
    hasCatalog: false,
    requiresNavigationLicense: false,
    requiresBusinessLicense: false,
  },
  {
    id: 'sport',
    name: 'Pesca deportiva',
    icon: 'emoji-events',
    color: COLORS.warning,
    description: 'Paquetes deportivos, torneos, pesca costera, pesca de altura y catch and release.',
    hasCatalog: false,
    requiresNavigationLicense: true,
    requiresBusinessLicense: false,
  },
  {
    id: 'rental',
    name: 'Renta de embarcaciones',
    icon: 'sailing',
    color: COLORS.info,
    description: 'Embarcaciones en renta, disponibilidad, tarifas, punto de salida y licencia.',
    hasCatalog: false,
    requiresNavigationLicense: true,
    requiresBusinessLicense: false,
  },
  {
    id: 'restaurant',
    name: 'Restaurante de mariscos',
    icon: 'restaurant',
    color: COLORS.brown,
    description: 'Menú, especialidades, horarios, reservaciones, promociones y licencia.',
    hasCatalog: true,
    requiresNavigationLicense: false,
    requiresBusinessLicense: true,
  },
  {
    id: 'store',
    name: 'Tienda de pesca',
    icon: 'storefront',
    color: COLORS.purple,
    description: 'Productos, marcas, accesorios, promociones, horarios y licencia.',
    hasCatalog: true,
    requiresNavigationLicense: false,
    requiresBusinessLicense: true,
  },
  {
    id: 'fishMarket',
    name: 'Pescadería',
    icon: 'set-meal',
    color: '#118AB2',
    description: 'Productos frescos, precios, limpieza, fileteado, empaque y licencia.',
    hasCatalog: true,
    requiresNavigationLicense: false,
    requiresBusinessLicense: true,
  },
  {
    id: 'transport',
    name: 'Transporte turístico',
    icon: 'airport-shuttle',
    color: COLORS.olive,
    description: 'Traslados, rutas, capacidad, horarios y tarifas.',
    hasCatalog: false,
    requiresNavigationLicense: false,
    requiresBusinessLicense: false,
  },
];

export function getServiceDef(id: ServiceModuleId): ServiceDef {
  return SERVICE_DEFS.find((s) => s.id === id) ?? SERVICE_DEFS[0];
}

export function serviceSupportsOptions(id: ServiceModuleId): boolean {
  return ['boat', 'rental', 'sport', 'guide', 'transport'].includes(id);
}

export function formatCurrency(amount: number, currency = 'MXN'): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDuration(hours: number, minutes: number): string {
  return `${hours}h ${String(minutes).padStart(2, '0')}min`;
}

export function dateKey(year: number, month: number, day: number): number {
  return year * 10000 + month * 100 + day;
}

export const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

// ─── Roles ───────────────────────────────────────────────────────────────────
export type UserRole = 'client' | 'provider' | 'admin';

// ─── Provider status ─────────────────────────────────────────────────────────
export type ProviderStatus = 'pending' | 'approved' | 'rejected';

// ─── Record status ────────────────────────────────────────────────────────────
export type RecordStatus = 'saved' | 'pending' | 'verified' | 'rejected';

// ─── Reservation status ───────────────────────────────────────────────────────
export type ReservationStatus =
  | 'pending'
  | 'confirmed'
  | 'rejected'
  | 'rescheduled'
  | 'completed'
  | 'cancelled';

// ─── Payment status ───────────────────────────────────────────────────────────
export type PaymentStatus = 'pending' | 'paid' | 'failed';

// ─── Day status ───────────────────────────────────────────────────────────────
export type DayStatus = 'available' | 'busy' | 'blocked';

// ─── Currency ────────────────────────────────────────────────────────────────
export type MoneyCurrency = 'MXN' | 'USD';

// ─── Service module IDs ───────────────────────────────────────────────────────
export type ServiceModuleId =
  | 'boat'
  | 'guide'
  | 'sport'
  | 'rental'
  | 'restaurant'
  | 'store'
  | 'fishMarket'
  | 'transport';

// ─── Schedule slot ────────────────────────────────────────────────────────────
export interface ScheduleSlot {
  start: string; // "HH:MM"
  end: string;   // "HH:MM"
}

// ─── Catalog item ─────────────────────────────────────────────────────────────
export interface CatalogItem {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: MoneyCurrency;
  imageUrl: string;
}

// ─── Route / pricing option ───────────────────────────────────────────────────
export interface ServiceRouteOption {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: MoneyCurrency;
  durationHours: number;
  durationMinutes: number;
  capacity: number;
  isAvailable: boolean;
}

// ─── Gallery photo ────────────────────────────────────────────────────────────
export interface GalleryPhoto {
  id: string;
  title: string;
  description: string;
  uri: string;   // local uri or remote URL
  featured: boolean;
}

// ─── Business record ─────────────────────────────────────────────────────────
export interface BusinessRecord {
  id: string;
  serviceId: ServiceModuleId;
  title: string;
  subtitle: string;
  location: string;
  serviceType: string;
  price: number;
  currency: MoneyCurrency;
  durationHours: number;
  durationMinutes: number;
  status: RecordStatus;
  isAvailable: boolean;
  availabilityNote: string;
  unavailableDateKeys: number[];
  schedules: ScheduleSlot[];
  catalog: CatalogItem[];
  routeOptions: ServiceRouteOption[];
  gallery: GalleryPhoto[];
}

// ─── Reservation ─────────────────────────────────────────────────────────────
export interface Reservation {
  id: string;
  clientName: string;
  serviceName: string;
  serviceId: string;
  date: string;
  hour: string;
  people: number;
  amount: string;
  message: string;
  status: ReservationStatus;
}

// ─── Payment ─────────────────────────────────────────────────────────────────
export interface Payment {
  id: string;
  concept: string;
  clientName: string;
  amount: string;
  status: PaymentStatus | string;
  date: string;
}

// ─── Chat message ────────────────────────────────────────────────────────────
export interface ChatMessage {
  id: string;
  text: string;
  mine: boolean;
  sentAt: string;
}

// ─── Review ──────────────────────────────────────────────────────────────────
export interface Review {
  id: string;
  serviceName: string;
  comment: string;
  rating: number;
  clientName: string;
  date: string;
  replyStatus: 'replied' | 'pending';
}

// ─── Promotion ───────────────────────────────────────────────────────────────
export interface Promotion {
  id: string;
  title: string;
  description: string;
  discountPercent: number;
  serviceName: string;
  startDate: string;
  endDate: string;
  status: 'active' | 'inactive';
}

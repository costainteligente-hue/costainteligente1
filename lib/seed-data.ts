/**
 * Seed data for UI development & testing.
 * Do NOT use as real data source in production.
 */
import { BusinessRecord, CatalogItem, ServiceRouteOption, GalleryPhoto, ScheduleSlot } from '@/types';
import { serviceSupportsOptions } from './constants';

const DEFAULT_SCHEDULES: ScheduleSlot[] = [
  { start: '08:00', end: '10:00' },
  { start: '12:00', end: '14:00' },
];

function makeRecord(
  serviceId: BusinessRecord['serviceId'],
  title: string,
  subtitle: string,
  serviceType: string,
  price: number,
  catalog: CatalogItem[] = [],
): BusinessRecord {
  const supportsOptions = serviceSupportsOptions(serviceId);

  const routeOptions: ServiceRouteOption[] = supportsOptions
    ? [
        {
          id: `${serviceId}-opt-1`,
          name: serviceId === 'guide' ? 'Asesoría básica' : serviceId === 'sport' ? 'Paquete inicial' : 'Recorrido corto',
          description: 'Opción base del servicio.',
          price,
          currency: 'MXN',
          durationHours: 2,
          durationMinutes: 0,
          capacity: 4,
          isAvailable: true,
        },
        {
          id: `${serviceId}-opt-2`,
          name: serviceId === 'sport' ? 'Paquete premium' : 'Recorrido premium',
          description: 'Opción extendida con mayor tiempo de servicio.',
          price: price + 1500,
          currency: 'MXN',
          durationHours: 4,
          durationMinutes: 0,
          capacity: 6,
          isAvailable: true,
        },
      ]
    : [];

  const gallery: GalleryPhoto[] = [
    {
      id: `${serviceId}-photo-1`,
      title: 'Foto principal',
      description: 'Imagen de portada del servicio.',
      uri: '',
      featured: true,
    },
    {
      id: `${serviceId}-photo-2`,
      title: 'Evidencia del servicio',
      description: 'Foto secundaria.',
      uri: '',
      featured: false,
    },
  ];

  return {
    id: `${serviceId}-verified`,
    serviceId,
    title,
    subtitle,
    location: 'Zihuatanejo, Guerrero',
    serviceType,
    price,
    currency: 'MXN',
    durationHours: 2,
    durationMinutes: 0,
    status: 'verified',
    isAvailable: true,
    availabilityNote: '',
    unavailableDateKeys: [],
    schedules: DEFAULT_SCHEDULES,
    catalog,
    routeOptions,
    gallery,
  };
}

export const SEED_RECORDS: Record<string, BusinessRecord[]> = {
  boat: [makeRecord('boat', 'Embarcación verificada', 'Lancha panga · servicio aceptado', 'Lancha panga', 4500)],
  guide: [makeRecord('guide', 'Guía verificado', 'Acompañamiento de pesca · servicio aceptado', 'Guía local', 1200)],
  sport: [makeRecord('sport', 'Paquete deportivo verificado', 'Pesca deportiva · servicio aceptado', 'Pesca de altura', 6500)],
  rental: [makeRecord('rental', 'Embarcación en renta verificada', 'Renta con capitán · servicio aceptado', 'Lancha rápida', 1800)],
  restaurant: [
    makeRecord('restaurant', 'Restaurante verificado', 'Mariscos · negocio aceptado', 'Restaurante', 0, [
      { id: 'r-item-1', name: 'Ceviche de camarón', description: 'Ceviche fresco con limón y chile.', price: 180, currency: 'MXN', imageUrl: '' },
      { id: 'r-item-2', name: 'Pescado zarandeado', description: 'Pescado a las brasas estilo Guerrero.', price: 220, currency: 'MXN', imageUrl: '' },
    ]),
  ],
  store: [
    makeRecord('store', 'Tienda verificada', 'Productos de pesca · negocio aceptado', 'Tienda', 0, [
      { id: 's-item-1', name: 'Caña Shimano 7ft', description: 'Caña de acción media para pesca costera.', price: 850, currency: 'MXN', imageUrl: '' },
    ]),
  ],
  fishMarket: [
    makeRecord('fishMarket', 'Pescadería verificada', 'Productos frescos · negocio aceptado', 'Pescadería', 0, [
      { id: 'f-item-1', name: 'Huachinango fresco', description: 'Por kilo, limpieza incluida.', price: 160, currency: 'MXN', imageUrl: '' },
    ]),
  ],
  transport: [makeRecord('transport', 'Transporte verificado', 'Traslado turístico · servicio aceptado', 'Terrestre', 700)],
};

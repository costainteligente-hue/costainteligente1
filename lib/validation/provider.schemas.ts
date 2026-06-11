import { z } from 'zod';

export const serviceFormSchema = z.object({
  name: z
    .string()
    .min(3, 'El nombre debe tener al menos 3 caracteres.')
    .max(100, 'Máximo 100 caracteres.'),
  description: z
    .string()
    .min(10, 'La descripción debe tener al menos 10 caracteres.')
    .max(500, 'Máximo 500 caracteres.'),
  price: z
    .number({ invalid_type_error: 'El precio debe ser un número.' })
    .positive('El precio debe ser mayor a 0.'),
  capacity: z
    .number({ invalid_type_error: 'La capacidad debe ser un número.' })
    .int('Debe ser un número entero.')
    .min(1, 'Mínimo 1 persona.')
    .max(500, 'Máximo 500 personas.'),
  scheduleStart: z.string().regex(/^\d{2}:\d{2}$/, 'Formato HH:MM requerido.'),
  scheduleEnd: z.string().regex(/^\d{2}:\d{2}$/, 'Formato HH:MM requerido.'),
  location: z
    .string()
    .min(5, 'La ubicación debe tener al menos 5 caracteres.')
    .max(200, 'Máximo 200 caracteres.'),
}).refine(
  (data) => data.scheduleEnd > data.scheduleStart,
  { message: 'La hora de fin debe ser posterior a la hora de inicio.', path: ['scheduleEnd'] },
);

export const promotionSchema = z.object({
  title: z
    .string()
    .min(3, 'El título debe tener al menos 3 caracteres.')
    .max(100, 'Máximo 100 caracteres.'),
  description: z
    .string()
    .min(10, 'La descripción debe tener al menos 10 caracteres.')
    .max(300, 'Máximo 300 caracteres.'),
  discountPercent: z
    .number()
    .int('Debe ser un número entero.')
    .min(1, 'Mínimo 1%.')
    .max(100, 'Máximo 100%.'),
  serviceId: z.string().uuid('ID de servicio inválido.'),
  startDate: z.string().min(1, 'La fecha de inicio es obligatoria.'),
  endDate: z.string().min(1, 'La fecha de fin es obligatoria.'),
});

export const routeOptionSchema = z.object({
  name: z.string().min(3, 'Mínimo 3 caracteres.').max(100, 'Máximo 100.'),
  description: z.string().max(300, 'Máximo 300 caracteres.').optional(),
  price: z.number().nonnegative('El precio no puede ser negativo.'),
  durationHours: z.number().int().min(0).max(24),
  durationMinutes: z.number().int().min(0).max(55),
  capacity: z.number().int().min(1, 'Mínimo 1 persona.').max(500),
});

export const catalogItemSchema = z.object({
  name: z.string().min(2, 'Mínimo 2 caracteres.').max(100, 'Máximo 100.'),
  description: z.string().max(300, 'Máximo 300 caracteres.').optional(),
  price: z.number().nonnegative('El precio no puede ser negativo.'),
  imageUrl: z.string().url('URL inválida.').optional().or(z.literal('')),
});

export type ServiceFormInput = z.infer<typeof serviceFormSchema>;
export type PromotionInput = z.infer<typeof promotionSchema>;
export type RouteOptionInput = z.infer<typeof routeOptionSchema>;
export type CatalogItemInput = z.infer<typeof catalogItemSchema>;

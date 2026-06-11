import { z } from 'zod';

export const reservationSchema = z.object({
  serviceId: z.string().uuid('ID de servicio inválido.'),
  providerId: z.string().uuid('ID de proveedor inválido.'),
  reservationDate: z
    .string()
    .refine(
      (date) => new Date(date) > new Date(),
      'La fecha de reservación debe ser futura.',
    ),
  partySize: z
    .number({ invalid_type_error: 'El número de personas debe ser un número.' })
    .int('Debe ser un número entero.')
    .min(1, 'Mínimo 1 persona.'),
});

export const reviewSchema = z.object({
  rating: z
    .number()
    .int()
    .min(1, 'La calificación mínima es 1.')
    .max(5, 'La calificación máxima es 5.'),
  comment: z
    .string()
    .min(1, 'El comentario no puede estar vacío.')
    .max(500, 'El comentario no puede superar los 500 caracteres.'),
  zoneId: z.string().uuid('ID de zona inválido.'),
});

export const messageSchema = z.object({
  content: z
    .string()
    .min(1, 'El mensaje no puede estar vacío.')
    .max(500, 'El mensaje no puede superar los 500 caracteres.'),
});

export const communityPostSchema = z.object({
  speciesId: z.string().uuid('Selecciona una especie.'),
  zoneId: z.string().uuid('Selecciona una zona.'),
  weightKg: z
    .number({ invalid_type_error: 'El peso debe ser un número.' })
    .positive('El peso debe ser mayor a 0.'),
  catchDate: z
    .string()
    .refine(
      (date) => new Date(date) <= new Date(),
      'La fecha de captura no puede ser futura.',
    ),
});

export type ReservationInput = z.infer<typeof reservationSchema>;
export type ReviewInput = z.infer<typeof reviewSchema>;
export type MessageInput = z.infer<typeof messageSchema>;
export type CommunityPostInput = z.infer<typeof communityPostSchema>;

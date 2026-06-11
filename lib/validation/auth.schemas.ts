import { z } from 'zod';

export const registerClientSchema = z.object({
  fullName: z
    .string()
    .min(2, 'El nombre debe tener al menos 2 caracteres.')
    .max(100, 'Máximo 100 caracteres.'),
  email: z
    .string()
    .email('Ingresa un correo electrónico válido.'),
  password: z
    .string()
    .min(8, 'La contraseña debe tener mínimo 8 caracteres.'),
});

export const registerProviderSchema = z.object({
  email: z.string().email('Correo inválido.'),
  password: z.string().min(8, 'Mínimo 8 caracteres.'),
  businessName: z
    .string()
    .min(3, 'El nombre del negocio debe tener al menos 3 caracteres.')
    .max(100, 'Máximo 100 caracteres.'),
  rfc: z
    .string()
    .regex(
      /^[A-ZÑ&]{3,4}[0-9]{6}[A-Z0-9]{2,3}$/,
      'RFC inválido. Formato: XAXX010101000',
    ),
  phone: z
    .string()
    .regex(/^\d{10}$/, 'El teléfono debe tener exactamente 10 dígitos.'),
  address: z
    .string()
    .min(10, 'La dirección debe tener al menos 10 caracteres.')
    .max(200, 'Máximo 200 caracteres.'),
});

export const loginSchema = z.object({
  email: z.string().email('Ingresa un correo válido.'),
  password: z.string().min(8, 'Mínimo 8 caracteres.'),
});

export type RegisterClientInput = z.infer<typeof registerClientSchema>;
export type RegisterProviderInput = z.infer<typeof registerProviderSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

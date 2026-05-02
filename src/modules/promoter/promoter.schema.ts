import { z } from 'zod';

export const createPromoterSchema = z.object({
  name: z.string().min(1, 'name es requerido'),
  lastname: z.string().optional(),
  email: z.string().email('email debe ser válido').optional().or(z.literal('')),
  password: z.string().min(6, 'password debe tener al menos 6 caracteres'),
  phone: z.string().min(1, 'phone es requerido'),
  fcm_token: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

export const loginPromoterSchema = z.object({
  termino: z.string().min(1, 'termino es requerido'),
  password: z.string().min(1, 'password es requerido'),
  fcm_token: z.string().min(1, 'fcm_token es requerido'),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

export const updateLocationPromoterSchema = z.object({
  id: z.number().int().positive('id es requerido'),
  latitude: z.number(),
  longitude: z.number(),
});

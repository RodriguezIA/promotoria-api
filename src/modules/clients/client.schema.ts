import { z } from 'zod';

export const createClientSchema = z.object({
  id_user: z.number().int().positive('id_user es requerido'),
  name: z.string().min(1, 'name es requerido'),
  rfc: z.string().optional(),
  email: z.string().email('email debe ser válido').optional().or(z.literal('')),
  phone: z.string().optional(),
  id_pais: z.number().int().positive().optional(),
  id_estado: z.number().int().positive().optional(),
  id_ciudad: z.number().int().positive().optional(),
  street: z.string().optional(),
  ext_number: z.string().optional(),
  int_number: z.string().optional(),
  neighborhood: z.string().optional(),
  zip: z.string().optional(),
  addiccional_notes: z.string().optional(),
});

export const clientIdParamSchema = z.object({
  id_client: z.string().regex(/^\d+$/, 'id_client debe ser un número').transform(Number),
});

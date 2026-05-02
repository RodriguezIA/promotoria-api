import { z } from 'zod';

export const createProductSchema = z.object({
  id_user: z.number().int().positive('id_user es requerido'),
  id_client: z.number().int().positive('id_client es requerido'),
  name: z.string().min(1, 'name es requerido'),
  description: z.string().optional(),
  vc_image: z.string().optional(),
});

export const updateProductSchema = createProductSchema.partial();

export const productIdParamSchema = z.object({
  id_product: z.string().regex(/^\d+$/, 'id_product debe ser un número').transform(Number),
});

import { z } from 'zod';

export const createAddressSchema = z.object({
  entity_type: z.string().min(1, 'entity_type es requerido'),
  entity_id: z.number().int().positive('entity_id debe ser un entero positivo'),
  id_country: z.number().int().positive('id_country es requerido'),
  id_state: z.number().int().positive('id_state es requerido'),
  id_city: z.number().int().positive('id_city es requerido'),
  street: z.string().min(1, 'street es requerido'),
  ext_number: z.string().min(1, 'ext_number es requerido'),
  int_number: z.string().optional(),
  neighborhood: z.string().optional(),
  postal_code: z.string().min(1, 'postal_code es requerido'),
  address_references: z.string().optional(),
  latitude: z.string().optional(),
  longitude: z.string().optional(),
});

export const createStoreSchema = z.object({
  id_user: z.number().int().positive('id_user es requerido'),
  id_channel_sale: z.number().int().optional(),
  name: z.string().min(1, 'name es requerido'),
  store_code: z.string().optional(),
  address: createAddressSchema,
});

export const updateStoreSchema = createStoreSchema.partial();

export const storeIdParamSchema = z.object({
  id_store: z.string().regex(/^\d+$/, 'id_store debe ser un número').transform(Number),
});

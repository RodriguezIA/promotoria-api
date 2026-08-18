import { z } from 'zod'

export const setStockMinimumSchema = z.object({
  id_product: z.number().int().positive('id_product es requerido'),
  id_store: z.number().int().positive('id_store es requerido'),
  i_minimum: z.number().int().min(0, 'i_minimum debe ser 0 o mayor'),
})

export const bulkAssignStockMinimumSchema = z.object({
  id_products: z.array(z.number().int().positive()).min(1, 'Selecciona al menos un producto'),
  i_minimum: z.number().int().min(0, 'i_minimum debe ser 0 o mayor'),
  id_channels: z.array(z.number().int().positive()).optional(),
  id_state: z.number().int().positive().optional(),
  id_municipios: z.array(z.number().int().positive()).optional(),
})

export const storeIdParamSchema = z.object({
  id_store: z.string().regex(/^\d+$/, 'id_store debe ser un número'),
})

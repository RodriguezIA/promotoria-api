import { z } from 'zod'

export const setStockMinimumSchema = z.object({
  id_product: z.number().int().positive('id_product es requerido'),
  id_store: z.number().int().positive('id_store es requerido'),
  i_minimum: z.number().int().min(0, 'i_minimum debe ser 0 o mayor'),
})

export const storeIdParamSchema = z.object({
  id_store: z.string().regex(/^\d+$/, 'id_store debe ser un número'),
})

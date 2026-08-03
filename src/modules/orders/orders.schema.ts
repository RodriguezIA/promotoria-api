import { z } from 'zod';

export const createOrderItemSchema = z.object({
  id_request: z.number().int().positive('id_request es requerido'),
  stores: z
    .array(z.number().int().positive())
    .min(1, 'Cada solicitud debe tener al menos una tienda seleccionada'),
});

export const createOrderSchema = z.object({
  id_user: z.number().int().positive('id_user es requerido'),
  id_client: z.number().int().positive('id_client es requerido'),
  items: z
    .array(createOrderItemSchema)
    .min(1, 'El pedido debe tener al menos una solicitud'),
});

export const updateOrderSchema = z.object({
  id_status: z.number().int().optional(),
  f_total: z.number().optional(),
});

import { z } from 'zod';

export const createChannelSalesSchema = z.object({
  name: z.string().min(1, 'name es requerido'),
  description: z.string().min(1, 'description es requerido'),
  url_image: z.string().optional(),
});

export const updateChannelSalesSchema = createChannelSalesSchema.partial();

export const channelIdParamSchema = z.object({
  id_channel: z.string().regex(/^\d+$/, 'id_channel debe ser un número').transform(Number),
});

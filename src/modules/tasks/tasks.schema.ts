import { z } from 'zod'

export const forceNotifyTaskSchema = z
  .object({
    id_task: z.number().int().positive().optional(),
    folio: z.string().min(1).optional(),
  })
  .refine((data) => data.id_task !== undefined || data.folio !== undefined, {
    message: 'Debes enviar id_task o folio',
  })

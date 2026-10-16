import { z } from 'zod'

export const generateDriverActivatorPaymentsSchema = z.object({
  dt_start: z.coerce.date(),
  dt_end: z.coerce.date(),
  id_driver: z.number().int().positive().optional(),
}).refine((d) => d.dt_start <= d.dt_end, {
  message: 'dt_start debe ser menor o igual a dt_end',
  path: ['dt_end'],
})

export const submitDriverActivatorPaymentSchema = z.object({
  dt_payment: z.coerce.date(),
  vc_notes: z.string().max(500).optional(),
})

export const updateDriverActivatorPaymentStatusSchema = z.object({
  action: z.enum(['cancel']),
})

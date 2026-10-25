import { z } from 'zod'

export const generateActivatorPaymentsSchema = z.object({
  dt_start: z.coerce.date(),
  dt_end: z.coerce.date(),
  id_activator: z.number().int().positive().optional(),
}).refine((d) => d.dt_start <= d.dt_end, {
  message: 'dt_start debe ser menor o igual a dt_end',
  path: ['dt_end'],
})

export const updateActivatorPaymentPaymentSchema = z.object({
  dt_payment: z.coerce.date(),
  id_bank_account: z.number().int().positive().optional(),
  vc_notes: z.string().max(500).optional(),
})

export const updateActivatorPaymentStatusSchema = z.object({
  action: z.enum(['cancel']),
})

import { z } from 'zod'

export const generatePaymentsSchema = z.object({
  dt_start: z.coerce.date(),
  dt_end: z.coerce.date(),
  id_promoter: z.number().int().positive().optional(),
}).refine((d) => d.dt_start <= d.dt_end, {
  message: 'dt_start debe ser menor o igual a dt_end',
  path: ['dt_end'],
})

export const updatePaymentPaymentSchema = z.object({
  dt_payment: z.coerce.date(),
  id_bank_account: z.coerce.number().int().positive(),
  vc_notes: z.string().max(500).optional(),
})

export const updatePaymentStatusSchema = z.object({
  action: z.literal('cancel'),
})

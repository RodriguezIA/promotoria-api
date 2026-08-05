import { z } from 'zod'

export const generateChargesSchema = z.object({
  dt_start: z.coerce.date(),
  dt_end: z.coerce.date(),
  dt_due: z.coerce.date(),
  id_client: z.number().int().positive().optional(),
}).refine((d) => d.dt_start <= d.dt_end, {
  message: 'dt_start debe ser menor o igual a dt_end',
  path: ['dt_end'],
}).refine((d) => d.dt_due >= d.dt_start, {
  message: 'dt_due debe ser posterior a dt_start',
  path: ['dt_due'],
})

export const updateInvoicePaymentSchema = z.object({
  dt_payment: z.coerce.date(),
  vc_payment_method: z.string().min(1, 'vc_payment_method es requerido'),
})

export const updateInvoiceStatusSchema = z.object({
  action: z.enum(['approve', 'reject', 'cancel']),
  vc_rejection_reason: z.string().min(1).max(500).optional(),
}).superRefine((data, ctx) => {
  if (data.action === 'reject' && !data.vc_rejection_reason) {
    ctx.addIssue({ code: 'custom', message: 'vc_rejection_reason es requerido para rechazar', path: ['vc_rejection_reason'] })
  }
})

export const updateInvoiceDueDateSchema = z.object({
  dt_due: z.coerce.date(),
})

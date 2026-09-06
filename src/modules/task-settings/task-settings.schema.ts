import { z } from 'zod'

export const updateTaskSettingsSchema = z.object({
  i_review_timeout_hours: z.number().int().min(1).max(720),
})

export const updatePreorderPricingSchema = z.object({
  pricing_type: z.enum(['FIXED', 'PERCENTAGE']),
  pricing_value: z.number().min(0, 'El valor debe ser 0 o mayor'),
})

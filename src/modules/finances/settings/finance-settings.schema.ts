import { z } from 'zod'

export const updateFinanceSettingsSchema = z.object({
  f_promoter_commission_percentage: z.number().min(0, 'El valor no puede ser negativo').max(99999, 'El valor es demasiado grande').optional(),
  f_activator_commission_percentage: z.number().min(0, 'El valor no puede ser negativo').max(99999, 'El valor es demasiado grande').optional(),
  vc_promoter_commission_type: z.enum(['PERCENTAGE', 'FIXED']).optional(),
  vc_activator_commission_type: z.enum(['PERCENTAGE', 'FIXED']).optional(),
}).superRefine((d, ctx) => {
  if (d.vc_promoter_commission_type === 'PERCENTAGE' && (d.f_promoter_commission_percentage ?? 0) > 100)
    ctx.addIssue({ code: 'custom', path: ['f_promoter_commission_percentage'], message: 'El porcentaje no puede ser mayor a 100' })
  if (d.vc_activator_commission_type === 'PERCENTAGE' && (d.f_activator_commission_percentage ?? 0) > 100)
    ctx.addIssue({ code: 'custom', path: ['f_activator_commission_percentage'], message: 'El porcentaje no puede ser mayor a 100' })
})

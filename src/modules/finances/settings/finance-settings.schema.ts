import { z } from 'zod'

export const updateFinanceSettingsSchema = z.object({
  f_promoter_commission_percentage: z.number().min(0, 'El porcentaje no puede ser negativo').max(100, 'El porcentaje no puede ser mayor a 100').optional(),
  f_activator_commission_percentage: z.number().min(0, 'El porcentaje no puede ser negativo').max(100, 'El porcentaje no puede ser mayor a 100').optional(),
})

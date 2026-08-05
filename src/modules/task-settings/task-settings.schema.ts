import { z } from 'zod'

export const updateTaskSettingsSchema = z.object({
  i_review_timeout_hours: z.number().int().min(1).max(720),
})

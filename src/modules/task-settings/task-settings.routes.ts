import { Router } from 'express'
import { authMiddleware, requireRole, validateBody } from '../../core/middleware'
import { ROLES } from '../../core/constants/status.constants'
import { getTaskSettings, updateTaskSettings, updatePreorderPricing } from './task-settings.controller'
import { updateTaskSettingsSchema, updatePreorderPricingSchema } from './task-settings.schema'

const taskSettingsRouter = Router()

taskSettingsRouter.get('/', authMiddleware, getTaskSettings)
taskSettingsRouter.patch('/', authMiddleware, requireRole(ROLES.SUPER), validateBody(updateTaskSettingsSchema), updateTaskSettings)
taskSettingsRouter.patch('/preorder-pricing', authMiddleware, requireRole(ROLES.SUPER), validateBody(updatePreorderPricingSchema), updatePreorderPricing)

export default taskSettingsRouter

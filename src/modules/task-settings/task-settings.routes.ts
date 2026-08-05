import { Router } from 'express'
import { authMiddleware, requireRole, validateBody } from '../../core/middleware'
import { ROLES } from '../../core/constants/status.constants'
import { getTaskSettings, updateTaskSettings } from './task-settings.controller'
import { updateTaskSettingsSchema } from './task-settings.schema'

const taskSettingsRouter = Router()

taskSettingsRouter.get('/', authMiddleware, getTaskSettings)
taskSettingsRouter.patch('/', authMiddleware, requireRole(ROLES.SUPER), validateBody(updateTaskSettingsSchema), updateTaskSettings)

export default taskSettingsRouter

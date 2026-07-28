import { Router } from 'express'
import { authMiddleware, requireRole, validateBody } from '../../../core/middleware'
import { ROLES } from '../../../core/constants/status.constants'
import { getFinanceSettings, updateFinanceSettings } from './finance-settings.controller'
import { updateFinanceSettingsSchema } from './finance-settings.schema'

const financeSettingsRouter = Router()

/**
 * @openapi
 * /finances/settings:
 *   get:
 *     tags: [Finances]
 *     summary: Obtener configuración global de finanzas (porcentaje de comisión del promotor)
 *     responses:
 *       200: { description: "Configuración obtenida." }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { description: "Solo un Super usuario puede ver la configuración." }
 *   patch:
 *     tags: [Finances]
 *     summary: Actualizar el porcentaje de comisión global del promotor
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [f_promoter_commission_percentage]
 *             properties:
 *               f_promoter_commission_percentage: { type: number }
 *     responses:
 *       200: { description: "Configuración actualizada." }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { description: "Solo un Super usuario puede actualizar la configuración." }
 */
financeSettingsRouter.get('/', authMiddleware, requireRole(ROLES.SUPER), getFinanceSettings)
financeSettingsRouter.patch('/', authMiddleware, requireRole(ROLES.SUPER), validateBody(updateFinanceSettingsSchema), updateFinanceSettings)

export default financeSettingsRouter

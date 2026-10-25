import { Router } from 'express'
import { authMiddleware, requireRole, validateBody } from '../../../core/middleware'
import { ROLES } from '../../../core/constants/status.constants'
import {
    previewActivatorPayments,
    generateActivatorPayments,
    getAllActivatorPayments,
    getActivatorPaymentById,
    submitActivatorPayment,
    updateActivatorPaymentStatus,
} from './activator-payments.controller'
import {
    generateActivatorPaymentsSchema,
    updateActivatorPaymentPaymentSchema,
    updateActivatorPaymentStatusSchema,
} from './activator-payments.schema'

const activatorPaymentsRouter = Router()

activatorPaymentsRouter.post('/preview', authMiddleware, requireRole(ROLES.SUPER), validateBody(generateActivatorPaymentsSchema), previewActivatorPayments)
activatorPaymentsRouter.post('/', authMiddleware, requireRole(ROLES.SUPER), validateBody(generateActivatorPaymentsSchema), generateActivatorPayments)
activatorPaymentsRouter.get('/', authMiddleware, requireRole(ROLES.SUPER), getAllActivatorPayments)
activatorPaymentsRouter.get('/:id_payment', authMiddleware, requireRole(ROLES.SUPER), getActivatorPaymentById)
activatorPaymentsRouter.patch('/:id_payment/payment', authMiddleware, requireRole(ROLES.SUPER), validateBody(updateActivatorPaymentPaymentSchema), submitActivatorPayment)
activatorPaymentsRouter.patch('/:id_payment/status', authMiddleware, requireRole(ROLES.SUPER), validateBody(updateActivatorPaymentStatusSchema), updateActivatorPaymentStatus)

export default activatorPaymentsRouter

import { Router } from 'express'
import { authMiddleware, requireRole, validateBody } from '../../../core/middleware'
import { ROLES } from '../../../core/constants/status.constants'
import {
    previewDriverActivatorPayments,
    generateDriverActivatorPayments,
    getAllDriverActivatorPayments,
    getDriverActivatorPaymentById,
    submitDriverActivatorPayment,
    updateDriverActivatorPaymentStatus,
} from './driver-activator-payments.controller'
import {
    generateDriverActivatorPaymentsSchema,
    submitDriverActivatorPaymentSchema,
    updateDriverActivatorPaymentStatusSchema,
} from './driver-activator-payments.schema'

const driverActivatorPaymentsRouter = Router()

driverActivatorPaymentsRouter.post('/preview', authMiddleware, requireRole(ROLES.SUPER), validateBody(generateDriverActivatorPaymentsSchema), previewDriverActivatorPayments)
driverActivatorPaymentsRouter.post('/', authMiddleware, requireRole(ROLES.SUPER), validateBody(generateDriverActivatorPaymentsSchema), generateDriverActivatorPayments)
driverActivatorPaymentsRouter.get('/', authMiddleware, requireRole(ROLES.SUPER), getAllDriverActivatorPayments)
driverActivatorPaymentsRouter.get('/:id_payment', authMiddleware, requireRole(ROLES.SUPER), getDriverActivatorPaymentById)
driverActivatorPaymentsRouter.patch('/:id_payment/payment', authMiddleware, requireRole(ROLES.SUPER), validateBody(submitDriverActivatorPaymentSchema), submitDriverActivatorPayment)
driverActivatorPaymentsRouter.patch('/:id_payment/status', authMiddleware, requireRole(ROLES.SUPER), validateBody(updateDriverActivatorPaymentStatusSchema), updateDriverActivatorPaymentStatus)

export default driverActivatorPaymentsRouter

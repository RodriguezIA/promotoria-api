import { Router } from 'express'
import { authMiddleware, requireRole, validateBody, uploadAny } from '../../../core/middleware'
import { ROLES } from '../../../core/constants/status.constants'
import {
    previewPromoterPayments,
    generatePromoterPayments,
    getAllPromoterPayments,
    getMyPromoterPayments,
    getPromoterPaymentById,
    submitPromoterPayment,
    updatePromoterPaymentStatus,
    revealBankAccount,
} from './promoter-payments.controller'
import { generatePaymentsSchema, updatePaymentPaymentSchema, updatePaymentStatusSchema } from './promoter-payments.schema'

const promoterPaymentsRouter = Router()

/**
 * @openapi
 * /finances/promoter-payments/preview:
 *   post:
 *     tags: [Finances]
 *     summary: Preview (dry-run) del corte de pagos a promotores
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [dt_start, dt_end]
 *             properties:
 *               dt_start: { type: string, format: date-time }
 *               dt_end: { type: string, format: date-time }
 *               id_promoter: { type: integer }
 *     responses:
 *       200: { description: "Preview del corte de pagos." }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       422: { description: "Falta configurar el porcentaje de comisión." }
 */
promoterPaymentsRouter.post('/preview', authMiddleware, requireRole(ROLES.SUPER), validateBody(generatePaymentsSchema), previewPromoterPayments)

/**
 * @openapi
 * /finances/promoter-payments:
 *   post:
 *     tags: [Finances]
 *     summary: Generar pago(s) a promotores
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [dt_start, dt_end]
 *             properties:
 *               dt_start: { type: string, format: date-time }
 *               dt_end: { type: string, format: date-time }
 *               id_promoter: { type: integer }
 *     responses:
 *       200: { description: "Pago(s) generado(s)." }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       409: { description: "Conflicto de concurrencia al tomar las tareas." }
 *       422: { description: "Falta configurar el porcentaje de comisión." }
 *   get:
 *     tags: [Finances]
 *     summary: Listar pagos a promotores
 *     parameters:
 *       - { in: query, name: id_promoter, schema: { type: integer } }
 *       - { in: query, name: id_status, schema: { type: integer } }
 *       - { in: query, name: dt_start, schema: { type: string, format: date-time } }
 *       - { in: query, name: dt_end, schema: { type: string, format: date-time } }
 *       - { in: query, name: vc_folio, schema: { type: string } }
 *       - { in: query, name: page, schema: { type: integer, default: 1 } }
 *       - { in: query, name: limit, schema: { type: integer, default: 20 } }
 *     responses:
 *       200: { description: "Página de pagos a promotores." }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
promoterPaymentsRouter.post('/', authMiddleware, requireRole(ROLES.SUPER), validateBody(generatePaymentsSchema), generatePromoterPayments)
promoterPaymentsRouter.get('/', authMiddleware, requireRole(ROLES.SUPER), getAllPromoterPayments)

/**
 * @openapi
 * /finances/promoter-payments/bank-accounts/{id_account}/reveal:
 *   get:
 *     tags: [Finances]
 *     summary: Descifra el numero completo de una cuenta bancaria, exclusivamente para hacer la transferencia manual. Restringido a Admin/Finanzas y queda auditado.
 *     parameters:
 *       - in: path
 *         name: id_account
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: "Cuenta bancaria con el número completo descifrado." }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { description: "Rol sin permiso para ver datos financieros completos." }
 *       404: { description: "Cuenta no encontrada." }
 */
// Va ANTES de '/:id_payment' a proposito: si no, Express confunde
// "bank-accounts" (y "mine") con un id_payment y esta ruta nunca se alcanza
// (mismo error que ya tuvimos con /minimums/matching-stores en el modulo de
// stock).
promoterPaymentsRouter.get('/bank-accounts/:id_account/reveal', authMiddleware, requireRole(ROLES.SUPER, ROLES.ADMIN), revealBankAccount)
promoterPaymentsRouter.get('/mine', authMiddleware, getMyPromoterPayments)

/**
 * @openapi
 * /finances/promoter-payments/{id_payment}:
 *   get:
 *     tags: [Finances]
 *     summary: Detalle de un pago a promotor (tareas, cuentas bancarias, evidencias, logs)
 *     parameters:
 *       - in: path
 *         name: id_payment
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: "Detalle del pago." }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       404: { description: "Pago no encontrado." }
 */
promoterPaymentsRouter.get('/:id_payment', authMiddleware, requireRole(ROLES.SUPER), getPromoterPaymentById)

/**
 * @openapi
 * /finances/promoter-payments/{id_payment}/payment:
 *   patch:
 *     tags: [Finances]
 *     summary: Super usuario registra el día de pago, cuenta bancaria y evidencia
 *     parameters:
 *       - in: path
 *         name: id_payment
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [dt_payment, id_bank_account]
 *             properties:
 *               dt_payment: { type: string, format: date-time }
 *               id_bank_account: { type: integer }
 *               vc_notes: { type: string }
 *               evidence: { type: string, format: binary }
 *     responses:
 *       200: { description: "Pago registrado." }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       409: { description: "El pago no está en un estatus que permita esta acción." }
 */
promoterPaymentsRouter.patch(
    '/:id_payment/payment',
    authMiddleware,
    requireRole(ROLES.SUPER),
    uploadAny.single('evidence'),
    validateBody(updatePaymentPaymentSchema),
    submitPromoterPayment
)

/**
 * @openapi
 * /finances/promoter-payments/{id_payment}/status:
 *   patch:
 *     tags: [Finances]
 *     summary: Super usuario cancela un pago (solo desde estatus por pagar)
 *     parameters:
 *       - in: path
 *         name: id_payment
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [action]
 *             properties:
 *               action: { type: string, enum: [cancel] }
 *     responses:
 *       200: { description: "Pago cancelado." }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       409: { description: "Transición de estatus inválida." }
 */
promoterPaymentsRouter.patch('/:id_payment/status', authMiddleware, requireRole(ROLES.SUPER), validateBody(updatePaymentStatusSchema), updatePromoterPaymentStatus)

export default promoterPaymentsRouter

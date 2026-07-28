import { Router } from 'express'
import { authMiddleware, requireRole, validateBody, uploadAny } from '../../../core/middleware'
import { ROLES } from '../../../core/constants/status.constants'
import {
    previewClientCharges,
    generateClientCharges,
    getAllClientCharges,
    getClientChargeById,
    submitClientChargePayment,
    updateClientChargeStatus,
} from './client-charges.controller'
import { generateChargesSchema, updateChargePaymentSchema, updateChargeStatusSchema } from './client-charges.schema'

const clientChargesRouter = Router()

/**
 * @openapi
 * /finances/client-charges/preview:
 *   post:
 *     tags: [Finances]
 *     summary: Preview (dry-run) del corte de cobro a clientes
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
 *               id_client: { type: integer }
 *     responses:
 *       200: { description: "Preview del corte." }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
clientChargesRouter.post('/preview', authMiddleware, requireRole(ROLES.SUPER), validateBody(generateChargesSchema), previewClientCharges)

/**
 * @openapi
 * /finances/client-charges:
 *   post:
 *     tags: [Finances]
 *     summary: Generar corte(s) de cobro a clientes
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
 *               id_client: { type: integer }
 *     responses:
 *       200: { description: "Corte(s) generado(s)." }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       409: { description: "Conflicto de concurrencia al tomar las tareas." }
 *   get:
 *     tags: [Finances]
 *     summary: Listar cortes de cobro a clientes
 *     parameters:
 *       - { in: query, name: id_client, schema: { type: integer } }
 *       - { in: query, name: id_status, schema: { type: integer } }
 *       - { in: query, name: dt_start, schema: { type: string, format: date-time } }
 *       - { in: query, name: dt_end, schema: { type: string, format: date-time } }
 *       - { in: query, name: vc_folio, schema: { type: string } }
 *       - { in: query, name: page, schema: { type: integer, default: 1 } }
 *       - { in: query, name: limit, schema: { type: integer, default: 20 } }
 *     responses:
 *       200: { description: "Página de cortes de cobro." }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
clientChargesRouter.post('/', authMiddleware, requireRole(ROLES.SUPER), validateBody(generateChargesSchema), generateClientCharges)
clientChargesRouter.get('/', authMiddleware, requireRole(ROLES.SUPER, ROLES.ADMIN), getAllClientCharges)

/**
 * @openapi
 * /finances/client-charges/{id_charge}:
 *   get:
 *     tags: [Finances]
 *     summary: Detalle de un corte de cobro (pedidos, tareas, evidencias, logs)
 *     parameters:
 *       - in: path
 *         name: id_charge
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: "Detalle del corte." }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { description: "El cobro no pertenece al cliente del token." }
 *       404: { description: "Cobro no encontrado." }
 */
clientChargesRouter.get('/:id_charge', authMiddleware, requireRole(ROLES.SUPER, ROLES.ADMIN), getClientChargeById)

/**
 * @openapi
 * /finances/client-charges/{id_charge}/payment:
 *   patch:
 *     tags: [Finances]
 *     summary: Cliente sube fecha de pago, método y evidencia del comprobante
 *     parameters:
 *       - in: path
 *         name: id_charge
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [dt_payment, vc_payment_method]
 *             properties:
 *               dt_payment: { type: string, format: date-time }
 *               vc_payment_method: { type: string }
 *               evidence: { type: string, format: binary }
 *     responses:
 *       200: { description: "Comprobante registrado." }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { description: "El cobro no pertenece al cliente del token." }
 *       409: { description: "El cobro no está en un estatus que permita esta acción." }
 */
clientChargesRouter.patch(
    '/:id_charge/payment',
    authMiddleware,
    requireRole(ROLES.ADMIN),
    uploadAny.single('evidence'),
    validateBody(updateChargePaymentSchema),
    submitClientChargePayment
)

/**
 * @openapi
 * /finances/client-charges/{id_charge}/status:
 *   patch:
 *     tags: [Finances]
 *     summary: Super usuario aprueba, rechaza o cancela un corte de cobro
 *     parameters:
 *       - in: path
 *         name: id_charge
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
 *               action: { type: string, enum: [approve, reject, cancel] }
 *               vc_rejection_reason: { type: string }
 *     responses:
 *       200: { description: "Estatus actualizado." }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       409: { description: "Transición de estatus inválida." }
 */
clientChargesRouter.patch('/:id_charge/status', authMiddleware, requireRole(ROLES.SUPER), validateBody(updateChargeStatusSchema), updateClientChargeStatus)

export default clientChargesRouter

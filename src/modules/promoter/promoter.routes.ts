import { Router } from 'express'
import { authMiddleware, validateBody } from '../../core/middleware'
import { updateLocationPromoter, createPromoter, loginPromoter, getPromoters } from './promoter.controller'
import { createPromoterSchema, loginPromoterSchema, updateLocationPromoterSchema } from './promoter.schema'

const promoterRouter = Router()

/**
 * @openapi
 * /promoters:
 *   get:
 *     tags: [Promoters]
 *     summary: Listar promotores
 *     responses:
 *       200: { description: "Lista de promotores." }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *   post:
 *     tags: [Promoters]
 *     summary: Crear promotor
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, password, phone]
 *             properties:
 *               name: { type: string }
 *               lastname: { type: string }
 *               email: { type: string, format: email }
 *               password: { type: string, minLength: 6 }
 *               phone: { type: string }
 *               fcm_token: { type: string }
 *               latitude: { type: number }
 *               longitude: { type: number }
 *     responses:
 *       200: { description: "Promotor creado." }
 *       400: { description: "Datos inválidos." }
 */
promoterRouter.get('/', authMiddleware, getPromoters)
promoterRouter.post('/', validateBody(createPromoterSchema), createPromoter)

/**
 * @openapi
 * /promoters/login:
 *   post:
 *     tags: [Promoters]
 *     summary: Login de promotor (app móvil)
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [termino, password, fcm_token]
 *             properties:
 *               termino: { type: string, description: "Email o teléfono" }
 *               password: { type: string }
 *               fcm_token: { type: string }
 *               latitude: { type: number }
 *               longitude: { type: number }
 *     responses:
 *       200: { description: "Login correcto. Devuelve token + datos del promotor." }
 *       400: { description: "Datos inválidos." }
 *       401: { description: "Credenciales incorrectas." }
 */
promoterRouter.post('/login', validateBody(loginPromoterSchema), loginPromoter)

/**
 * @openapi
 * /promoters/update-location:
 *   put:
 *     tags: [Promoters]
 *     summary: Actualizar ubicación del promotor
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [id, latitude, longitude]
 *             properties:
 *               id: { type: integer }
 *               latitude: { type: number }
 *               longitude: { type: number }
 *     responses:
 *       200: { description: "Ubicación actualizada." }
 *       400: { description: "Datos inválidos." }
 */
promoterRouter.put('/update-location', validateBody(updateLocationPromoterSchema), updateLocationPromoter)

export default promoterRouter
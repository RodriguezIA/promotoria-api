import { Router } from 'express'
import { authMiddleware, validateBody } from '../../core/middleware'
import { updateLocationPromoter, createPromoter, loginPromoter, getPromoters, uploadPromoterProfileImage } from './promoter.controller'
import { createPromoterSchema, loginPromoterSchema, updateLocationPromoterSchema } from './promoter.schema'
import { upload } from '../../core/middleware/upload.middleware'

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
promoterRouter.post('/login', loginPromoter)
promoterRouter.put('/update-location', validateBody(updateLocationPromoterSchema), updateLocationPromoter)

/**
 * @openapi
 * /promoters/{id}/profile-image:
 *   post:
 *     tags: [Promoters]
 *     summary: Subir imagen de perfil del promotor
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image: { type: string, format: binary }
 *     responses:
 *       200: { description: "Imagen de perfil actualizada." }
 *       400: { description: "Datos inválidos." }
 *       404: { description: "Promotor no encontrado." }
 */
promoterRouter.post('/:id/profile-image', authMiddleware, upload.single('image'), uploadPromoterProfileImage)

export default promoterRouter
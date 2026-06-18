import { Router } from 'express'
import { authMiddleware } from '../../core/middleware'
import { upload } from '../../core/middleware/upload.middleware'
import {
    createRequest,
    getAllRequests,
    getRequestById,
    updateRequest,
    deleteRequest
} from './requests.controller'

const requestRouter = Router()

/**
 * @openapi
 * /requests:
 *   post:
 *     tags: [Requests]
 *     summary: Crear solicitud (con imagen de anaquel opcional)
 *     description: Multipart. `products` es un JSON string con los productos y sus preguntas; `rackImage` es la imagen del anaquel.
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [id_user, id_client, vc_name, f_value]
 *             properties:
 *               id_user: { type: integer }
 *               id_client: { type: integer }
 *               vc_name: { type: string }
 *               f_value: { type: number }
 *               products:
 *                 type: string
 *                 description: 'JSON string. Ej: [{"id_product":1,"questions":[{"id_question":3}]}]'
 *               rackImage: { type: string, format: binary }
 *     responses:
 *       200: { description: "Solicitud creada." }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       500: { $ref: '#/components/responses/ServerError' }
 *   get:
 *     tags: [Requests]
 *     summary: Listar solicitudes (filtros + paginado)
 *     parameters:
 *       - { in: query, name: id_client, schema: { type: integer } }
 *       - { in: query, name: id_user, schema: { type: integer } }
 *       - { in: query, name: id_status, schema: { type: integer } }
 *       - { in: query, name: b_active, schema: { type: boolean } }
 *       - { in: query, name: page, schema: { type: integer, default: 1 } }
 *       - { in: query, name: limit, schema: { type: integer, default: 20 } }
 *     responses:
 *       200: { description: "Página de solicitudes." }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
requestRouter.post('/', authMiddleware, upload.single('rackImage'), createRequest)
requestRouter.get('/', authMiddleware, getAllRequests)

/**
 * @openapi
 * /requests/{id_request}:
 *   get:
 *     tags: [Requests]
 *     summary: Obtener una solicitud
 *     parameters:
 *       - in: path
 *         name: id_request
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: "Solicitud encontrada." }
 *       404: { description: "No encontrada." }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *   put:
 *     tags: [Requests]
 *     summary: Actualizar una solicitud (imagen opcional)
 *     parameters:
 *       - in: path
 *         name: id_request
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               vc_name: { type: string }
 *               f_value: { type: number }
 *               id_status: { type: integer }
 *               products: { type: string, description: "JSON string" }
 *               rackImage: { type: string, format: binary }
 *     responses:
 *       200: { description: "Solicitud actualizada." }
 *       404: { description: "No encontrada." }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *   delete:
 *     tags: [Requests]
 *     summary: Eliminar una solicitud
 *     parameters:
 *       - in: path
 *         name: id_request
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: "Solicitud eliminada." }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
requestRouter.get('/:id_request', authMiddleware, getRequestById)
requestRouter.put('/:id_request', authMiddleware, upload.single('rackImage'), updateRequest)
requestRouter.delete('/:id_request', authMiddleware, deleteRequest)

export default requestRouter

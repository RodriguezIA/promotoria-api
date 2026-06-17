import { Router } from 'express'
import { authMiddleware } from '../../core/middleware'
import {
    createOrder,
    getAllOrders,
    getOrderById,
    updateOrder,
    deleteOrder
} from './orders.controller'

const orderRouter = Router()

/**
 * @openapi
 * /orders:
 *   post:
 *     tags: [Orders]
 *     summary: Crear pedido a partir de solicitudes y tiendas
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [id_user, id_client, items]
 *             properties:
 *               id_user: { type: integer }
 *               id_client: { type: integer }
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required: [id_request, stores]
 *                   properties:
 *                     id_request: { type: integer }
 *                     stores:
 *                       type: array
 *                       items: { type: integer }
 *     responses:
 *       200: { description: "Pedido creado (y tareas generadas)." }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       500: { $ref: '#/components/responses/ServerError' }
 *   get:
 *     tags: [Orders]
 *     summary: Listar pedidos (filtros + paginado)
 *     parameters:
 *       - { in: query, name: id_client, schema: { type: integer } }
 *       - { in: query, name: id_user, schema: { type: integer } }
 *       - { in: query, name: id_status, schema: { type: integer } }
 *       - { in: query, name: page, schema: { type: integer, default: 1 } }
 *       - { in: query, name: limit, schema: { type: integer, default: 20 } }
 *     responses:
 *       200: { description: "Página de pedidos." }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
orderRouter.post('/', authMiddleware, createOrder)
orderRouter.get('/', authMiddleware, getAllOrders)

/**
 * @openapi
 * /orders/{id_order}:
 *   get:
 *     tags: [Orders]
 *     summary: Obtener un pedido
 *     parameters:
 *       - in: path
 *         name: id_order
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: "Pedido encontrado." }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *   put:
 *     tags: [Orders]
 *     summary: Actualizar un pedido
 *     parameters:
 *       - in: path
 *         name: id_order
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id_status: { type: integer }
 *               f_total: { type: number }
 *     responses:
 *       200: { description: "Pedido actualizado." }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *   delete:
 *     tags: [Orders]
 *     summary: Eliminar un pedido (y sus tareas)
 *     parameters:
 *       - in: path
 *         name: id_order
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: "Pedido eliminado." }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
orderRouter.get('/:id_order', authMiddleware, getOrderById)
orderRouter.put('/:id_order', authMiddleware, updateOrder)
orderRouter.delete('/:id_order', authMiddleware, deleteOrder)

export default orderRouter

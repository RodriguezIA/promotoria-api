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

orderRouter.post('/', authMiddleware, createOrder)
orderRouter.get('/', authMiddleware, getAllOrders)
orderRouter.get('/:id_order', authMiddleware, getOrderById)
orderRouter.put('/:id_order', authMiddleware, updateOrder)
orderRouter.delete('/:id_order', authMiddleware, deleteOrder)

export default orderRouter

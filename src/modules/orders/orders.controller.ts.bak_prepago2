import { Request, Response } from 'express'


import { Order } from './orders.service'
import { createTasksInSystem } from '../tasks/tasks.utils'
import { CreateOrderDTO, UpdateOrderDTO, OrderFiltersDTO } from './orders.dtos'


const orderService = new Order()


function parseNumber(value: any): number | undefined {
    if (value === undefined || value === null || value === '') return undefined
    const num = Number(value)
    return isNaN(num) ? undefined : num
}

export const createOrder = async (req: Request, res: Response) => {
    let order: Awaited<ReturnType<typeof orderService.createOrder>> | undefined
    try {
        const payload: CreateOrderDTO = req.body
        order = await orderService.createOrder(payload)
    } catch (error) {
        console.error('CREATE ORDER ERROR:', (error as any).message)
        res.status(400).json({
            ok: false,
            error: 1,
            data: null,
            message: (error as any).message || 'Error al crear el pedido',
            error_backend: error
        })
        return
    }

    // El pedido ya se creó; si la generación de tareas falla, el pedido no se
    // pierde y no debe reportarse como si la creación hubiera fallado por completo.
    try {
        await createTasksInSystem(order.id_order)
    } catch (error) {
        console.error('CREATE ORDER - TASK GENERATION ERROR:', (error as any).message)
        res.status(200).json({
            ok: true,
            error: 0,
            data: order,
            message: 'Pedido creado, pero ocurrió un error generando las tareas. Contacta a soporte.'
        })
        return
    }

    res.status(200).json({
        ok: true,
        error: 0,
        data: order,
        message: 'Pedido creado exitosamente'
    })
}

export const getAllOrders = async (req: Request, res: Response) => {
    try {
        const filters: OrderFiltersDTO = {
            id_client: parseNumber(req.query.id_client),
            id_user: parseNumber(req.query.id_user),
            id_status: parseNumber(req.query.id_status),
            page: parseNumber(req.query.page),
            limit: parseNumber(req.query.limit),
        }

        const result = await orderService.getAllOrders(filters)

        res.status(200).json({
            ok: true,
            error: 0,
            data: result,
            message: 'Pedidos obtenidos exitosamente'
        })
    } catch (error) {
        console.error('GET ALL ORDERS ERROR:', (error as any).message)
        res.status(500).json({
            ok: false,
            error: 1,
            data: null,
            message: 'Error al obtener los pedidos',
            error_backend: error
        })
    }
}

export const getOrderById = async (req: Request, res: Response) => {
    try {
        const { id_order } = req.params
        const order = await orderService.getOrderById(Number(id_order))

        if (!order) {
            res.status(404).json({
                ok: false,
                error: 1,
                data: null,
                message: 'Pedido no encontrado'
            })
            return
        }

        res.status(200).json({
            ok: true,
            error: 0,
            data: order,
            message: 'Pedido obtenido exitosamente'
        })
    } catch (error) {
        console.error('GET ORDER BY ID ERROR:', (error as any).message)
        res.status(500).json({
            ok: false,
            error: 1,
            data: null,
            message: 'Error al obtener el pedido',
            error_backend: error
        })
    }
}

export const updateOrder = async (req: Request, res: Response) => {
    try {
        const { id_order } = req.params
        const payload: UpdateOrderDTO = req.body

        const order = await orderService.updateOrder(Number(id_order), payload)

        res.status(200).json({
            ok: true,
            error: 0,
            data: order,
            message: 'Pedido actualizado exitosamente'
        })
    } catch (error) {
        console.error('UPDATE ORDER ERROR:', (error as any).message)
        res.status(500).json({
            ok: false,
            error: 1,
            data: null,
            message: 'Error al actualizar el pedido',
            error_backend: error
        })
    }
}

export const closeOrder = async (req: Request, res: Response) => {
    try {
        const { id_order } = req.params
        const id_user = req.user?.id || 0
        const order = await orderService.closeOrder(Number(id_order), id_user)

        res.status(200).json({
            ok: true,
            error: 0,
            data: order,
            message: 'Pedido cerrado exitosamente'
        })
    } catch (error) {
        console.error('CLOSE ORDER ERROR:', (error as any).message)
        res.status(409).json({
            ok: false,
            error: 1,
            data: null,
            message: (error as any).message || 'Error al cerrar el pedido',
            error_backend: error
        })
    }
}

export const deleteOrder = async (req: Request, res: Response) => {
    try {
        const { id_order } = req.params
        const id_user = (req as any).user?.id_user || 0
        const result = await orderService.deleteOrder(Number(id_order), id_user)

        res.status(200).json({
            ok: true,
            error: 0,
            data: result,
            message: 'Pedido eliminado exitosamente'
        })
    } catch (error) {
        console.error('DELETE ORDER ERROR:', (error as any).message)
        res.status(500).json({
            ok: false,
            error: 1,
            data: null,
            message: 'Error al eliminar el pedido',
            error_backend: error
        })
    }
}

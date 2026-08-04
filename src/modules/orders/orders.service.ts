import { prisma } from '../../core/prisma'
import { CreateOrderDTO, UpdateOrderDTO, OrderFiltersDTO } from './orders.dtos'
import { generateFolio } from '../../services/folio.service'
import { ORDER_STATUS } from '../../core/constants/status.constants'
import { NotificationService } from '../../services/notification.service'

export class Order {

    async createOrder(data: CreateOrderDTO) {
        return await prisma.$transaction(async (tx) => {
            const requestIds = [...new Set(data.items.map(i => i.id_request))]
            const requests = await tx.requests.findMany({
                where: { id_request: { in: requestIds }, b_active: true }
            })
            if (requests.length !== requestIds.length) {
                throw new Error('Una o más solicitudes no existen o están inactivas')
            }

            const storeIds = [...new Set(data.items.flatMap(i => i.stores))]
            const stores = await tx.stores.findMany({
                where: { id_store: { in: storeIds }, i_status: 1 }
            })
            if (stores.length !== storeIds.length) {
                throw new Error('Una o más tiendas no existen o están inactivas')
            }

            const requestMap = new Map(requests.map(r => [r.id_request, r.f_value]))
            let total = 0
            for (const item of data.items) {
                const val = requestMap.get(item.id_request)
                if (val) {
                    total += Number(val) * item.stores.length
                }
            }

            const now = new Date()

            const vc_folio = await generateFolio(tx, data.id_client, 'orders')

            const order = await tx.orders.create({
                data: {
                    id_user: data.id_user,
                    id_client: data.id_client,
                    vc_folio,
                    f_total: total,
                    dt_register: now,
                    dt_update: now,
                    id_status: 1
                }
            })

            for (const item of data.items) {
                const reqValue = requestMap.get(item.id_request)!
                for (const id_store of item.stores) {
                    await tx.order_items.create({
                        data: {
                            id_order: order.id_order,
                            id_request: item.id_request,
                            id_store,
                            f_value: reqValue
                        }
                    })
                }
            }

            await tx.order_logs.create({
                data: {
                    id_order: order.id_order,
                    id_usuario: data.id_user,
                    id_negocio: data.id_client,
                    vc_log: `Pedido creado con ${data.items.length} solicitudes`,
                    i_status: 1,
                    dt_registro: now
                }
            })

            return order
        })
    }

    async getAllOrders(filters: OrderFiltersDTO) {
        const page = filters.page ?? 1
        const limit = filters.limit ?? 20
        const skip = (page - 1) * limit

        const where: any = {}
        if (filters.id_client !== undefined) where.id_client = filters.id_client
        if (filters.id_user !== undefined) where.id_user = filters.id_user
        if (filters.id_status !== undefined) where.id_status = filters.id_status
        else where.id_status = { not: 0 }

        const [orders, total] = await Promise.all([
            prisma.orders.findMany({
                where,
                skip,
                take: limit,
                orderBy: { dt_register: 'desc' },
                include: {
                    order_items: {
                        include: {
                            request: {
                                select: { id_request: true, vc_folio: true, vc_name: true, f_value: true }
                            },
                            store: {
                                select: { id_store: true, name: true }
                            }
                        }
                    }
                }
            }),
            prisma.orders.count({ where })
        ])

        return {
            data: orders,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        }
    }

    async getOrderById(id_order: number) {
        return await prisma.orders.findUnique({
            where: { id_order },
            include: {
                order_items: {
                    include: {
                        request: {
                            select: { id_request: true, vc_folio: true, vc_name: true, f_value: true }
                        },
                        store: {
                            select: { id_store: true, name: true }
                        }
                    }
                },
                order_logs: {
                    orderBy: { dt_registro: 'desc' }
                }
            }
        })
    }

    async updateOrder(id_order: number, data: UpdateOrderDTO) {
        return await prisma.orders.update({
            where: { id_order },
            data: {
                id_status: data.id_status,
                f_total: data.f_total,
                dt_update: new Date()
            }
        })
    }

    async deleteOrder(id_order: number, id_user: number) {
        return await prisma.$transaction(async (tx) => {
            await tx.orders.update({
                where: { id_order },
                data: { id_status: 0, dt_update: new Date() }
            })

            await tx.tasks.updateMany({
                where: { id_order },
                data: { id_status: 0, dt_update: new Date() }
            })

            await tx.order_logs.create({
                data: {
                    id_order,
                    id_usuario: id_user,
                    vc_log: 'Pedido eliminado',
                    i_status: 1,
                    dt_registro: new Date()
                }
            })

            return { id_order, deleted: true }
        })
    }

    async closeOrder(id_order: number, id_user: number) {
        const { updated, cancelledTasks } = await prisma.$transaction(async (tx) => {
            const order = await tx.orders.findUnique({ where: { id_order } })
            if (!order) {
                throw new Error('Pedido no encontrado')
            }
            if (order.id_status !== ORDER_STATUS.CREADO) {
                throw new Error('Solo se puede cerrar un pedido que está en estatus creado')
            }

            const updated = await tx.orders.update({
                where: { id_order },
                data: { id_status: ORDER_STATUS.CERRADO, dt_update: new Date() }
            })

            // Tareas que aún no llegaron a revisión (id_status < 6, sin contar las
            // ya canceladas) se cancelan "por negocio" al cerrar el pedido. Las que
            // ya están en revisión o terminadas (>= 6) se dejan tal cual.
            const unansweredTasks = await tx.tasks.findMany({
                where: { id_order, id_status: { lt: 6, not: 0 } },
                select: {
                    id_task: true,
                    promoter: { select: { fcm_token: true } },
                    store: { select: { name: true } },
                }
            })

            if (unansweredTasks.length > 0) {
                await tx.tasks.updateMany({
                    where: { id_task: { in: unansweredTasks.map(t => t.id_task) } },
                    data: {
                        id_status: 0,
                        vc_cancel_type: 'negocio',
                        vc_cancel_reason: 'Cierre de pedido',
                        dt_update: new Date(),
                    }
                })
            }

            // Tareas que ya están en revisión (6) se aprueban automáticamente al
            // cerrar el pedido -> pasan a 7 ("Terminada con éxito"), igual que si
            // un admin le hubiera dado "Aceptar" a mano.
            const inReviewCount = await tx.tasks.updateMany({
                where: { id_order, id_status: 6 },
                data: { id_status: 7, dt_update: new Date() }
            })

            const logParts: string[] = []
            if (unansweredTasks.length > 0) {
                logParts.push(`${unansweredTasks.length} tarea(s) sin contestar canceladas por cierre de pedido`)
            }
            if (inReviewCount.count > 0) {
                logParts.push(`${inReviewCount.count} tarea(s) en revisión aprobadas automáticamente`)
            }

            await tx.order_logs.create({
                data: {
                    id_order,
                    id_usuario: id_user,
                    vc_log: logParts.length > 0 ? `Pedido cerrado; ${logParts.join('; ')}` : 'Pedido cerrado',
                    i_status: 1,
                    dt_registro: new Date()
                }
            })

            return { updated, cancelledTasks: unansweredTasks }
        })

        for (const task of cancelledTasks) {
            if (!task.promoter?.fcm_token) continue
            try {
                await NotificationService.sendPushNotification(task.promoter.fcm_token, {
                    title: 'Tarea cancelada',
                    body: `Tu tarea en ${task.store?.name ?? 'la tienda'} fue cancelada: el pedido fue cerrado.`,
                    // Sin id_task en data a propósito: el listener de la app navega a
                    // /task-offer/:id en cuanto ve id_task en el payload (pensado para
                    // ofertas nuevas), y esta tarea ya no es una oferta válida.
                    data: { type: 'task_cancelled' },
                })
            } catch (error) {
                console.error(`[Order] Error al notificar cancelación de la tarea ${task.id_task} por cierre de pedido:`, error)
            }
        }

        return updated
    }
}

import { prisma } from '../../core/prisma'
import { CreateOrderDTO, UpdateOrderDTO, OrderFiltersDTO } from './orders.dtos'
import { generateFolio } from '../../services/folio.service'

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
}

import { Worker, Job } from 'bullmq'
import { connectionWorker } from './conection'
import { prisma } from '../prisma'
import { ORDER_STATUS } from '../constants/status.constants'
import { Order } from '../../modules/orders/orders.service'

const orderService = new Order()

export const orderAutoCloseWorker = new Worker('order_auto_close_queue', async (job: Job) => {
    const settings = await prisma.task_settings.findUnique({ where: { id_setting: 1 } })
    const timeoutHours = settings?.i_order_auto_close_hours ?? 24

    const cutoff = new Date(Date.now() - timeoutHours * 60 * 60 * 1000)

    const expiredOrders = await prisma.orders.findMany({
        where: {
            id_status: ORDER_STATUS.CREADO,
            dt_register: { lte: cutoff },
        },
        select: { id_order: true, id_user: true, vc_folio: true },
    })

    if (expiredOrders.length === 0) {
        console.log(`[OrderAutoClose] Sin pedidos abiertos que hayan superado las ${timeoutHours}h.`)
        return
    }

    console.log(`[OrderAutoClose] ${expiredOrders.length} pedido(s) superaron las ${timeoutHours}h abiertos. Cerrando automaticamente...`)

    for (const order of expiredOrders) {
        try {
            // Reutiliza la misma logica que el cierre manual: cancela las
            // tareas que nadie tomo (para que dejen de notificar) y aprueba
            // las que ya estaban en revision.
            await orderService.closeOrder(order.id_order, order.id_user)
            console.log(`[OrderAutoClose] Pedido ${order.id_order} (folio ${order.vc_folio}) cerrado automaticamente por vencimiento del plazo de ${timeoutHours}h.`)
        } catch (error) {
            console.error(`[OrderAutoClose] Error al cerrar automaticamente el pedido ${order.id_order}:`, error)
        }
    }
}, { connection: connectionWorker })

orderAutoCloseWorker.on('failed', (job, err) => {
    console.error(`[OrderAutoClose] Job ${job?.id} falló:`, err.message)
})

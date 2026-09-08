import { prisma } from '../../core/prisma'
import { StorageService } from '../../services/storage.service'

interface PreorderItemInput {
    id_product: number
    quantity: number
}

export class Preorder {

    /**
     * Confirma que la tarea pertenece a una solicitud con el extra
     * "Prepedido" activado, y regresa la tarea con lo necesario (tienda,
     * cliente) para calcular el faltante.
     */
    private async getTaskWithPreorderCheck(id_task: number) {
        const task = await prisma.tasks.findUnique({
            where: { id_task },
            include: {
                request: {
                    select: {
                        b_preorder: true,
                        request_products: { select: { id_product: true } },
                    }
                },
                store: { select: { id_store: true, name: true } },
            },
        })
        if (!task) throw new Error('Tarea no encontrada')
        if (!task.request?.b_preorder) {
            throw new Error('Esta tarea no tiene el extra "Prepedido" activado')
        }
        return task
    }

    /**
     * Compara, para la tienda de esta tarea, la ultima pieza contada
     * (store_product_stock, ya alimentada por la pregunta de sistema de
     * conteo de piezas) contra el minimo que el cliente configuro para esa
     * tienda/producto (product_stock_minimums). Solo considera los productos
     * que son parte de ESTA solicitud (no todos los que tengan minimo
     * configurado en la tienda, aunque sean de otras solicitudes/clientes).
     * Regresa solo los productos donde falte (quantity < minimum).
     */
    async getShortfall(id_task: number) {
        const task = await this.getTaskWithPreorderCheck(id_task)

        const requestProductIds = task.request!.request_products.map(rp => rp.id_product)
        if (requestProductIds.length === 0) return { store_name: task.store.name, items: [] }

        const minimums = await prisma.product_stock_minimums.findMany({
            where: { id_store: task.id_store, id_product: { in: requestProductIds } },
            include: { product: { select: { id_product: true, name: true } } },
        })
        if (minimums.length === 0) return { store_name: task.store.name, items: [] }

        const readings = await prisma.store_product_stock.findMany({
            where: { id_store: task.id_store, id_product: { in: minimums.map(m => m.id_product) } },
        })
        const readingByProduct = new Map(readings.map(r => [r.id_product, r.i_quantity]))

        const items = minimums
            .map(m => {
                const quantity = readingByProduct.get(m.id_product) ?? 0
                const shortfall = m.i_minimum - quantity
                return {
                    id_product: m.id_product,
                    name: m.product.name,
                    quantity,
                    minimum: m.i_minimum,
                    shortfall: Math.max(shortfall, 0),
                }
            })
            .filter(item => item.shortfall > 0)

        return { store_name: task.store.name, items }
    }

    /**
     * Guarda el pedido acordado (puede diferir del faltante calculado, ya
     * que es lo que el promotor y el encargado negociaron), junto con su
     * numero de WhatsApp y firma electronica. Solo se puede levantar un
     * prepedido por tarea.
     */
    async createPreorder(input: {
        id_task: number
        manager_whatsapp: string
        preferred_date: Date
        preferred_time: 'MAÑANA' | 'TARDE'
        signature: { buffer: Buffer; mime: string }
        items: PreorderItemInput[]
    }) {
        const task = await this.getTaskWithPreorderCheck(input.id_task)

        const existing = await prisma.task_preorders.findUnique({ where: { id_task: input.id_task } })
        if (existing) throw new Error('Esta tarea ya tiene un prepedido levantado')

        if (!input.items || input.items.length === 0) {
            throw new Error('El pedido debe tener al menos un producto')
        }

        const { url: signatureUrl } = await StorageService.uploadAsset({
            entity: 'task_preorder_signature',
            entity_id: input.id_task,
            buffer: input.signature.buffer,
            mime: input.signature.mime,
            id_client: task.id_client,
            id_user: task.id_promoter ?? 0,
        })

        const preorder = await prisma.$transaction(async (tx) => {
            const created = await tx.task_preorders.create({
                data: {
                    id_task: input.id_task,
                    manager_whatsapp: input.manager_whatsapp,
                    manager_signature: signatureUrl,
                    preferred_date: input.preferred_date,
                    preferred_time: input.preferred_time,
                },
            })
            await tx.task_preorder_items.createMany({
                data: input.items.map(item => ({
                    id_preorder: created.id_preorder,
                    id_product: item.id_product,
                    i_quantity: item.quantity,
                })),
            })
            return created
        })

        return await this.getPreorder(input.id_task) ?? preorder
    }

    async getPreorder(id_task: number) {
        return await prisma.task_preorders.findUnique({
            where: { id_task },
            include: { items: { include: { product: { select: { id_product: true, name: true } } } } },
        })
    }

    /**
     * Todos los prepedidos de un cliente empresarial (a traves de sus
     * tareas), para que los vea en su panel — que tienda, que dia y turno
     * quiere recibirlo, y que se va a surtir.
     */
    async getPreordersByClient(id_client: number) {
        return await prisma.task_preorders.findMany({
            where: { task: { id_client } },
            include: {
                items: { include: { product: { select: { id_product: true, name: true } } } },
                task: {
                    select: {
                        id_task: true,
                        vc_folio: true,
                        store: { select: { id_store: true, name: true } },
                        promoter: { select: { id: true, name: true, lastname: true } },
                    },
                },
            },
            orderBy: { preferred_date: 'asc' },
        })
    }

    /**
     * Marca un prepedido como surtido (ya se le entrego la mercancia a la
     * tienda) o de vuelta a sin surtir. Lo usa el cliente empresarial desde
     * su panel de "Mis Prepedidos".
     */
    async updatePreorderStatus(id_task: number, id_status: number) {
        const preorder = await prisma.task_preorders.findUnique({ where: { id_task } })
        if (!preorder) throw new Error('Prepedido no encontrado')
        return await prisma.task_preorders.update({
            where: { id_task },
            data: { id_status },
        })
    }
}

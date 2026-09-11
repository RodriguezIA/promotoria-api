import { prisma } from '../../core/prisma'

interface RouteTemplateData {
    name: string
    recurrence_type: string
    day_of_week?: number | null
    interval_weeks?: number | null
    specific_dates?: string | null
    storeIds: number[]
}

export class RouteTemplateService {
    async create(data: RouteTemplateData & { id_client: number }) {
        return await prisma.route_templates.create({
            data: {
                id_client: data.id_client,
                name: data.name,
                recurrence_type: data.recurrence_type,
                day_of_week: data.day_of_week ?? null,
                interval_weeks: data.interval_weeks ?? null,
                specific_dates: data.specific_dates ?? null,
                stores: {
                    create: data.storeIds.map((id_store) => ({ id_store })),
                },
            },
            include: { stores: true },
        })
    }

    async update(id_route_template: number, data: RouteTemplateData) {
        return await prisma.$transaction(async (tx) => {
            await tx.route_templates.update({
                where: { id_route_template },
                data: {
                    name: data.name,
                    recurrence_type: data.recurrence_type,
                    day_of_week: data.day_of_week ?? null,
                    interval_weeks: data.interval_weeks ?? null,
                    specific_dates: data.specific_dates ?? null,
                },
            })
            // Mas simple y seguro reemplazar todas las tiendas que intentar
            // calcular un diff -- una ruta no suele tener cientos de tiendas.
            await tx.route_template_stores.deleteMany({ where: { id_route_template } })
            await tx.route_template_stores.createMany({
                data: data.storeIds.map((id_store) => ({ id_route_template, id_store })),
            })
            return await tx.route_templates.findUnique({
                where: { id_route_template },
                include: { stores: true },
            })
        })
    }

    async getAllByClient(id_client: number) {
        return await prisma.route_templates.findMany({
            where: { id_client },
            include: { stores: true },
            orderBy: { name: 'asc' },
        })
    }

    async getById(id_route_template: number) {
        return await prisma.route_templates.findUnique({
            where: { id_route_template },
            include: { stores: true },
        })
    }

    async delete(id_route_template: number) {
        return await prisma.route_templates.delete({ where: { id_route_template } })
    }

    /**
     * Estima cuanto le podria generar de venta una ruta, comparando el
     * minimo configurado de cada producto en cada tienda contra la ultima
     * existencia que conto un promotor. Si a una tienda nunca le han
     * configurado minimos (nunca ha ido un promotor a hacer el conteo
     * inicial), o si la ultima actualizacion tiene mas de 15 dias, se
     * marca para que el panel muestre el mensaje correspondiente en vez
     * de un numero que ya no es confiable.
     */
    async estimateSales(storeIds: number[]) {
        const STALE_DAYS = 15
        const cutoff = new Date(Date.now() - STALE_DAYS * 24 * 60 * 60 * 1000)

        const [minimums, readings] = await Promise.all([
            prisma.product_stock_minimums.findMany({
                where: { id_store: { in: storeIds } },
                include: { product: { select: { id_product: true, f_store_price: true } } },
            }),
            prisma.store_product_stock.findMany({
                where: { id_store: { in: storeIds } },
            }),
        ])

        const minimumsByStore = new Map<number, typeof minimums>()
        for (const m of minimums) {
            if (!minimumsByStore.has(m.id_store)) minimumsByStore.set(m.id_store, [])
            minimumsByStore.get(m.id_store)!.push(m)
        }
        const readingByStoreProduct = new Map<string, { i_quantity: number; dt_register: Date }>()
        const lastReadingByStore = new Map<number, Date>()
        for (const r of readings) {
            readingByStoreProduct.set(`${r.id_store}_${r.id_product}`, { i_quantity: r.i_quantity, dt_register: r.dt_register })
            const current = lastReadingByStore.get(r.id_store)
            if (!current || r.dt_register > current) lastReadingByStore.set(r.id_store, r.dt_register)
        }

        const perStore = storeIds.map((id_store) => {
            const storeMinimums = minimumsByStore.get(id_store) ?? []
            const lastUpdate = lastReadingByStore.get(id_store) ?? null
            const hasMinimums = storeMinimums.length > 0
            const isStale = lastUpdate ? lastUpdate < cutoff : true

            let estimatedValue = 0
            if (hasMinimums && !isStale) {
                for (const m of storeMinimums) {
                    const reading = readingByStoreProduct.get(`${id_store}_${m.id_product}`)
                    const quantity = reading?.i_quantity ?? 0
                    const shortfall = Math.max(0, m.i_minimum - quantity)
                    const price = Number(m.product.f_store_price ?? 0)
                    estimatedValue += shortfall * price
                }
            }

            return {
                id_store,
                estimated_value: hasMinimums && !isStale ? estimatedValue : 0,
                has_minimums: hasMinimums,
                is_stale: hasMinimums && isStale,
                last_update: lastUpdate,
            }
        })

        const total = perStore.reduce((sum, s) => sum + s.estimated_value, 0)
        return { stores: perStore, total }
    }
}

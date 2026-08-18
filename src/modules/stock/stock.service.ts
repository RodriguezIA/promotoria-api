import { prisma } from '../../core/prisma'

export type StockSemaphore = 'red' | 'yellow' | 'green' | null

interface SetMinimumInput {
    id_product: number
    id_store: number
    i_minimum: number
    id_user_updater?: number
}

export class Stock {

    async setMinimum(input: SetMinimumInput) {
        return await prisma.product_stock_minimums.upsert({
            where: { id_product_id_store: { id_product: input.id_product, id_store: input.id_store } },
            update: { i_minimum: input.i_minimum, id_user_updater: input.id_user_updater },
            create: {
                id_product: input.id_product,
                id_store: input.id_store,
                i_minimum: input.i_minimum,
                id_user_updater: input.id_user_updater,
            },
        })
    }

    async getMinimumsByStore(id_store: number, id_client?: number) {
        return await prisma.product_stock_minimums.findMany({
            where: {
                id_store,
                ...(id_client ? { product: { id_client } } : {}),
            },
            include: { product: { select: { id_product: true, name: true, vc_image: true } } },
        })
    }

    /**
     * Semaforo por producto en una tienda: rojo si esta por debajo del
     * minimo, amarillo si esta a 20% o menos de distancia del minimo (le
     * falta poco para llegar), verde si esta bien surtida. Si no hay lectura
     * o no hay minimo configurado, no se puede calcular (null).
     */
    private semaphoreFor(quantity: number | null, minimum: number | null): StockSemaphore {
        if (quantity === null || minimum === null || minimum <= 0) return null
        if (quantity < minimum) return 'red'
        if (quantity <= minimum * 1.2) return 'yellow'
        return 'green'
    }

    /**
     * Datos para el mapa del cliente: tiendas (con su ubicacion, canal/logo,
     * y semaforo de inventario resultado del peor caso entre sus productos
     * con minimo configurado) y promotores actualmente activos (con tarea en
     * curso) en esas tiendas. Filtrable por canal/estado/municipio.
     */
    async getMapData(filters: { id_channel?: number; id_state?: number; id_municipio?: number; id_client?: number }) {
        const stores = await prisma.stores.findMany({
            where: {
                i_status: 1,
                ...(filters.id_channel ? { id_channel_sale: filters.id_channel } : {}),
            },
            include: {
                sales_channel: { select: { id: true, name: true, url_image: true } },
                stock_minimums: {
                    include: { product: { select: { id_product: true, name: true, id_client: true } } },
                },
            },
        })

        const storeIds = stores.map(s => s.id_store)
        const [addresses, readings, activeTasks] = await Promise.all([
            prisma.addresses.findMany({
                where: { entity_type: 'store', entity_id: { in: storeIds }, is_active: true },
                include: { state: { select: { id: true, name: true } }, city: { select: { id: true, name: true } } },
            }),
            prisma.store_product_stock.findMany({
                where: { id_store: { in: storeIds } },
            }),
            prisma.tasks.findMany({
                where: { id_status: { gte: 2, lte: 6 }, id_store: { in: storeIds }, id_promoter: { not: null } },
                select: {
                    id_store: true,
                    promoter: { select: { id: true, name: true, lastname: true, latitude: true, longitude: true } },
                },
            }),
        ])

        const addressByStore = new Map(addresses.map(a => [a.entity_id, a]))
        const readingsByStore = new Map<number, typeof readings>()
        for (const r of readings) {
            if (!readingsByStore.has(r.id_store)) readingsByStore.set(r.id_store, [])
            readingsByStore.get(r.id_store)!.push(r)
        }
        const activePromotersByStore = new Map<number, typeof activeTasks>()
        for (const t of activeTasks) {
            if (!t.promoter) continue
            if (!activePromotersByStore.has(t.id_store)) activePromotersByStore.set(t.id_store, [])
            activePromotersByStore.get(t.id_store)!.push(t)
        }

        const result = stores
            .map(store => {
                const address = addressByStore.get(store.id_store)
                if (!address || address.latitude === null || address.longitude === null) return null
                if (filters.id_state && address.id_state !== filters.id_state) return null
                if (filters.id_municipio && address.id_city !== filters.id_municipio) return null

                const minimums = filters.id_client
                    ? store.stock_minimums.filter(m => m.product.id_client === filters.id_client)
                    : store.stock_minimums
                const storeReadings = readingsByStore.get(store.id_store) ?? []
                const readingByProduct = new Map(storeReadings.map(r => [r.id_product, r.i_quantity]))

                const products = minimums.map(m => {
                    const quantity = readingByProduct.get(m.id_product) ?? null
                    return {
                        id_product: m.id_product,
                        name: m.product.name,
                        quantity,
                        minimum: m.i_minimum,
                        semaphore: this.semaphoreFor(quantity, m.i_minimum),
                    }
                })

                // El semaforo de la tienda es el peor caso entre sus productos.
                const severity: Record<Exclude<StockSemaphore, null>, number> = { red: 0, yellow: 1, green: 2 }
                const worst = products.reduce<StockSemaphore>((acc, p) => {
                    if (!p.semaphore) return acc
                    if (!acc) return p.semaphore
                    return severity[p.semaphore] < severity[acc] ? p.semaphore : acc
                }, null)

                const promoters = (activePromotersByStore.get(store.id_store) ?? [])
                    .filter(t => t.promoter!.latitude !== null && t.promoter!.longitude !== null)
                    .map(t => ({
                        id_promoter: t.promoter!.id,
                        name: `${t.promoter!.name}${t.promoter!.lastname ? ' ' + t.promoter!.lastname : ''}`,
                        latitude: Number(t.promoter!.latitude),
                        longitude: Number(t.promoter!.longitude),
                    }))

                return {
                    id_store: store.id_store,
                    name: store.name,
                    latitude: Number(address.latitude),
                    longitude: Number(address.longitude),
                    id_state: address.id_state,
                    state_name: address.state?.name ?? null,
                    id_municipio: address.id_city,
                    municipio_name: address.city?.name ?? null,
                    channel: store.sales_channel
                        ? { id: store.sales_channel.id, name: store.sales_channel.name, logo: store.sales_channel.url_image }
                        : null,
                    semaphore: worst,
                    products,
                    active_promoters: promoters,
                }
            })
            .filter((s): s is NonNullable<typeof s> => s !== null)

        return result
    }
}

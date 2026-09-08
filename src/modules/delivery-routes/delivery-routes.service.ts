import { prisma } from '../../core/prisma'

export class DeliveryRoutes {
    /**
     * Prepedidos sin surtir de un cliente, listos para asignarse a una ruta.
     * Es lo que alimenta tanto el mapa de Logistica (marcadores) como el
     * modo lista de "Organizar ruta". Opcionalmente filtra por fecha y
     * turno exactos (ej. "lunes 26/9 por la tarde").
     */
    async getPendingPreordersForClient(id_client: number, filters?: { date?: Date; time?: 'MAÑANA' | 'TARDE' }) {
        const preorders = await prisma.task_preorders.findMany({
            where: {
                id_status: 0, // sin surtir
                ...(filters?.date ? { preferred_date: filters.date } : {}),
                ...(filters?.time ? { preferred_time: filters.time } : {}),
                task: { id_client },
                // Ya no se muestran en la lista para asignar si ya tienen
                // una parada de ruta asignada (evita duplicar la entrega).
                delivery_stops: { none: {} },
            },
            include: {
                task: { include: { store: { select: { id_store: true, name: true } } } },
                items: { include: { product: { select: { id_product: true, name: true } } } },
            },
            orderBy: { preferred_date: 'asc' },
        })

        const storeIds = [...new Set(preorders.map(p => p.task.store.id_store))]
        const addresses = await prisma.addresses.findMany({
            where: { entity_type: 'store', entity_id: { in: storeIds }, is_active: true },
            select: { entity_id: true, latitude: true, longitude: true, street: true },
        })
        const addressByStore = new Map(addresses.map(a => [a.entity_id, a]))

        return preorders.map(p => ({
            ...p,
            task: {
                ...p.task,
                store: {
                    ...p.task.store,
                    address: addressByStore.get(p.task.store.id_store) ?? null,
                },
            },
        }))
    }

    async createRoute(input: {
        id_client: number
        id_driver: number
        route_date: Date
        stops: { id_store: number; id_preorder: number }[]
    }) {
        const driver = await prisma.drivers.findUnique({ where: { id_driver: input.id_driver } })
        if (!driver || driver.id_client !== input.id_client) throw new Error('Chofer no encontrado')
        if (input.stops.length === 0) throw new Error('La ruta debe tener al menos una parada')

        return await prisma.$transaction(async (tx) => {
            const route = await tx.delivery_routes.create({
                data: { id_client: input.id_client, id_driver: input.id_driver, route_date: input.route_date },
            })
            await tx.delivery_route_stops.createMany({
                data: input.stops.map((stop, index) => ({
                    id_route: route.id_route,
                    id_store: stop.id_store,
                    id_preorder: stop.id_preorder,
                    i_order: index + 1,
                })),
            })
            return route
        })
    }

    async getRoutesByClient(id_client: number) {
        return await prisma.delivery_routes.findMany({
            where: { id_client },
            include: {
                driver: { select: { id_driver: true, name: true, phone: true } },
                stops: {
                    include: {
                        store: { select: { id_store: true, name: true } },
                        preorder: { include: { items: { include: { product: { select: { name: true } } } } } },
                    },
                    orderBy: { i_order: 'asc' },
                },
            },
            orderBy: { route_date: 'desc' },
        })
    }

    async getRoutesByDriver(id_driver: number) {
        const routes = await prisma.delivery_routes.findMany({
            where: { id_driver },
            include: {
                stops: {
                    include: {
                        store: { select: { id_store: true, name: true } },
                        preorder: { include: { items: { include: { product: { select: { name: true } } } } } },
                    },
                    orderBy: { i_order: 'asc' },
                },
            },
            orderBy: { route_date: 'desc' },
        })

        const storeIds = [...new Set(routes.flatMap(r => r.stops.map(s => s.id_store)))]
        const addresses = await prisma.addresses.findMany({
            where: { entity_type: 'store', entity_id: { in: storeIds }, is_active: true },
            select: { entity_id: true, latitude: true, longitude: true, street: true },
        })
        const addressByStore = new Map(addresses.map(a => [a.entity_id, a]))

        return routes.map(route => ({
            ...route,
            stops: route.stops.map(stop => ({
                ...stop,
                store: { ...stop.store, address: addressByStore.get(stop.id_store) ?? null },
            })),
        }))
    }

    async updateStop(id_stop: number, id_driver: number, input: {
        i_status?: number
        b_delivered?: boolean
        vc_no_delivery_reason?: string
        payment_method?: 'EFECTIVO' | 'TRANSFERENCIA' | 'CONSIGNA'
        f_amount_paid?: number
    }) {
        const stop = await prisma.delivery_route_stops.findUnique({
            where: { id_stop },
            include: { route: true },
        })
        if (!stop || stop.route.id_driver !== id_driver) throw new Error('Parada no encontrada')

        return await prisma.delivery_route_stops.update({
            where: { id_stop },
            data: {
                ...input,
                dt_visited: input.i_status === 1 ? new Date() : undefined,
            },
        })
    }
}

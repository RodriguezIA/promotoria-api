import { prisma } from '../../core/prisma'

export class RouteTemplateService {
    async create(data: { id_client: number; name: string; recurrence_type: string; recurrence_days?: string | null; storeIds: number[] }) {
        return await prisma.route_templates.create({
            data: {
                id_client: data.id_client,
                name: data.name,
                recurrence_type: data.recurrence_type,
                recurrence_days: data.recurrence_days ?? null,
                stores: {
                    create: data.storeIds.map((id_store) => ({ id_store })),
                },
            },
            include: { stores: true },
        })
    }

    async update(id_route_template: number, data: { name: string; recurrence_type: string; recurrence_days?: string | null; storeIds: number[] }) {
        return await prisma.$transaction(async (tx) => {
            await tx.route_templates.update({
                where: { id_route_template },
                data: {
                    name: data.name,
                    recurrence_type: data.recurrence_type,
                    recurrence_days: data.recurrence_days ?? null,
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
}

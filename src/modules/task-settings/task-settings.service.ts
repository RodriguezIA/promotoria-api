import { prisma } from '../../core/prisma'

export class TaskSettings {
    async get() {
        const existing = await prisma.task_settings.findUnique({ where: { id_setting: 1 } })
        if (existing) return existing
        return await prisma.task_settings.create({ data: { id_setting: 1 } })
    }

    async update(input: { i_review_timeout_hours?: number; i_order_auto_close_hours?: number }, id_user_updater: number) {
        await this.get()
        return await prisma.task_settings.update({
            where: { id_setting: 1 },
            data: {
                ...(input.i_review_timeout_hours !== undefined ? { i_review_timeout_hours: input.i_review_timeout_hours } : {}),
                ...(input.i_order_auto_close_hours !== undefined ? { i_order_auto_close_hours: input.i_order_auto_close_hours } : {}),
                id_user_updater,
            }
        })
    }

    /**
     * Configura como se cobra el extra "Prepedido": monto fijo agregado al
     * total de la solicitud, o porcentaje extra sobre el total. El master
     * lo puede cambiar cuando quiera, no esta fijo en el codigo.
     */
    async updatePreorderPricing(input: {
        pricing_type: 'FIXED' | 'PERCENTAGE'
        pricing_value: number
        id_user_updater: number
    }) {
        await this.get()
        return await prisma.task_settings.update({
            where: { id_setting: 1 },
            data: {
                preorder_pricing_type: input.pricing_type,
                preorder_pricing_value: input.pricing_value,
                id_user_updater: input.id_user_updater,
            }
        })
    }

    /**
     * Calcula cuanto se le suma al total de una solicitud por tener el
     * extra "Prepedido" activado, usando la configuracion actual.
     */
    async calculatePreorderSurcharge(baseValue: number): Promise<number> {
        const settings = await this.get()
        const value = Number(settings.preorder_pricing_value)
        if (value <= 0) return 0
        if (settings.preorder_pricing_type === 'PERCENTAGE') {
            return Math.round((baseValue * (value / 100)) * 100) / 100
        }
        return value
    }
}

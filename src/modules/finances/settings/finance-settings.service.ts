import { prisma } from '../../../core/prisma'

export class FinanceSettings {
    async get() {
        const settings = await prisma.finance_settings.findUnique({ where: { id_setting: 1 } })
        if (!settings) {
            throw new Error('finance_settings no está inicializado. Corre scripts/create_finance_tables.ts')
        }
        return settings
    }

    async update(
        data: { f_promoter_commission_percentage?: number, f_activator_commission_percentage?: number },
        id_user_updater: number
    ) {
        return await prisma.finance_settings.update({
            where: { id_setting: 1 },
            data: {
                ...(data.f_promoter_commission_percentage !== undefined ? { f_promoter_commission_percentage: data.f_promoter_commission_percentage } : {}),
                ...(data.f_activator_commission_percentage !== undefined ? { f_activator_commission_percentage: data.f_activator_commission_percentage } : {}),
                id_user_updater,
            }
        })
    }
}

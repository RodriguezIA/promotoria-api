import { prisma } from '../../core/prisma'

export class TaskSettings {
    async get() {
        const existing = await prisma.task_settings.findUnique({ where: { id_setting: 1 } })
        if (existing) return existing
        return await prisma.task_settings.create({ data: { id_setting: 1 } })
    }

    async update(i_review_timeout_hours: number, id_user_updater: number) {
        await this.get()
        return await prisma.task_settings.update({
            where: { id_setting: 1 },
            data: { i_review_timeout_hours, id_user_updater }
        })
    }
}

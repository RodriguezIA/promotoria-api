import { prisma } from '../../core/prisma'
import { ACTIVATOR_PAYMENT_STATUS } from '../finances/finances.constants'
import { findEligibleDriverTasks, getFinanceSettings } from '../finances/driver-activator-payments/driver-commission'
import { promoterRule, activatorRule } from '../finances/commission'

export class DriverReferrals {

    /** El código del chofer es CH + su número; se crea la primera vez que se pide. */
    private async ensureCode(id_driver: number): Promise<string> {
        const d = await prisma.drivers.findUnique({ where: { id_driver }, select: { vc_referral_code: true } })
        if (!d) throw new Error('Chofer no encontrado')
        if (d.vc_referral_code) return d.vc_referral_code
        const code = `CH${id_driver}`
        await prisma.drivers.update({ where: { id_driver }, data: { vc_referral_code: code } })
        return code
    }

    private async pendingByPromoter(id_driver: number) {
        const settings = await getFinanceSettings()
        const eligible = await findEligibleDriverTasks(
            { id_driver },
            promoterRule(settings),
            activatorRule(settings)
        )
        const map = new Map<number, number>()
        for (const t of eligible) map.set(t.id_promoter, (map.get(t.id_promoter) ?? 0) + t.f_amount)
        return map
    }

    async getAffiliation(id_driver: number) {
        const code = await this.ensureCode(id_driver)

        const [paid, toPay] = await Promise.all([
            prisma.driver_activator_payments.aggregate({
                where: { id_driver, id_status: ACTIVATOR_PAYMENT_STATUS.PAGADO },
                _sum: { f_total: true },
            }),
            prisma.driver_activator_payments.aggregate({
                where: { id_driver, id_status: ACTIVATOR_PAYMENT_STATUS.POR_PAGAR },
                _sum: { f_total: true },
            }),
        ])
        const pendingMap = await this.pendingByPromoter(id_driver)
        const pending = [...pendingMap.values()].reduce((s, n) => s + n, 0)
        const invited = await prisma.promoters.count({ where: { id_driver_activator: id_driver } })

        const paidN = Number(paid._sum.f_total ?? 0)
        const toPayN = Number(toPay._sum.f_total ?? 0)
        const pendingN = Math.round(pending * 100) / 100
        return {
            code,
            invited,
            paid: paidN,
            toPay: toPayN,
            pending: pendingN,
            earnings: Math.round((paidN + toPayN + pendingN) * 100) / 100,
        }
    }

    async getReferrals(id_driver: number) {
        const invitees = await prisma.promoters.findMany({
            where: { id_driver_activator: id_driver },
            select: { id: true, name: true, lastname: true, isActive: true, dt_register: true },
            orderBy: { dt_register: 'desc' },
        })
        if (!invitees.length) return []
        const inviteeIds = invitees.map(p => p.id)

        const paymentTasks = await prisma.promoter_payment_tasks.findMany({
            where: { task: { id_promoter: { in: inviteeIds } } },
            select: { f_amount: true, task: { select: { id_promoter: true } } },
        })
        const generatedByPromoter = new Map<number, number>()
        for (const pt of paymentTasks) {
            const idPromoter = pt.task.id_promoter
            if (!idPromoter) continue
            generatedByPromoter.set(idPromoter, (generatedByPromoter.get(idPromoter) ?? 0) + Number(pt.f_amount))
        }

        const driverTasks = await prisma.driver_activator_payment_tasks.findMany({
            where: {
                id_promoter: { in: inviteeIds },
                payment: { id_driver, id_status: { not: ACTIVATOR_PAYMENT_STATUS.CANCELADO } },
            },
            select: { f_amount: true, id_promoter: true },
        })
        const earnedFromInvitee = new Map<number, number>()
        for (const dt of driverTasks) {
            earnedFromInvitee.set(dt.id_promoter, (earnedFromInvitee.get(dt.id_promoter) ?? 0) + Number(dt.f_amount))
        }
        const pendingMap = await this.pendingByPromoter(id_driver)

        return invitees.map(p => ({
            id: p.id,
            name: `${p.name}${p.lastname ? ' ' + p.lastname : ''}`,
            isActive: p.isActive,
            dt_register: p.dt_register,
            generated: generatedByPromoter.get(p.id) ?? 0,
            earnedForMe: Math.round(((earnedFromInvitee.get(p.id) ?? 0) + (pendingMap.get(p.id) ?? 0)) * 100) / 100,
        }))
    }
}

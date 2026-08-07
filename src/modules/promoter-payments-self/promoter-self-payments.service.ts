import { prisma } from '../../core/prisma'
import { PROMOTER_PAYMENT_STATUS } from '../finances/finances.constants'

export class PromoterSelfPayments {

    async getHistory(id_promoter: number) {
        const payments = await prisma.promoter_payments.findMany({
            where: { id_promoter, id_status: PROMOTER_PAYMENT_STATUS.PAGADO },
            orderBy: { dt_payment: 'desc' }
        })
        return payments.map(p => ({
            id: p.id_payment,
            amount: Number(p.f_total),
            source: 'Pago de comisión',
            status: 'pagado',
            date: p.dt_payment,
            description: p.vc_folio,
        }))
    }

    async getPending(id_promoter: number) {
        const payments = await prisma.promoter_payments.findMany({
            where: { id_promoter, id_status: PROMOTER_PAYMENT_STATUS.POR_PAGAR },
            orderBy: { dt_register: 'desc' }
        })
        return payments.map(p => ({
            id: p.id_payment,
            amount: Number(p.f_total),
            source: 'Pago de comisión',
            status: 'por_pagar',
            date: p.dt_register,
            description: p.vc_folio,
        }))
    }

    async getAffiliation(id_promoter: number) {
        const promoter = await prisma.promoters.findUnique({
            where: { id: id_promoter },
            select: { vc_referral_code: true }
        })

        // Ganancia total como activador (lo que ha ganado por promotores que él invitó),
        // sin importar si ya se le pagó o sigue pendiente.
        const agg = await prisma.activator_payments.aggregate({
            where: { id_activator: id_promoter },
            _sum: { f_total: true }
        })

        return {
            code: promoter?.vc_referral_code ?? null,
            earnings: Number(agg._sum.f_total ?? 0),
        }
    }
}

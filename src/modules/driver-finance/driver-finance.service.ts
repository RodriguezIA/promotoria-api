import { prisma } from '../../core/prisma'
import { EncryptionService } from '../../services/encryption.service'
import { ACTIVATOR_PAYMENT_STATUS } from '../finances/finances.constants'

export interface SaveDriverBankAccountInput {
    account_holder_name: string
    account_type: 'CLABE' | 'CARD'
    bank_name: string
    number: string
}

export class DriverFinance {

    /** Cortes (pagos de comisión) del chofer, con el desglose por invitado. */
    async getPayments(id_driver: number) {
        const payments = await prisma.driver_activator_payments.findMany({
            where: { id_driver, id_status: { not: ACTIVATOR_PAYMENT_STATUS.CANCELADO } },
            orderBy: { dt_register: 'desc' },
            include: { payment_tasks: true },
        })

        const promoterIds = [...new Set(payments.flatMap(p => p.payment_tasks.map(t => t.id_promoter)))]
        const promoters = promoterIds.length
            ? await prisma.promoters.findMany({ where: { id: { in: promoterIds } }, select: { id: true, name: true, lastname: true } })
            : []
        const nameMap = new Map(promoters.map(p => [p.id, `${p.name}${p.lastname ? ' ' + p.lastname : ''}`]))

        return payments.map(p => {
            const byPromoter = new Map<number, { id: number, name: string, tasks: number, amount: number }>()
            for (const t of p.payment_tasks) {
                const cur = byPromoter.get(t.id_promoter) ?? { id: t.id_promoter, name: nameMap.get(t.id_promoter) ?? `Promotor #${t.id_promoter}`, tasks: 0, amount: 0 }
                cur.tasks += 1
                cur.amount += Number(t.f_amount)
                byPromoter.set(t.id_promoter, cur)
            }
            return {
                id: p.id_payment,
                folio: p.vc_folio,
                dt_start: p.dt_start,
                dt_end: p.dt_end,
                total: Number(p.f_total),
                status: p.id_status === ACTIVATOR_PAYMENT_STATUS.PAGADO ? 'pagado' : 'por_pagar',
                dt_payment: p.dt_payment,
                notes: p.vc_notes,
                invitees: [...byPromoter.values()].map(i => ({ ...i, amount: Math.round(i.amount * 100) / 100 })),
            }
        })
    }

    private mask(acc: any) {
        return {
            id: acc.id,
            account_holder_name: acc.account_holder_name,
            account_type: acc.account_type,
            bank_name: acc.bank_name,
            clabe: acc.clabe ? EncryptionService.decryptToMasked(acc.clabe) : null,
            card_number: acc.card_number ? EncryptionService.decryptToMasked(acc.card_number) : null,
        }
    }

    async getBankAccount(id_driver: number) {
        const acc = await prisma.driver_bank_accounts.findFirst({
            where: { id_driver, dt_deleted: null },
            orderBy: { dt_register: 'desc' },
        })
        return acc ? this.mask(acc) : null
    }

    /** Un chofer tiene una sola cuenta activa: si ya existe se actualiza, si no se crea. */
    async saveBankAccount(id_driver: number, input: SaveDriverBankAccountInput) {
        const data = {
            account_holder_name: input.account_holder_name,
            account_type: input.account_type,
            bank_name: input.bank_name,
            clabe: input.account_type === 'CLABE' ? EncryptionService.encrypt(input.number) : null,
            card_number: input.account_type === 'CARD' ? EncryptionService.encrypt(input.number) : null,
        }
        const current = await prisma.driver_bank_accounts.findFirst({
            where: { id_driver, dt_deleted: null },
            orderBy: { dt_register: 'desc' },
        })
        const saved = current
            ? await prisma.driver_bank_accounts.update({ where: { id: current.id }, data: { ...data, dt_updated: new Date() } })
            : await prisma.driver_bank_accounts.create({ data: { id_driver, ...data } })
        return this.mask(saved)
    }

    /** Solo para master, auditado desde el controller de finanzas. */
    async revealBankAccount(id: number) {
        const acc = await prisma.driver_bank_accounts.findFirst({ where: { id, dt_deleted: null } })
        if (!acc) return null
        return {
            id: acc.id,
            id_driver: acc.id_driver,
            clabe: EncryptionService.decrypt(acc.clabe),
            card_number: EncryptionService.decrypt(acc.card_number),
        }
    }
}

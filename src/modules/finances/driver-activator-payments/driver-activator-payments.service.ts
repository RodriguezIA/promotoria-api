import { prisma } from '../../../core/prisma'
import { effectiveStart } from '../finance-dates'
import { EncryptionService } from '../../../services/encryption.service'
import { generateFolio } from '../../../services/folio.service'
import { ACTIVATOR_PAYMENT_STATUS } from '../finances.constants'
import { findEligibleDriverTasks, getFinanceSettings, DriverEligibleTask } from './driver-commission'

export interface GenerateDriverPaymentsInput {
  dt_start: Date
  dt_end: Date
  id_driver?: number
  id_user_creator: number
}

export interface DriverPaymentFilters {
  id_driver?: number
  id_status?: number
  vc_folio?: string
  page?: number
  limit?: number
}

export class DriverActivatorPayments {

    private async loadPcts() {
        const settings = await getFinanceSettings()
        const promoterPct = Number(settings.f_promoter_commission_percentage)
        const activatorPct = Number(settings.f_activator_commission_percentage)
        if (activatorPct <= 0) {
            throw new Error('Configura el porcentaje de comisión del activador en finances/settings antes de generar pagos')
        }
        return { settings, promoterPct, activatorPct }
    }

    private groupByDriver(tasks: DriverEligibleTask[]) {
        const byDriver = new Map<number, DriverEligibleTask[]>()
        for (const t of tasks) {
            if (!byDriver.has(t.id_driver)) byDriver.set(t.id_driver, [])
            byDriver.get(t.id_driver)!.push(t)
        }
        return byDriver
    }

    async preview(input: GenerateDriverPaymentsInput) {
        const { promoterPct, activatorPct } = await this.loadPcts()
        const tasks = await findEligibleDriverTasks(
            { dt_start: input.dt_start, dt_end: input.dt_end, id_driver: input.id_driver }, promoterPct, activatorPct)
        const byDriver = this.groupByDriver(tasks)

        const ids = [...byDriver.keys()]
        const drivers = ids.length
            ? await prisma.drivers.findMany({ where: { id_driver: { in: ids } }, select: { id_driver: true, name: true } })
            : []
        const nameMap = new Map(drivers.map(d => [d.id_driver, d.name]))

        const result = [] as Array<{ id_driver: number, name: string, f_total: number, tasks: Array<{ id_task: number, id_promoter: number, f_amount: number }> }>
        for (const [id_driver, driverTasks] of byDriver) {
            result.push({
                id_driver,
                name: nameMap.get(id_driver) ?? `Chofer #${id_driver}`,
                f_total: Math.round(driverTasks.reduce((s, t) => s + t.f_amount, 0) * 100) / 100,
                tasks: driverTasks.map(t => ({ id_task: t.id_task, id_promoter: t.id_promoter, f_amount: t.f_amount })),
            })
        }
        return { drivers: result }
    }

    async generate(input: GenerateDriverPaymentsInput) {
        const { settings, promoterPct, activatorPct } = await this.loadPcts()
        const tasks = await findEligibleDriverTasks(
            { dt_start: input.dt_start, dt_end: input.dt_end, id_driver: input.id_driver }, promoterPct, activatorPct)
        const byDriver = this.groupByDriver(tasks)

        const created = [] as Awaited<ReturnType<typeof prisma.driver_activator_payments.create>>[]
        for (const [id_driver, driverTasks] of byDriver) {
            const payment = await prisma.$transaction(async (tx) => {
                const f_total = Math.round(driverTasks.reduce((s, t) => s + t.f_amount, 0) * 100) / 100
                const vc_folio = await generateFolio(tx, settings.id_system_client, 'driver_activator_payment')

                const p = await tx.driver_activator_payments.create({
                    data: {
                        id_driver,
                        vc_folio,
                        dt_start: await effectiveStart(tx, driverTasks.map(t => t.id_task), input.dt_start),
                        dt_end: input.dt_end,
                        f_total,
                        id_status: ACTIVATOR_PAYMENT_STATUS.POR_PAGAR,
                        id_user_creator: input.id_user_creator,
                    },
                })

                for (const t of driverTasks) {
                    await tx.driver_activator_payment_tasks.create({
                        data: { id_payment: p.id_payment, id_task: t.id_task, id_promoter: t.id_promoter, f_amount: t.f_amount },
                    })
                }

                const taskIds = driverTasks.map(t => t.id_task)
                const upd = await tx.tasks.updateMany({
                    where: { id_task: { in: taskIds }, id_driver_activator_payment: null },
                    data: { id_driver_activator_payment: p.id_payment },
                })
                if (upd.count !== taskIds.length) {
                    throw new Error('Una o más tareas ya fueron tomadas por otro pago, intenta de nuevo')
                }

                await tx.driver_activator_payment_logs.create({
                    data: {
                        id_payment: p.id_payment,
                        id_user: input.id_user_creator,
                        vc_log: `Pago de comisión a chofer generado con ${taskIds.length} tarea(s) por $${f_total.toFixed(2)}`,
                    },
                })
                return p
            })
            created.push(payment)
        }
        return created
    }

    /** Lo que se le debe hoy a cada chofer y todavia no entra en ningun corte. */
    async pending() {
        const { promoterPct, activatorPct } = await this.loadPcts()
        const tasks = await findEligibleDriverTasks({}, promoterPct, activatorPct)
        const byDriver = this.groupByDriver(tasks)

        const ids = [...byDriver.keys()]
        const drivers = ids.length
            ? await prisma.drivers.findMany({ where: { id_driver: { in: ids } }, select: { id_driver: true, name: true, phone: true } })
            : []
        const accounts = ids.length
            ? await prisma.driver_bank_accounts.findMany({ where: { id_driver: { in: ids }, dt_deleted: null }, select: { id_driver: true } })
            : []
        const withAccount = new Set(accounts.map(a => a.id_driver))
        const info = new Map(drivers.map(d => [d.id_driver, d]))

        const rows = ids.map(id => {
            const list = byDriver.get(id)!
            return {
                id_driver: id,
                name: info.get(id)?.name ?? `Chofer #${id}`,
                phone: info.get(id)?.phone ?? null,
                tasks: list.length,
                f_total: Math.round(list.reduce((s, t) => s + t.f_amount, 0) * 100) / 100,
                has_account: withAccount.has(id),
            }
        })
        const total = Math.round(rows.reduce((s, r) => s + r.f_total, 0) * 100) / 100
        return { total, drivers: rows }
    }

    async list(filters: DriverPaymentFilters) {
        const page = filters.page ?? 1
        const limit = filters.limit ?? 20
        const skip = (page - 1) * limit

        const where: any = {}
        if (filters.id_driver !== undefined) where.id_driver = filters.id_driver
        if (filters.id_status !== undefined) where.id_status = filters.id_status
        if (filters.vc_folio) where.vc_folio = { contains: filters.vc_folio }

        const [rows, total] = await Promise.all([
            prisma.driver_activator_payments.findMany({ where, skip, take: limit, orderBy: { dt_register: 'desc' } }),
            prisma.driver_activator_payments.count({ where }),
        ])

        const ids = [...new Set(rows.map(r => r.id_driver))]
        const drivers = ids.length
            ? await prisma.drivers.findMany({ where: { id_driver: { in: ids } }, select: { id_driver: true, name: true } })
            : []
        const nameMap = new Map(drivers.map(d => [d.id_driver, d.name]))
        const data = rows.map(r => ({ ...r, driver_name: nameMap.get(r.id_driver) ?? null }))

        return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } }
    }

    async getById(id_payment: number) {
        const payment = await prisma.driver_activator_payments.findUnique({
            where: { id_payment },
            include: { payment_tasks: true },
        })
        if (!payment) return null

        const [driver, evidences, logs] = await Promise.all([
            prisma.drivers.findUnique({
                where: { id_driver: payment.id_driver },
                select: { id_driver: true, name: true, phone: true, email: true },
            }),
            prisma.assets.findMany({ where: { entity_type: 'driver_activator_payment', entity_id: id_payment, is_active: true } }),
            prisma.driver_activator_payment_logs.findMany({ where: { id_payment }, orderBy: { dt_register: 'desc' } }),
        ])

        const promoterIds = [...new Set(payment.payment_tasks.map(t => t.id_promoter))]
        const promoters = promoterIds.length
            ? await prisma.promoters.findMany({ where: { id: { in: promoterIds } }, select: { id: true, name: true, lastname: true } })
            : []
        const promoterMap = new Map(promoters.map(p => [p.id, `${p.name}${p.lastname ? ' ' + p.lastname : ''}`]))
        const payment_tasks = payment.payment_tasks.map(t => ({ ...t, promoter_name: promoterMap.get(t.id_promoter) ?? null }))

        const acc = await prisma.driver_bank_accounts.findFirst({
            where: { id_driver: payment.id_driver, dt_deleted: null },
            orderBy: { dt_register: 'desc' },
        })
        const bank_account = acc ? {
            id: acc.id,
            account_holder_name: acc.account_holder_name,
            account_type: acc.account_type,
            bank_name: acc.bank_name,
            clabe: acc.clabe ? EncryptionService.decryptToMasked(acc.clabe) : null,
            card_number: acc.card_number ? EncryptionService.decryptToMasked(acc.card_number) : null,
        } : null

        return { ...payment, payment_tasks, driver, bank_account, evidences, logs }
    }

    async submitPayment(id_payment: number, data: { dt_payment: Date, vc_notes?: string }, id_user: number) {
        return await prisma.$transaction(async (tx) => {
            const payment = await tx.driver_activator_payments.findUnique({ where: { id_payment } })
            if (!payment) throw new Error('Pago no encontrado')
            if (payment.id_status !== ACTIVATOR_PAYMENT_STATUS.POR_PAGAR) {
                throw new Error('El pago no está en un estatus que permita registrarlo')
            }
            const updated = await tx.driver_activator_payments.update({
                where: { id_payment },
                data: {
                    dt_payment: data.dt_payment,
                    vc_notes: data.vc_notes,
                    id_status: ACTIVATOR_PAYMENT_STATUS.PAGADO,
                    id_user_payer: id_user,
                },
            })
            await tx.driver_activator_payment_logs.create({
                data: { id_payment, id_user, vc_log: 'Pago registrado por el super usuario' },
            })
            return updated
        })
    }

    async cancel(id_payment: number, id_user: number) {
        return await prisma.$transaction(async (tx) => {
            const payment = await tx.driver_activator_payments.findUnique({ where: { id_payment } })
            if (!payment) throw new Error('Pago no encontrado')
            if (payment.id_status !== ACTIVATOR_PAYMENT_STATUS.POR_PAGAR) {
                throw new Error('Solo se puede cancelar un pago por pagar')
            }
            const updated = await tx.driver_activator_payments.update({
                where: { id_payment },
                data: { id_status: ACTIVATOR_PAYMENT_STATUS.CANCELADO },
            })
            await tx.tasks.updateMany({ where: { id_driver_activator_payment: id_payment }, data: { id_driver_activator_payment: null } })
            await tx.driver_activator_payment_logs.create({
                data: { id_payment, id_user, vc_log: 'Pago cancelado, tareas liberadas' },
            })
            return updated
        })
    }
}

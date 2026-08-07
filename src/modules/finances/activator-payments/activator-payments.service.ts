import { prisma } from '../../../core/prisma'
import { generateFolio } from '../../../services/folio.service'
import { ACTIVATOR_PAYMENT_STATUS } from '../finances.constants'
import {
    GenerateActivatorPaymentsDTO,
    ActivatorPaymentFiltersDTO,
    UpdateActivatorPaymentPaymentDTO,
    UpdateActivatorPaymentStatusDTO,
} from './activator-payments.dto'

interface EligibleTask {
  id_task: number
  id_promoter: number
  id_activator: number
  f_amount: number
}

export class ActivatorPayments {

    private async getSettings() {
        const settings = await prisma.finance_settings.findUnique({ where: { id_setting: 1 } })
        if (!settings) throw new Error('finance_settings no está inicializado')
        return settings
    }

    /**
     * Comisión del activador = % del activador sobre lo que YA gana el
     * promotor (no sobre el valor completo de la tarea). Ej: tarea vale $100,
     * comisión de promotor 70% = $70, comisión de activador 10% sobre esos
     * $70 = $7.
     */
    private async findEligibleTasks(
        dt_start: Date,
        dt_end: Date,
        promoterPct: number,
        activatorPct: number,
        id_activator?: number
    ): Promise<EligibleTask[]> {
        const tasks = await prisma.tasks.findMany({
            where: {
                // Estatus real "Terminada con éxito" (ver fuente de verdad en
                // webs/promotoria-saas/.../tareas/utils.ts): es el 7, no el 6.
                id_status: 7,
                id_activator_payment: null,
                id_promoter: { not: null },
                id_request: { not: null },
                dt_update: { gte: dt_start, lte: dt_end },
                promoter: {
                    id_activator: id_activator !== undefined ? id_activator : { not: null }
                },
            },
            select: {
                id_task: true, id_order: true, id_request: true, id_store: true,
                promoter: { select: { id: true, id_activator: true } }
            }
        })
        if (tasks.length === 0) return []

        const orderIds = [...new Set(tasks.map(t => t.id_order))]
        const orderItems = await prisma.order_items.findMany({
            where: { id_order: { in: orderIds } },
            select: { id_order: true, id_request: true, id_store: true, f_value: true }
        })
        const valueMap = new Map<string, number>()
        for (const oi of orderItems) {
            valueMap.set(`${oi.id_order}:${oi.id_request}:${oi.id_store}`, Number(oi.f_value))
        }

        const eligible: EligibleTask[] = []
        for (const t of tasks) {
            if (!t.promoter?.id_activator) continue
            const key = `${t.id_order}:${t.id_request}:${t.id_store}`
            const baseValue = valueMap.get(key)
            if (baseValue === undefined) {
                console.warn(`No se encontró order_item para la tarea ${t.id_task} (${key}), se excluye del pago`)
                continue
            }
            const promoterEarning = baseValue * (promoterPct / 100)
            const f_amount = Math.round(promoterEarning * (activatorPct / 100) * 100) / 100
            eligible.push({
                id_task: t.id_task,
                id_promoter: t.promoter.id,
                id_activator: t.promoter.id_activator,
                f_amount,
            })
        }
        return eligible
    }

    private groupByActivator(tasks: EligibleTask[]) {
        const byActivator = new Map<number, EligibleTask[]>()
        for (const t of tasks) {
            if (!byActivator.has(t.id_activator)) byActivator.set(t.id_activator, [])
            byActivator.get(t.id_activator)!.push(t)
        }
        return byActivator
    }

    async preview(input: GenerateActivatorPaymentsDTO) {
        const settings = await this.getSettings()
        const promoterPct = Number(settings.f_promoter_commission_percentage)
        const activatorPct = Number(settings.f_activator_commission_percentage)
        if (activatorPct <= 0) {
            throw new Error('Configura el porcentaje de comisión del activador en finances/settings antes de generar pagos')
        }
        const tasks = await this.findEligibleTasks(input.dt_start, input.dt_end, promoterPct, activatorPct, input.id_activator)
        const byActivator = this.groupByActivator(tasks)

        const activators = [] as Array<{ id_activator: number, f_total: number, tasks: Array<{ id_task: number, id_promoter: number, f_amount: number }> }>
        for (const [id_activator, activatorTasks] of byActivator) {
            const f_total = activatorTasks.reduce((sum, t) => sum + t.f_amount, 0)
            activators.push({
                id_activator,
                f_total,
                tasks: activatorTasks.map(t => ({ id_task: t.id_task, id_promoter: t.id_promoter, f_amount: t.f_amount }))
            })
        }
        return { activators }
    }

    async generate(input: GenerateActivatorPaymentsDTO) {
        const settings = await this.getSettings()
        const promoterPct = Number(settings.f_promoter_commission_percentage)
        const activatorPct = Number(settings.f_activator_commission_percentage)
        if (activatorPct <= 0) {
            throw new Error('Configura el porcentaje de comisión del activador en finances/settings antes de generar pagos')
        }
        const tasks = await this.findEligibleTasks(input.dt_start, input.dt_end, promoterPct, activatorPct, input.id_activator)
        const byActivator = this.groupByActivator(tasks)

        const createdPayments: Awaited<ReturnType<typeof prisma.activator_payments.create>>[] = []
        for (const [id_activator, activatorTasks] of byActivator) {
            const payment = await prisma.$transaction(async (tx) => {
                const f_total = activatorTasks.reduce((sum, t) => sum + t.f_amount, 0)
                const vc_folio = await generateFolio(tx, settings.id_system_client, 'activator_payment')

                const payment = await tx.activator_payments.create({
                    data: {
                        id_activator,
                        vc_folio,
                        dt_start: input.dt_start,
                        dt_end: input.dt_end,
                        f_total,
                        id_status: ACTIVATOR_PAYMENT_STATUS.POR_PAGAR,
                        id_user_creator: input.id_user_creator,
                    }
                })

                for (const t of activatorTasks) {
                    await tx.activator_payment_tasks.create({
                        data: {
                            id_payment: payment.id_payment,
                            id_task: t.id_task,
                            id_promoter: t.id_promoter,
                            f_amount: t.f_amount,
                        }
                    })
                }

                const taskIds = activatorTasks.map(t => t.id_task)
                const updateResult = await tx.tasks.updateMany({
                    where: { id_task: { in: taskIds }, id_activator_payment: null },
                    data: { id_activator_payment: payment.id_payment }
                })
                if (updateResult.count !== taskIds.length) {
                    throw new Error('Una o más tareas ya fueron tomadas por otro pago, intenta de nuevo')
                }

                await tx.activator_payment_logs.create({
                    data: {
                        id_payment: payment.id_payment,
                        id_user: input.id_user_creator,
                        vc_log: `Pago de comisión generado con ${taskIds.length} tarea(s) por $${f_total.toFixed(2)}`,
                    }
                })

                return payment
            })
            createdPayments.push(payment)
        }
        return createdPayments
    }

    async list(filters: ActivatorPaymentFiltersDTO) {
        const page = filters.page ?? 1
        const limit = filters.limit ?? 20
        const skip = (page - 1) * limit

        const where: any = {}
        if (filters.id_activator !== undefined) where.id_activator = filters.id_activator
        if (filters.id_status !== undefined) where.id_status = filters.id_status
        if (filters.vc_folio) where.vc_folio = { contains: filters.vc_folio }
        if (filters.dt_start || filters.dt_end) {
            where.dt_start = {}
            if (filters.dt_start) where.dt_start.gte = filters.dt_start
            if (filters.dt_end) where.dt_start.lte = filters.dt_end
        }

        const [data, total] = await Promise.all([
            prisma.activator_payments.findMany({ where, skip, take: limit, orderBy: { dt_register: 'desc' } }),
            prisma.activator_payments.count({ where })
        ])

        return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } }
    }

    async getRaw(id_payment: number) {
        return await prisma.activator_payments.findUnique({ where: { id_payment } })
    }

    async getById(id_payment: number) {
        const payment = await prisma.activator_payments.findUnique({
            where: { id_payment },
            include: {
                payment_tasks: { include: { task: { include: { store: true, request: true, order: true } } } },
                activator: {
                    select: {
                        id: true, name: true, lastname: true, email: true, phone: true,
                        promoter_bank_accounts: { where: { dt_deleted: null } }
                    }
                }
            }
        })
        if (!payment) return null

        const [evidences, logs] = await Promise.all([
            prisma.assets.findMany({ where: { entity_type: 'promoter_payment', entity_id: id_payment, is_active: true } }),
            prisma.activator_payment_logs.findMany({ where: { id_payment }, orderBy: { dt_register: 'desc' } })
        ])

        return { ...payment, evidences, logs }
    }

    async submitPayment(id_payment: number, data: UpdateActivatorPaymentPaymentDTO, id_user: number) {
        return await prisma.$transaction(async (tx) => {
            const payment = await tx.activator_payments.findUnique({ where: { id_payment } })
            if (!payment) throw new Error('Pago no encontrado')
            if (payment.id_status !== ACTIVATOR_PAYMENT_STATUS.POR_PAGAR) {
                throw new Error('El pago no está en un estatus que permita registrarlo')
            }

            if (data.id_bank_account) {
                const bankAccount = await tx.promoter_bank_accounts.findFirst({
                    where: { id: data.id_bank_account, id_promoter: payment.id_activator, dt_deleted: null }
                })
                if (!bankAccount) throw new Error('La cuenta bancaria no existe o no pertenece a este activador')
            }

            const updated = await tx.activator_payments.update({
                where: { id_payment },
                data: {
                    dt_payment: data.dt_payment,
                    id_bank_account: data.id_bank_account,
                    vc_notes: data.vc_notes,
                    id_status: ACTIVATOR_PAYMENT_STATUS.PAGADO,
                    id_user_payer: id_user,
                }
            })

            await tx.activator_payment_logs.create({
                data: { id_payment, id_user, vc_log: 'Pago registrado por el super usuario' }
            })

            return updated
        })
    }

    async updateStatus(id_payment: number, data: UpdateActivatorPaymentStatusDTO, id_user: number) {
        return await prisma.$transaction(async (tx) => {
            const payment = await tx.activator_payments.findUnique({ where: { id_payment } })
            if (!payment) throw new Error('Pago no encontrado')

            if (payment.id_status !== ACTIVATOR_PAYMENT_STATUS.POR_PAGAR) {
                throw new Error('Solo se puede cancelar un pago por pagar')
            }
            const updated = await tx.activator_payments.update({
                where: { id_payment },
                data: { id_status: ACTIVATOR_PAYMENT_STATUS.CANCELADO }
            })
            await tx.tasks.updateMany({ where: { id_activator_payment: id_payment }, data: { id_activator_payment: null } })
            await tx.activator_payment_logs.create({ data: { id_payment, id_user, vc_log: 'Pago cancelado, tareas liberadas' } })
            return updated
        })
    }
}

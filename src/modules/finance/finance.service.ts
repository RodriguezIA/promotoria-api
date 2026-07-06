import { prisma } from '../../core/prisma'
import { generateFolio } from '../../services/folio.service'
import { StorageService } from '../../services/storage.service'
import {
    INVOICE_STATUS,
    INVOICE_STATUS_LABEL,
    PAYMENT_REVIEW_STATUS,
    PROMOTER_PAYMENT_STATUS,
    PROMOTER_PAYMENT_STATUS_LABEL,
    TASK_STATUS_COMPLETED,
    FINANCE_DEFAULTS,
} from './finance.constants'
import {
    GeneratePeriodDTO,
    InvoiceFiltersDTO,
    SubmitClientPaymentDTO,
    ReviewInvoicePaymentDTO,
    RegisterPromoterPaymentDTO,
    GlobalConfigDTO,
    ClientConfigDTO,
} from './finance.dtos'

// ---------- Helpers de fecha ----------
const startOfDay = (d: Date) => {
    const x = new Date(d)
    x.setHours(0, 0, 0, 0)
    return x
}
const addDays = (d: Date, n: number) => {
    const x = new Date(d)
    x.setDate(x.getDate() + n)
    return x
}

// ---------- Helpers de precio ----------
type PriceMaps = {
    exact: Map<string, number> // id_order|id_store|id_request
    byStore: Map<string, number> // id_order|id_store
}

function priceForTask(maps: PriceMaps, t: { id_order: number; id_store: number; id_request: number | null }): number {
    const exact = maps.exact.get(`${t.id_order}|${t.id_store}|${t.id_request}`)
    if (exact !== undefined) return exact
    const byStore = maps.byStore.get(`${t.id_order}|${t.id_store}`)
    return byStore ?? 0
}

export class Finance {

    // ============================================================
    //  CONFIGURACIÓN (global + override por cliente)
    // ============================================================

    /** Obtiene (o crea con defaults) la fila única de configuración global. */
    async getOrCreateSettings() {
        const existing = await prisma.finance_settings.findFirst()
        if (existing) return existing
        return prisma.finance_settings.create({
            data: {
                f_promoter_pct: FINANCE_DEFAULTS.PROMOTER_PCT,
                i_default_period_days: FINANCE_DEFAULTS.PERIOD_DAYS,
                i_default_billing_weekday: FINANCE_DEFAULTS.BILLING_WEEKDAY,
                i_default_payment_due_days: FINANCE_DEFAULTS.PAYMENT_DUE_DAYS,
            },
        })
    }

    /** Config efectiva de un cliente: usa su override si existe, si no la global. El % siempre es global. */
    async resolveConfig(id_client: number) {
        const settings = await this.getOrCreateSettings()
        const override = await prisma.client_billing_config.findUnique({ where: { id_client } })
        return {
            period_days: override?.b_active ? override.i_period_days : settings.i_default_period_days,
            billing_weekday: override?.b_active ? override.i_billing_weekday : settings.i_default_billing_weekday,
            payment_due_days: override?.b_active ? override.i_payment_due_days : settings.i_default_payment_due_days,
            promoter_pct: Number(settings.f_promoter_pct),
        }
    }

    async getConfig() {
        const settings = await this.getOrCreateSettings()
        const overrides = await prisma.client_billing_config.findMany({ orderBy: { id_client: 'asc' } })
        const clients = await this.clientNameMap(overrides.map(o => o.id_client))
        return {
            global: settings,
            clients: overrides.map(o => ({ ...o, client_name: clients.get(o.id_client) ?? `Cliente #${o.id_client}` })),
        }
    }

    async upsertGlobalConfig(data: GlobalConfigDTO) {
        const settings = await this.getOrCreateSettings()
        return prisma.finance_settings.update({
            where: { id_finance_settings: settings.id_finance_settings },
            data: {
                ...(data.f_promoter_pct !== undefined && { f_promoter_pct: data.f_promoter_pct }),
                ...(data.i_default_period_days !== undefined && { i_default_period_days: data.i_default_period_days }),
                ...(data.i_default_billing_weekday !== undefined && { i_default_billing_weekday: data.i_default_billing_weekday }),
                ...(data.i_default_payment_due_days !== undefined && { i_default_payment_due_days: data.i_default_payment_due_days }),
            },
        })
    }

    async upsertClientConfig(id_client: number, data: ClientConfigDTO) {
        return prisma.client_billing_config.upsert({
            where: { id_client },
            create: {
                id_client,
                i_period_days: data.i_period_days ?? FINANCE_DEFAULTS.PERIOD_DAYS,
                i_billing_weekday: data.i_billing_weekday ?? FINANCE_DEFAULTS.BILLING_WEEKDAY,
                i_payment_due_days: data.i_payment_due_days ?? FINANCE_DEFAULTS.PAYMENT_DUE_DAYS,
                b_active: data.b_active ?? true,
            },
            update: {
                ...(data.i_period_days !== undefined && { i_period_days: data.i_period_days }),
                ...(data.i_billing_weekday !== undefined && { i_billing_weekday: data.i_billing_weekday }),
                ...(data.i_payment_due_days !== undefined && { i_payment_due_days: data.i_payment_due_days }),
                ...(data.b_active !== undefined && { b_active: data.b_active }),
            },
        })
    }

    // ============================================================
    //  GENERACIÓN DE COBROS (facturas semanales por cliente)
    // ============================================================

    /**
     * Genera una factura por cada cliente que tenga tareas completadas sin facturar.
     * Agrupa por pedido/campaña. Marca las tareas con id_invoice para no recobrarlas.
     */
    async generateBillingForPeriod(options: GeneratePeriodDTO = {}) {
        const whereClients: any = { id_status: TASK_STATUS_COMPLETED, id_invoice: null }
        if (options.id_client) whereClients.id_client = options.id_client

        const clientRows = await prisma.tasks.findMany({
            where: whereClients,
            distinct: ['id_client'],
            select: { id_client: true },
        })

        const created: any[] = []
        for (const { id_client } of clientRows) {
            const invoice = await this.generateInvoiceForClient(id_client, options)
            if (invoice) created.push(invoice)
        }
        return created
    }

    private async generateInvoiceForClient(id_client: number, options: GeneratePeriodDTO) {
        const cfg = await this.resolveConfig(id_client)
        const today = startOfDay(new Date())
        const periodEnd = options.dt_period_end ? startOfDay(new Date(options.dt_period_end)) : today
        const periodStart = options.dt_period_start
            ? startOfDay(new Date(options.dt_period_start))
            : addDays(periodEnd, -cfg.period_days)
        const due = addDays(periodEnd, cfg.payment_due_days)

        return prisma.$transaction(async (tx) => {
            const tasks = await tx.tasks.findMany({
                where: { id_client, id_status: TASK_STATUS_COMPLETED, id_invoice: null },
                select: { id_task: true, id_order: true, id_store: true, id_request: true },
            })
            if (tasks.length === 0) return null

            const maps = await this.buildPriceMaps(tx, [...new Set(tasks.map(t => t.id_order))])

            // Agrupar por (id_order, id_request)
            const groups = new Map<string, { id_order: number; id_request: number | null; count: number; subtotal: number }>()
            let f_total = 0
            for (const t of tasks) {
                const price = priceForTask(maps, t)
                f_total += price
                const key = `${t.id_order}|${t.id_request}`
                const g = groups.get(key) ?? { id_order: t.id_order, id_request: t.id_request, count: 0, subtotal: 0 }
                g.count += 1
                g.subtotal += price
                groups.set(key, g)
            }

            const vc_folio = await generateFolio(tx, id_client, 'invoices')

            const invoice = await tx.client_invoices.create({
                data: {
                    id_client,
                    vc_folio,
                    dt_period_start: periodStart,
                    dt_period_end: periodEnd,
                    dt_due: due,
                    f_total,
                    i_status: INVOICE_STATUS.PENDIENTE,
                },
            })

            for (const g of groups.values()) {
                await tx.invoice_items.create({
                    data: {
                        id_invoice: invoice.id_invoice,
                        id_order: g.id_order,
                        id_request: g.id_request,
                        i_completed_tasks: g.count,
                        f_subtotal: g.subtotal,
                    },
                })
            }

            await tx.tasks.updateMany({
                where: { id_task: { in: tasks.map(t => t.id_task) } },
                data: { id_invoice: invoice.id_invoice },
            })

            return invoice
        })
    }

    // ============================================================
    //  GENERACIÓN DE PAGOS A PROMOTORES
    // ============================================================

    async generatePromoterPaymentsForPeriod(options: GeneratePeriodDTO = {}) {
        const settings = await this.getOrCreateSettings()
        const pct = Number(settings.f_promoter_pct)

        const promoterRows = await prisma.tasks.findMany({
            where: { id_status: TASK_STATUS_COMPLETED, id_promoter_payment: null, id_promoter: { not: null } },
            distinct: ['id_promoter'],
            select: { id_promoter: true },
        })

        const today = startOfDay(new Date())
        const periodEnd = options.dt_period_end ? startOfDay(new Date(options.dt_period_end)) : today
        const periodStart = options.dt_period_start
            ? startOfDay(new Date(options.dt_period_start))
            : addDays(periodEnd, -settings.i_default_period_days)

        const created: any[] = []
        for (const { id_promoter } of promoterRows) {
            if (id_promoter == null) continue
            const payment = await this.generatePaymentForPromoter(id_promoter, pct, periodStart, periodEnd)
            if (payment) created.push(payment)
        }
        return created
    }

    private async generatePaymentForPromoter(id_promoter: number, pct: number, periodStart: Date, periodEnd: Date) {
        return prisma.$transaction(async (tx) => {
            const tasks = await tx.tasks.findMany({
                where: { id_promoter, id_status: TASK_STATUS_COMPLETED, id_promoter_payment: null },
                select: { id_task: true, id_order: true, id_store: true, id_request: true },
            })
            if (tasks.length === 0) return null

            const maps = await this.buildPriceMaps(tx, [...new Set(tasks.map(t => t.id_order))])

            const groups = new Map<string, { id_order: number; id_request: number | null; count: number; subtotal: number }>()
            let f_amount = 0
            for (const t of tasks) {
                const pay = priceForTask(maps, t) * (pct / 100)
                f_amount += pay
                const key = `${t.id_order}|${t.id_request}`
                const g = groups.get(key) ?? { id_order: t.id_order, id_request: t.id_request, count: 0, subtotal: 0 }
                g.count += 1
                g.subtotal += pay
                groups.set(key, g)
            }

            const payment = await tx.promoter_payments.create({
                data: {
                    id_promoter,
                    dt_period_start: periodStart,
                    dt_period_end: periodEnd,
                    i_completed_tasks: tasks.length,
                    f_amount,
                    i_status: PROMOTER_PAYMENT_STATUS.PENDIENTE,
                },
            })

            for (const g of groups.values()) {
                await tx.promoter_payment_items.create({
                    data: {
                        id_promoter_payment: payment.id_promoter_payment,
                        id_order: g.id_order,
                        id_request: g.id_request,
                        i_completed_tasks: g.count,
                        f_subtotal: g.subtotal,
                    },
                })
            }

            await tx.tasks.updateMany({
                where: { id_task: { in: tasks.map(t => t.id_task) } },
                data: { id_promoter_payment: payment.id_promoter_payment },
            })

            return payment
        })
    }

    /** Corre todo el ciclo (cobros + pagos + barrido de vencidos). Reutilizado por el job y el endpoint manual. */
    async runBillingCycle(options: GeneratePeriodDTO = {}) {
        const invoices = await this.generateBillingForPeriod(options)
        const promoterPayments = await this.generatePromoterPaymentsForPeriod(options)
        const overdue = await this.sweepOverdueInvoices()
        return { invoices_creadas: invoices.length, pagos_promotor_creados: promoterPayments.length, facturas_vencidas: overdue }
    }

    // ============================================================
    //  FLUJO DE PAGO DEL CLIENTE
    // ============================================================

    async submitClientPayment(
        id_invoice: number,
        data: SubmitClientPaymentDTO,
        file?: { buffer: Buffer; mimetype: string; originalname: string } | null,
    ) {
        const invoice = await prisma.client_invoices.findUnique({ where: { id_invoice } })
        if (!invoice) throw new Error('Factura no encontrada')
        if (invoice.i_status === INVOICE_STATUS.ACEPTADO) throw new Error('Esta factura ya fue pagada')

        const payment = await prisma.invoice_payments.create({
            data: {
                id_invoice,
                id_user: data.id_user,
                f_amount: data.f_amount,
                vc_method: data.vc_method,
                vc_reference: data.vc_reference ?? null,
                vc_notes: data.vc_notes ?? null,
                i_status: PAYMENT_REVIEW_STATUS.EN_REVISION,
            },
        })

        if (file) {
            const { url } = await StorageService.uploadAsset({
                entity: 'client_doc',
                entity_id: payment.id_invoice_payment,
                buffer: file.buffer,
                mime: file.mimetype,
                id_client: invoice.id_client,
                id_user: data.id_user,
                originalName: file.originalname,
                folio: invoice.vc_folio,
                optimize: false,
            })
            await prisma.invoice_payments.update({
                where: { id_invoice_payment: payment.id_invoice_payment },
                data: { vc_receipt_url: url },
            })
            payment.vc_receipt_url = url
        }

        await prisma.client_invoices.update({
            where: { id_invoice },
            data: { i_status: INVOICE_STATUS.EN_REVISION },
        })

        return payment
    }

    async reviewInvoicePayment(id_invoice_payment: number, data: ReviewInvoicePaymentDTO) {
        const payment = await prisma.invoice_payments.findUnique({ where: { id_invoice_payment } })
        if (!payment) throw new Error('Comprobante no encontrado')

        const aceptado = data.decision === 'aceptado'

        await prisma.invoice_payments.update({
            where: { id_invoice_payment },
            data: {
                i_status: aceptado ? PAYMENT_REVIEW_STATUS.ACEPTADO : PAYMENT_REVIEW_STATUS.RECHAZADO,
                vc_review_notes: data.vc_review_notes ?? null,
                id_reviewed_by: data.id_reviewed_by,
                dt_reviewed: new Date(),
            },
        })

        const invoice = await prisma.client_invoices.update({
            where: { id_invoice: payment.id_invoice },
            data: aceptado
                ? { i_status: INVOICE_STATUS.ACEPTADO, dt_paid: new Date() }
                : { i_status: INVOICE_STATUS.RECHAZADO },
        })

        return invoice
    }

    /** Marca como atrasadas las facturas vencidas que no están aceptadas ni en revisión. */
    async sweepOverdueInvoices() {
        const today = startOfDay(new Date())
        const res = await prisma.client_invoices.updateMany({
            where: {
                b_active: true,
                dt_due: { lt: today },
                i_status: { in: [INVOICE_STATUS.PENDIENTE, INVOICE_STATUS.RECHAZADO] },
            },
            data: { i_status: INVOICE_STATUS.ATRASADO },
        })
        return res.count
    }

    async markInvoiceLate(id_invoice: number) {
        return prisma.client_invoices.update({
            where: { id_invoice },
            data: { i_status: INVOICE_STATUS.ATRASADO },
        })
    }

    // ============================================================
    //  PAGO A PROMOTOR (registro por super admin)
    // ============================================================

    async registerPromoterPayment(id_promoter_payment: number, data: RegisterPromoterPaymentDTO) {
        return prisma.promoter_payments.update({
            where: { id_promoter_payment },
            data: {
                i_status: PROMOTER_PAYMENT_STATUS.PAGADO,
                vc_method: data.vc_method ?? null,
                vc_reference: data.vc_reference ?? null,
                vc_notes: data.vc_notes ?? null,
                dt_paid: new Date(),
                id_paid_by: data.id_paid_by,
            },
        })
    }

    // ============================================================
    //  GETTERS / LISTADOS (con nombres enriquecidos para el front)
    // ============================================================

    async getAllInvoices(filters: InvoiceFiltersDTO = {}) {
        const where: any = { b_active: true }
        if (filters.id_client) where.id_client = filters.id_client
        if (filters.i_status) where.i_status = filters.i_status

        const invoices = await prisma.client_invoices.findMany({
            where,
            include: { invoice_items: true },
            orderBy: { dt_register: 'desc' },
        })
        return this.enrichInvoices(invoices)
    }

    async getInvoicesByClient(id_client: number) {
        const invoices = await prisma.client_invoices.findMany({
            where: { id_client, b_active: true },
            include: { invoice_items: true },
            orderBy: { dt_register: 'desc' },
        })
        return this.enrichInvoices(invoices)
    }

    async getInvoiceDetail(id_invoice: number) {
        const invoice = await prisma.client_invoices.findUnique({
            where: { id_invoice },
            include: { invoice_items: true, invoice_payments: { orderBy: { dt_register: 'desc' } } },
        })
        if (!invoice) return null
        const [enriched] = await this.enrichInvoices([invoice])
        return {
            ...enriched,
            payments: invoice.invoice_payments.map(p => ({
                id_invoice_payment: p.id_invoice_payment,
                f_amount: Number(p.f_amount),
                vc_method: p.vc_method,
                vc_reference: p.vc_reference,
                vc_receipt_url: p.vc_receipt_url,
                vc_notes: p.vc_notes,
                vc_review_notes: p.vc_review_notes,
                i_status: p.i_status,
                dt_register: p.dt_register,
                dt_reviewed: p.dt_reviewed,
            })),
        }
    }

    async getPromoterPayments(filters: { id_promoter?: number; i_status?: number } = {}) {
        const where: any = { b_active: true }
        if (filters.id_promoter) where.id_promoter = filters.id_promoter
        if (filters.i_status) where.i_status = filters.i_status

        const payments = await prisma.promoter_payments.findMany({
            where,
            include: { promoter_payment_items: true },
            orderBy: { dt_register: 'desc' },
        })

        const promoters = await this.promoterNameMap(payments.map(p => p.id_promoter))
        const requests = await this.requestNameMap(
            payments.flatMap(p => p.promoter_payment_items.map(i => i.id_request).filter((x): x is number => x != null)),
        )

        return payments.map(p => ({
            id_pago: p.id_promoter_payment,
            id_promoter: p.id_promoter,
            promoter_name: promoters.get(p.id_promoter) ?? `Promotor #${p.id_promoter}`,
            dt_periodo_inicio: p.dt_period_start,
            dt_periodo_fin: p.dt_period_end,
            i_completed_tasks: p.i_completed_tasks,
            f_monto: Number(p.f_amount),
            status: PROMOTER_PAYMENT_STATUS_LABEL[p.i_status],
            dt_pago: p.dt_paid,
            vc_method: p.vc_method,
            vc_reference: p.vc_reference,
            items: p.promoter_payment_items.map(i => ({
                id_order: i.id_order,
                id_request: i.id_request,
                request_name: i.id_request ? requests.get(i.id_request) ?? `Campaña #${i.id_request}` : null,
                i_completed_tasks: i.i_completed_tasks,
                f_subtotal: Number(i.f_subtotal),
            })),
        }))
    }

    async getPromoterPaymentsByPromoter(id_promoter: number) {
        return this.getPromoterPayments({ id_promoter })
    }

    async getFinanceSummary() {
        const pendingInvoiceStatuses = [
            INVOICE_STATUS.PENDIENTE,
            INVOICE_STATUS.EN_REVISION,
            INVOICE_STATUS.RECHAZADO,
            INVOICE_STATUS.ATRASADO,
        ]
        const [cobrado, porCobrar, pagadoProm, pendienteProm] = await Promise.all([
            prisma.client_invoices.aggregate({ _sum: { f_total: true }, where: { b_active: true, i_status: INVOICE_STATUS.ACEPTADO } }),
            prisma.client_invoices.aggregate({ _sum: { f_total: true }, where: { b_active: true, i_status: { in: pendingInvoiceStatuses } } }),
            prisma.promoter_payments.aggregate({ _sum: { f_amount: true }, where: { b_active: true, i_status: PROMOTER_PAYMENT_STATUS.PAGADO } }),
            prisma.promoter_payments.aggregate({ _sum: { f_amount: true }, where: { b_active: true, i_status: PROMOTER_PAYMENT_STATUS.PENDIENTE } }),
        ])
        return {
            total_cobrado: Number(cobrado._sum.f_total ?? 0),
            total_pendiente_cobro: Number(porCobrar._sum.f_total ?? 0),
            total_pagado_promotores: Number(pagadoProm._sum.f_amount ?? 0),
            total_pendiente_promotores: Number(pendienteProm._sum.f_amount ?? 0),
        }
    }

    // ============================================================
    //  Helpers privados
    // ============================================================

    private async buildPriceMaps(tx: any, orderIds: number[]): Promise<PriceMaps> {
        const exact = new Map<string, number>()
        const byStore = new Map<string, number>()
        if (orderIds.length === 0) return { exact, byStore }
        const items = await tx.order_items.findMany({
            where: { id_order: { in: orderIds } },
            select: { id_order: true, id_store: true, id_request: true, f_value: true },
        })
        for (const it of items) {
            exact.set(`${it.id_order}|${it.id_store}|${it.id_request}`, Number(it.f_value))
            byStore.set(`${it.id_order}|${it.id_store}`, Number(it.f_value))
        }
        return { exact, byStore }
    }

    private async enrichInvoices(invoices: any[]) {
        const clients = await this.clientNameMap(invoices.map(i => i.id_client))
        const requests = await this.requestNameMap(
            invoices.flatMap(inv => inv.invoice_items.map((i: any) => i.id_request).filter((x: any): x is number => x != null)),
        )
        return invoices.map(inv => ({
            id_cobro: inv.id_invoice,
            id_invoice: inv.id_invoice,
            id_client: inv.id_client,
            client_name: clients.get(inv.id_client) ?? `Cliente #${inv.id_client}`,
            vc_folio: inv.vc_folio,
            dt_periodo_inicio: inv.dt_period_start,
            dt_periodo_fin: inv.dt_period_end,
            dt_vencimiento: inv.dt_due,
            f_total: Number(inv.f_total),
            status: INVOICE_STATUS_LABEL[inv.i_status],
            dt_pago: inv.dt_paid,
            items: inv.invoice_items.map((i: any) => ({
                id_order: i.id_order,
                id_request: i.id_request,
                request_name: i.id_request ? requests.get(i.id_request) ?? `Campaña #${i.id_request}` : null,
                i_completed_tasks: i.i_completed_tasks,
                f_subtotal: Number(i.f_subtotal),
            })),
        }))
    }

    private async clientNameMap(ids: number[]) {
        const unique = [...new Set(ids)]
        const map = new Map<number, string>()
        if (unique.length === 0) return map
        const rows = await prisma.clients.findMany({ where: { id_client: { in: unique } }, select: { id_client: true, name: true } })
        for (const r of rows) map.set(r.id_client, r.name ?? `Cliente #${r.id_client}`)
        return map
    }

    private async promoterNameMap(ids: number[]) {
        const unique = [...new Set(ids)]
        const map = new Map<number, string>()
        if (unique.length === 0) return map
        const rows = await prisma.promoters.findMany({ where: { id: { in: unique } }, select: { id: true, name: true, lastname: true } })
        for (const r of rows) map.set(r.id, `${r.name}${r.lastname ? ' ' + r.lastname : ''}`)
        return map
    }

    private async requestNameMap(ids: number[]) {
        const unique = [...new Set(ids)]
        const map = new Map<number, string>()
        if (unique.length === 0) return map
        const rows = await prisma.requests.findMany({ where: { id_request: { in: unique } }, select: { id_request: true, vc_name: true } })
        for (const r of rows) map.set(r.id_request, r.vc_name)
        return map
    }
}

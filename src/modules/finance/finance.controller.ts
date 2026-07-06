import { Request, Response } from 'express'
import { Finance } from './finance.service'

const finance = new Finance()

function parseNumber(value: any): number | undefined {
    if (value === undefined || value === null || value === '') return undefined
    const n = Number(value)
    return isNaN(n) ? undefined : n
}

/** Super admin = usuario sin cliente asociado (id_client === 0) o rol 1. */
function isSuperAdmin(req: Request): boolean {
    const u = req.user as any
    return !!u && (u.id_client === 0 || u.i_rol === 1)
}

function denySuperAdmin(res: Response) {
    res.status(403).json({ ok: false, error: 1, data: null, message: 'Solo el super admin puede realizar esta acción' })
}

function fail(res: Response, error: unknown, message: string) {
    console.error(`${message}:`, (error as any)?.message ?? error)
    res.status(500).json({ ok: false, error: 1, data: null, message, error_backend: (error as any)?.message ?? String(error) })
}

const ok = (res: Response, data: any, message: string) =>
    res.status(200).json({ ok: true, error: 0, data, message })

// ============================================================
//  SUPER ADMIN
// ============================================================

export const getInvoices = async (req: Request, res: Response) => {
    if (!isSuperAdmin(req)) return denySuperAdmin(res)
    try {
        const data = await finance.getAllInvoices({
            id_client: parseNumber(req.query.id_client),
            i_status: parseNumber(req.query.i_status),
        })
        ok(res, data, 'Cobros obtenidos exitosamente')
    } catch (e) { fail(res, e, 'Error al obtener los cobros') }
}

export const getInvoiceById = async (req: Request, res: Response) => {
    if (!isSuperAdmin(req)) return denySuperAdmin(res)
    try {
        const data = await finance.getInvoiceDetail(Number(req.params.id))
        if (!data) { res.status(404).json({ ok: false, error: 1, data: null, message: 'Cobro no encontrado' }); return }
        ok(res, data, 'Cobro obtenido exitosamente')
    } catch (e) { fail(res, e, 'Error al obtener el cobro') }
}

export const reviewInvoicePayment = async (req: Request, res: Response) => {
    if (!isSuperAdmin(req)) return denySuperAdmin(res)
    try {
        const { decision, vc_review_notes } = req.body
        if (decision !== 'aceptado' && decision !== 'rechazado') {
            res.status(400).json({ ok: false, error: 1, data: null, message: "decision debe ser 'aceptado' o 'rechazado'" })
            return
        }
        const data = await finance.reviewInvoicePayment(Number(req.params.id), {
            decision,
            vc_review_notes,
            id_reviewed_by: (req.user as any).id,
        })
        ok(res, data, 'Comprobante revisado exitosamente')
    } catch (e) { fail(res, e, 'Error al revisar el comprobante') }
}

export const markInvoiceLate = async (req: Request, res: Response) => {
    if (!isSuperAdmin(req)) return denySuperAdmin(res)
    try {
        const data = await finance.markInvoiceLate(Number(req.params.id))
        ok(res, data, 'Cobro marcado como atrasado')
    } catch (e) { fail(res, e, 'Error al marcar el cobro como atrasado') }
}

export const getPromoterPayments = async (req: Request, res: Response) => {
    if (!isSuperAdmin(req)) return denySuperAdmin(res)
    try {
        const data = await finance.getPromoterPayments({
            id_promoter: parseNumber(req.query.id_promoter),
            i_status: parseNumber(req.query.i_status),
        })
        ok(res, data, 'Pagos a promotores obtenidos exitosamente')
    } catch (e) { fail(res, e, 'Error al obtener los pagos a promotores') }
}

export const payPromoter = async (req: Request, res: Response) => {
    if (!isSuperAdmin(req)) return denySuperAdmin(res)
    try {
        const { vc_method, vc_reference, vc_notes } = req.body
        const data = await finance.registerPromoterPayment(Number(req.params.id), {
            vc_method, vc_reference, vc_notes, id_paid_by: (req.user as any).id,
        })
        ok(res, data, 'Pago a promotor registrado exitosamente')
    } catch (e) { fail(res, e, 'Error al registrar el pago a promotor') }
}

export const getSummary = async (req: Request, res: Response) => {
    if (!isSuperAdmin(req)) return denySuperAdmin(res)
    try {
        const data = await finance.getFinanceSummary()
        ok(res, data, 'Resumen financiero obtenido exitosamente')
    } catch (e) { fail(res, e, 'Error al obtener el resumen financiero') }
}

export const generateBilling = async (req: Request, res: Response) => {
    if (!isSuperAdmin(req)) return denySuperAdmin(res)
    try {
        const data = await finance.runBillingCycle({
            id_client: parseNumber(req.body.id_client),
            dt_period_start: req.body.dt_period_start,
            dt_period_end: req.body.dt_period_end,
        })
        ok(res, data, 'Generación de cobros y pagos ejecutada')
    } catch (e) { fail(res, e, 'Error al generar cobros y pagos') }
}

export const getConfig = async (req: Request, res: Response) => {
    if (!isSuperAdmin(req)) return denySuperAdmin(res)
    try {
        const data = await finance.getConfig()
        ok(res, data, 'Configuración financiera obtenida')
    } catch (e) { fail(res, e, 'Error al obtener la configuración') }
}

export const updateGlobalConfig = async (req: Request, res: Response) => {
    if (!isSuperAdmin(req)) return denySuperAdmin(res)
    try {
        const data = await finance.upsertGlobalConfig({
            f_promoter_pct: parseNumber(req.body.f_promoter_pct),
            i_default_period_days: parseNumber(req.body.i_default_period_days),
            i_default_billing_weekday: parseNumber(req.body.i_default_billing_weekday),
            i_default_payment_due_days: parseNumber(req.body.i_default_payment_due_days),
        })
        ok(res, data, 'Configuración global actualizada')
    } catch (e) { fail(res, e, 'Error al actualizar la configuración global') }
}

export const updateClientConfig = async (req: Request, res: Response) => {
    if (!isSuperAdmin(req)) return denySuperAdmin(res)
    try {
        const data = await finance.upsertClientConfig(Number(req.params.id_client), {
            i_period_days: parseNumber(req.body.i_period_days),
            i_billing_weekday: parseNumber(req.body.i_billing_weekday),
            i_payment_due_days: parseNumber(req.body.i_payment_due_days),
            b_active: req.body.b_active,
        })
        ok(res, data, 'Configuración del cliente actualizada')
    } catch (e) { fail(res, e, 'Error al actualizar la configuración del cliente') }
}

// ============================================================
//  CLIENTE
// ============================================================

export const getMyInvoices = async (req: Request, res: Response) => {
    try {
        const id_client = (req.user as any).id_client
        if (!id_client) { res.status(400).json({ ok: false, error: 1, data: null, message: 'Tu usuario no tiene un cliente asociado' }); return }
        const data = await finance.getInvoicesByClient(id_client)
        ok(res, data, 'Tus cobros fueron obtenidos exitosamente')
    } catch (e) { fail(res, e, 'Error al obtener tus cobros') }
}

export const getMyInvoiceById = async (req: Request, res: Response) => {
    try {
        const id_client = (req.user as any).id_client
        const data = await finance.getInvoiceDetail(Number(req.params.id))
        if (!data) { res.status(404).json({ ok: false, error: 1, data: null, message: 'Cobro no encontrado' }); return }
        if (data.id_client !== id_client) { res.status(403).json({ ok: false, error: 1, data: null, message: 'Este cobro no pertenece a tu cuenta' }); return }
        ok(res, data, 'Cobro obtenido exitosamente')
    } catch (e) { fail(res, e, 'Error al obtener el cobro') }
}

export const submitInvoicePayment = async (req: Request, res: Response) => {
    try {
        const id_invoice = Number(req.params.id)
        const id_client = (req.user as any).id_client
        const id_user = (req.user as any).id

        const detail = await finance.getInvoiceDetail(id_invoice)
        if (!detail) { res.status(404).json({ ok: false, error: 1, data: null, message: 'Cobro no encontrado' }); return }
        if (id_client && detail.id_client !== id_client) {
            res.status(403).json({ ok: false, error: 1, data: null, message: 'Este cobro no pertenece a tu cuenta' })
            return
        }

        const f_amount = parseNumber(req.body.f_amount)
        if (f_amount === undefined) { res.status(400).json({ ok: false, error: 1, data: null, message: 'El monto es requerido' }); return }

        const data = await finance.submitClientPayment(
            id_invoice,
            {
                id_user,
                f_amount,
                vc_method: req.body.vc_method,
                vc_reference: req.body.vc_reference,
                vc_notes: req.body.vc_notes,
            },
            req.file ? { buffer: req.file.buffer, mimetype: req.file.mimetype, originalname: req.file.originalname } : null,
        )
        ok(res, data, 'Comprobante enviado, queda en revisión')
    } catch (e) { fail(res, e, 'Error al enviar el comprobante') }
}

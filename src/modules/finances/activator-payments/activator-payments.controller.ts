import { Request, Response } from 'express'
import { ActivatorPayments } from './activator-payments.service'
import { StorageService } from '../../../services/storage.service'
import {
    GenerateActivatorPaymentsDTO,
    ActivatorPaymentFiltersDTO,
    UpdateActivatorPaymentPaymentDTO,
    UpdateActivatorPaymentStatusDTO,
} from './activator-payments.dto'

const activatorPaymentsService = new ActivatorPayments()

// Las fechas del panel llegan como AAAA-MM-DD. Se toman completas en hora de
// Mexico (UTC-6, sin horario de verano): desde las 00:00 hasta las 23:59:59.
function startMx(v: any): Date {
    const s = String(v)
    return /^\d{4}-\d{2}-\d{2}$/.test(s) ? new Date(`${s}T00:00:00-06:00`) : new Date(s)
}
function endMx(v: any): Date {
    const s = String(v)
    return /^\d{4}-\d{2}-\d{2}$/.test(s) ? new Date(`${s}T23:59:59.999-06:00`) : new Date(s)
}

function parseNumber(value: any): number | undefined {
    if (value === undefined || value === null || value === '') return undefined
    const num = Number(value)
    return isNaN(num) ? undefined : num
}

export const previewActivatorPayments = async (req: Request, res: Response) => {
    try {
        const input: GenerateActivatorPaymentsDTO = {
            dt_start: startMx(req.body.dt_start),
            dt_end: endMx(req.body.dt_end),
            id_activator: req.body.id_activator,
            id_user_creator: req.user!.id,
        }
        const result = await activatorPaymentsService.preview(input)
        res.status(200).json({ ok: true, error: 0, data: result, message: 'Preview generado exitosamente' })
    } catch (error) {
        console.error('PREVIEW ACTIVATOR PAYMENTS ERROR:', (error as any).message)
        res.status(422).json({ ok: false, error: 1, data: null, message: (error as any).message || 'Error al generar el preview', error_backend: error })
    }
}

export const generateActivatorPayments = async (req: Request, res: Response) => {
    try {
        const input: GenerateActivatorPaymentsDTO = {
            dt_start: startMx(req.body.dt_start),
            dt_end: endMx(req.body.dt_end),
            id_activator: req.body.id_activator,
            id_user_creator: req.user!.id,
        }
        const payments = await activatorPaymentsService.generate(input)
        res.status(200).json({ ok: true, error: 0, data: payments, message: `${payments.length} pago(s) de comisión generado(s) exitosamente` })
    } catch (error) {
        console.error('GENERATE ACTIVATOR PAYMENTS ERROR:', (error as any).message)
        res.status(409).json({ ok: false, error: 1, data: null, message: (error as any).message || 'Error al generar el pago', error_backend: error })
    }
}

export const getAllActivatorPayments = async (req: Request, res: Response) => {
    try {
        const filters: ActivatorPaymentFiltersDTO = {
            id_activator: parseNumber(req.query.id_activator),
            id_status: parseNumber(req.query.id_status),
            dt_start: req.query.dt_start ? new Date(req.query.dt_start as string) : undefined,
            dt_end: req.query.dt_end ? new Date(req.query.dt_end as string) : undefined,
            vc_folio: req.query.vc_folio as string | undefined,
            page: parseNumber(req.query.page),
            limit: parseNumber(req.query.limit),
        }
        const result = await activatorPaymentsService.list(filters)
        res.status(200).json({ ok: true, error: 0, data: result, message: 'Pagos de comisión obtenidos exitosamente' })
    } catch (error) {
        console.error('GET ALL ACTIVATOR PAYMENTS ERROR:', (error as any).message)
        res.status(500).json({ ok: false, error: 1, data: null, message: 'Error al obtener los pagos', error_backend: error })
    }
}

export const getActivatorPaymentById = async (req: Request, res: Response) => {
    try {
        const id_payment = Number(req.params.id_payment)
        const payment = await activatorPaymentsService.getById(id_payment)
        if (!payment) {
            res.status(404).json({ ok: false, error: 1, data: null, message: 'Pago no encontrado' })
            return
        }
        res.status(200).json({ ok: true, error: 0, data: payment, message: 'Pago obtenido exitosamente' })
    } catch (error) {
        console.error('GET ACTIVATOR PAYMENT BY ID ERROR:', (error as any).message)
        res.status(500).json({ ok: false, error: 1, data: null, message: 'Error al obtener el pago', error_backend: error })
    }
}

export const submitActivatorPayment = async (req: Request, res: Response) => {
    try {
        const id_payment = Number(req.params.id_payment)
        const existing = await activatorPaymentsService.getRaw(id_payment)
        if (!existing) {
            res.status(404).json({ ok: false, error: 1, data: null, message: 'Pago no encontrado' })
            return
        }
        if (!req.file) {
            res.status(400).json({ ok: false, error: 1, data: null, message: 'El comprobante del pago es requerido' })
            return
        }
        // El comprobante se sube antes de marcar como pagado: si falla, el corte sigue por pagar.
        await StorageService.uploadAsset({
            entity: 'activator_payment',
            entity_id: id_payment,
            buffer: req.file.buffer,
            mime: req.file.mimetype,
            folio: existing.vc_folio,
            id_user: req.user!.id,
            originalName: req.file.originalname,
            optimize: false,
        })
        const payload: UpdateActivatorPaymentPaymentDTO = {
            dt_payment: new Date(req.body.dt_payment),
            id_bank_account: req.body.id_bank_account ? Number(req.body.id_bank_account) : undefined,
            vc_notes: req.body.vc_notes,
        }
        const updated = await activatorPaymentsService.submitPayment(id_payment, payload, req.user!.id)
        res.status(200).json({ ok: true, error: 0, data: updated, message: 'Pago de comisión registrado exitosamente' })
    } catch (error) {
        console.error('SUBMIT ACTIVATOR PAYMENT ERROR:', (error as any).message)
        res.status(409).json({ ok: false, error: 1, data: null, message: (error as any).message || 'Error al registrar el pago', error_backend: error })
    }
}

export const updateActivatorPaymentStatus = async (req: Request, res: Response) => {
    try {
        const id_payment = Number(req.params.id_payment)
        const payload: UpdateActivatorPaymentStatusDTO = { action: req.body.action }
        const updated = await activatorPaymentsService.updateStatus(id_payment, payload, req.user!.id)
        res.status(200).json({ ok: true, error: 0, data: updated, message: 'Estatus del pago actualizado exitosamente' })
    } catch (error) {
        console.error('UPDATE ACTIVATOR PAYMENT STATUS ERROR:', (error as any).message)
        res.status(409).json({ ok: false, error: 1, data: null, message: (error as any).message || 'Error al actualizar el estatus', error_backend: error })
    }
}

export const getPendingActivatorPayments = async (_req: Request, res: Response) => {
    try {
        const data = await activatorPaymentsService.pending()
        res.status(200).json({ ok: true, error: 0, data, message: 'Pendientes obtenidos exitosamente' })
    } catch (error) {
        console.error('GET PENDING ACTIVATOR PAYMENTS ERROR:', (error as any).message)
        res.status(500).json({ ok: false, error: 1, data: null, message: 'Error al obtener lo pendiente de activadores' })
    }
}

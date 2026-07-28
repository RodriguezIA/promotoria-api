import { Request, Response } from 'express'
import { PromoterPayments } from './promoter-payments.service'
import { StorageService } from '../../../services/storage.service'
import { GeneratePaymentsDTO, PaymentFiltersDTO, UpdatePaymentPaymentDTO } from './promoter-payments.dto'

const promoterPaymentsService = new PromoterPayments()

function parseNumber(value: any): number | undefined {
    if (value === undefined || value === null || value === '') return undefined
    const num = Number(value)
    return isNaN(num) ? undefined : num
}

export const previewPromoterPayments = async (req: Request, res: Response) => {
    try {
        const input: GeneratePaymentsDTO = {
            dt_start: new Date(req.body.dt_start),
            dt_end: new Date(req.body.dt_end),
            id_promoter: req.body.id_promoter,
            id_user_creator: req.user!.id,
        }
        const result = await promoterPaymentsService.preview(input)
        res.status(200).json({ ok: true, error: 0, data: result, message: 'Preview generado exitosamente' })
    } catch (error) {
        console.error('PREVIEW PROMOTER PAYMENTS ERROR:', (error as any).message)
        const message = (error as any).message || 'Error al generar el preview'
        const status = message.includes('Configura el porcentaje') ? 422 : 500
        res.status(status).json({ ok: false, error: 1, data: null, message, error_backend: error })
    }
}

export const generatePromoterPayments = async (req: Request, res: Response) => {
    try {
        const input: GeneratePaymentsDTO = {
            dt_start: new Date(req.body.dt_start),
            dt_end: new Date(req.body.dt_end),
            id_promoter: req.body.id_promoter,
            id_user_creator: req.user!.id,
        }
        const payments = await promoterPaymentsService.generate(input)
        res.status(200).json({ ok: true, error: 0, data: payments, message: `${payments.length} pago(s) generado(s) exitosamente` })
    } catch (error) {
        console.error('GENERATE PROMOTER PAYMENTS ERROR:', (error as any).message)
        const message = (error as any).message || 'Error al generar el pago'
        const status = message.includes('Configura el porcentaje') ? 422 : 409
        res.status(status).json({ ok: false, error: 1, data: null, message, error_backend: error })
    }
}

export const getAllPromoterPayments = async (req: Request, res: Response) => {
    try {
        const filters: PaymentFiltersDTO = {
            id_promoter: parseNumber(req.query.id_promoter),
            id_status: parseNumber(req.query.id_status),
            dt_start: req.query.dt_start ? new Date(req.query.dt_start as string) : undefined,
            dt_end: req.query.dt_end ? new Date(req.query.dt_end as string) : undefined,
            vc_folio: req.query.vc_folio as string | undefined,
            page: parseNumber(req.query.page),
            limit: parseNumber(req.query.limit),
        }
        const result = await promoterPaymentsService.list(filters)
        res.status(200).json({ ok: true, error: 0, data: result, message: 'Pagos obtenidos exitosamente' })
    } catch (error) {
        console.error('GET ALL PROMOTER PAYMENTS ERROR:', (error as any).message)
        res.status(500).json({ ok: false, error: 1, data: null, message: 'Error al obtener los pagos', error_backend: error })
    }
}

export const getPromoterPaymentById = async (req: Request, res: Response) => {
    try {
        const id_payment = Number(req.params.id_payment)
        const payment = await promoterPaymentsService.getById(id_payment)
        if (!payment) {
            res.status(404).json({ ok: false, error: 1, data: null, message: 'Pago no encontrado' })
            return
        }
        res.status(200).json({ ok: true, error: 0, data: payment, message: 'Pago obtenido exitosamente' })
    } catch (error) {
        console.error('GET PROMOTER PAYMENT BY ID ERROR:', (error as any).message)
        res.status(500).json({ ok: false, error: 1, data: null, message: 'Error al obtener el pago', error_backend: error })
    }
}

export const submitPromoterPayment = async (req: Request, res: Response) => {
    try {
        const id_payment = Number(req.params.id_payment)
        const existing = await promoterPaymentsService.getRaw(id_payment)
        if (!existing) {
            res.status(404).json({ ok: false, error: 1, data: null, message: 'Pago no encontrado' })
            return
        }
        if (!req.file) {
            res.status(400).json({ ok: false, error: 1, data: null, message: 'La evidencia del pago es requerida' })
            return
        }

        // La evidencia se sube antes de mover el estatus: si la subida falla, el pago no queda
        // marcado como PAGADO sin un comprobante real respaldándolo.
        await StorageService.uploadAsset({
            entity: 'promoter_payment',
            entity_id: id_payment,
            buffer: req.file.buffer,
            mime: req.file.mimetype,
            folio: existing.vc_folio,
            id_user: req.user!.id,
            originalName: req.file.originalname,
            optimize: false,
        })

        const payload: UpdatePaymentPaymentDTO = {
            dt_payment: new Date(req.body.dt_payment),
            id_bank_account: Number(req.body.id_bank_account),
            vc_notes: req.body.vc_notes,
        }
        const updated = await promoterPaymentsService.submitPayment(id_payment, payload, req.user!.id)

        res.status(200).json({ ok: true, error: 0, data: updated, message: 'Pago registrado exitosamente' })
    } catch (error) {
        console.error('SUBMIT PROMOTER PAYMENT ERROR:', (error as any).message)
        res.status(409).json({ ok: false, error: 1, data: null, message: (error as any).message || 'Error al registrar el pago', error_backend: error })
    }
}

export const updatePromoterPaymentStatus = async (req: Request, res: Response) => {
    try {
        const id_payment = Number(req.params.id_payment)
        const updated = await promoterPaymentsService.cancel(id_payment, req.user!.id)
        res.status(200).json({ ok: true, error: 0, data: updated, message: 'Pago cancelado exitosamente' })
    } catch (error) {
        console.error('UPDATE PROMOTER PAYMENT STATUS ERROR:', (error as any).message)
        res.status(409).json({ ok: false, error: 1, data: null, message: (error as any).message || 'Error al cancelar el pago', error_backend: error })
    }
}

import { Request, Response } from 'express'
import { ClientCharges } from './client-charges.service'
import { StorageService } from '../../../services/storage.service'
import { ROLES } from '../../../core/constants/status.constants'
import { GenerateChargesDTO, ChargeFiltersDTO, UpdateChargePaymentDTO, UpdateChargeStatusDTO } from './client-charges.dto'

const clientChargesService = new ClientCharges()

function parseNumber(value: any): number | undefined {
    if (value === undefined || value === null || value === '') return undefined
    const num = Number(value)
    return isNaN(num) ? undefined : num
}

export const previewClientCharges = async (req: Request, res: Response) => {
    try {
        const input: GenerateChargesDTO = {
            dt_start: new Date(req.body.dt_start),
            dt_end: new Date(req.body.dt_end),
            id_client: req.body.id_client,
            id_user_creator: req.user!.id,
        }
        const result = await clientChargesService.preview(input)
        res.status(200).json({ ok: true, error: 0, data: result, message: 'Preview generado exitosamente' })
    } catch (error) {
        console.error('PREVIEW CLIENT CHARGES ERROR:', (error as any).message)
        res.status(500).json({ ok: false, error: 1, data: null, message: 'Error al generar el preview', error_backend: error })
    }
}

export const generateClientCharges = async (req: Request, res: Response) => {
    try {
        const input: GenerateChargesDTO = {
            dt_start: new Date(req.body.dt_start),
            dt_end: new Date(req.body.dt_end),
            id_client: req.body.id_client,
            id_user_creator: req.user!.id,
        }
        const charges = await clientChargesService.generate(input)
        res.status(200).json({ ok: true, error: 0, data: charges, message: `${charges.length} corte(s) generado(s) exitosamente` })
    } catch (error) {
        console.error('GENERATE CLIENT CHARGES ERROR:', (error as any).message)
        res.status(409).json({ ok: false, error: 1, data: null, message: (error as any).message || 'Error al generar el corte', error_backend: error })
    }
}

export const getAllClientCharges = async (req: Request, res: Response) => {
    try {
        const filters: ChargeFiltersDTO = {
            id_client: req.user!.i_rol === ROLES.ADMIN ? req.user!.id_client : parseNumber(req.query.id_client),
            id_status: parseNumber(req.query.id_status),
            dt_start: req.query.dt_start ? new Date(req.query.dt_start as string) : undefined,
            dt_end: req.query.dt_end ? new Date(req.query.dt_end as string) : undefined,
            vc_folio: req.query.vc_folio as string | undefined,
            page: parseNumber(req.query.page),
            limit: parseNumber(req.query.limit),
        }
        const result = await clientChargesService.list(filters)
        res.status(200).json({ ok: true, error: 0, data: result, message: 'Cobros obtenidos exitosamente' })
    } catch (error) {
        console.error('GET ALL CLIENT CHARGES ERROR:', (error as any).message)
        res.status(500).json({ ok: false, error: 1, data: null, message: 'Error al obtener los cobros', error_backend: error })
    }
}

export const getClientChargeById = async (req: Request, res: Response) => {
    try {
        const id_charge = Number(req.params.id_charge)
        const charge = await clientChargesService.getById(id_charge)
        if (!charge) {
            res.status(404).json({ ok: false, error: 1, data: null, message: 'Cobro no encontrado' })
            return
        }
        if (req.user!.i_rol === ROLES.ADMIN && charge.id_client !== req.user!.id_client) {
            res.status(403).json({ ok: false, error: 1, data: null, message: 'No tienes permiso para ver este cobro' })
            return
        }
        res.status(200).json({ ok: true, error: 0, data: charge, message: 'Cobro obtenido exitosamente' })
    } catch (error) {
        console.error('GET CLIENT CHARGE BY ID ERROR:', (error as any).message)
        res.status(500).json({ ok: false, error: 1, data: null, message: 'Error al obtener el cobro', error_backend: error })
    }
}

export const submitClientChargePayment = async (req: Request, res: Response) => {
    try {
        const id_charge = Number(req.params.id_charge)
        const existing = await clientChargesService.getRaw(id_charge)
        if (!existing) {
            res.status(404).json({ ok: false, error: 1, data: null, message: 'Cobro no encontrado' })
            return
        }
        if (existing.id_client !== req.user!.id_client) {
            res.status(403).json({ ok: false, error: 1, data: null, message: 'No tienes permiso para pagar este cobro' })
            return
        }
        if (!req.file) {
            res.status(400).json({ ok: false, error: 1, data: null, message: 'La evidencia del comprobante de pago es requerida' })
            return
        }

        // La evidencia se sube antes de mover el estatus: si la subida falla, el cobro no queda
        // en EN_VALIDACION sin un comprobante real respaldándolo.
        await StorageService.uploadAsset({
            entity: 'client_charge',
            entity_id: id_charge,
            buffer: req.file.buffer,
            mime: req.file.mimetype,
            id_client: existing.id_client,
            folio: existing.vc_folio,
            id_user: req.user!.id,
            originalName: req.file.originalname,
            optimize: false,
        })

        const payload: UpdateChargePaymentDTO = {
            dt_payment: new Date(req.body.dt_payment),
            vc_payment_method: req.body.vc_payment_method,
        }
        const updated = await clientChargesService.submitPayment(id_charge, payload, req.user!.id)

        res.status(200).json({ ok: true, error: 0, data: updated, message: 'Comprobante de pago registrado exitosamente' })
    } catch (error) {
        console.error('SUBMIT CLIENT CHARGE PAYMENT ERROR:', (error as any).message)
        res.status(409).json({ ok: false, error: 1, data: null, message: (error as any).message || 'Error al registrar el pago', error_backend: error })
    }
}

export const updateClientChargeStatus = async (req: Request, res: Response) => {
    try {
        const id_charge = Number(req.params.id_charge)
        const payload: UpdateChargeStatusDTO = {
            action: req.body.action,
            vc_rejection_reason: req.body.vc_rejection_reason,
        }
        const updated = await clientChargesService.updateStatus(id_charge, payload, req.user!.id)
        res.status(200).json({ ok: true, error: 0, data: updated, message: 'Estatus del cobro actualizado exitosamente' })
    } catch (error) {
        console.error('UPDATE CLIENT CHARGE STATUS ERROR:', (error as any).message)
        res.status(409).json({ ok: false, error: 1, data: null, message: (error as any).message || 'Error al actualizar el estatus', error_backend: error })
    }
}

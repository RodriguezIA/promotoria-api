import { Request, Response } from 'express'
import { DriverActivatorPayments } from './driver-activator-payments.service'
import { DriverFinance } from '../../driver-finance/driver-finance.service'
import { prisma } from '../../../core/prisma'

const service = new DriverActivatorPayments()

function parseNumber(value: any): number | undefined {
    if (value === undefined || value === null || value === '') return undefined
    const num = Number(value)
    return isNaN(num) ? undefined : num
}

export const previewDriverActivatorPayments = async (req: Request, res: Response) => {
    try {
        const result = await service.preview({
            dt_start: new Date(req.body.dt_start),
            dt_end: new Date(req.body.dt_end),
            id_driver: req.body.id_driver,
            id_user_creator: req.user!.id,
        })
        res.status(200).json({ ok: true, error: 0, data: result, message: 'Preview generado exitosamente' })
    } catch (error) {
        console.error('PREVIEW DRIVER ACTIVATOR PAYMENTS ERROR:', (error as any).message)
        res.status(422).json({ ok: false, error: 1, data: null, message: (error as any).message || 'Error al generar el preview' })
    }
}

export const generateDriverActivatorPayments = async (req: Request, res: Response) => {
    try {
        const payments = await service.generate({
            dt_start: new Date(req.body.dt_start),
            dt_end: new Date(req.body.dt_end),
            id_driver: req.body.id_driver,
            id_user_creator: req.user!.id,
        })
        res.status(200).json({ ok: true, error: 0, data: payments, message: `${payments.length} pago(s) de comisión generado(s) exitosamente` })
    } catch (error) {
        console.error('GENERATE DRIVER ACTIVATOR PAYMENTS ERROR:', (error as any).message)
        res.status(409).json({ ok: false, error: 1, data: null, message: (error as any).message || 'Error al generar el pago' })
    }
}

export const getAllDriverActivatorPayments = async (req: Request, res: Response) => {
    try {
        const result = await service.list({
            id_driver: parseNumber(req.query.id_driver),
            id_status: parseNumber(req.query.id_status),
            vc_folio: req.query.vc_folio as string | undefined,
            page: parseNumber(req.query.page),
            limit: parseNumber(req.query.limit),
        })
        res.status(200).json({ ok: true, error: 0, data: result, message: 'Pagos de comisión obtenidos exitosamente' })
    } catch (error) {
        console.error('GET ALL DRIVER ACTIVATOR PAYMENTS ERROR:', (error as any).message)
        res.status(500).json({ ok: false, error: 1, data: null, message: 'Error al obtener los pagos' })
    }
}

export const getDriverActivatorPaymentById = async (req: Request, res: Response) => {
    try {
        const payment = await service.getById(Number(req.params.id_payment))
        if (!payment) {
            res.status(404).json({ ok: false, error: 1, data: null, message: 'Pago no encontrado' })
            return
        }
        res.status(200).json({ ok: true, error: 0, data: payment, message: 'Pago obtenido exitosamente' })
    } catch (error) {
        console.error('GET DRIVER ACTIVATOR PAYMENT ERROR:', (error as any).message)
        res.status(500).json({ ok: false, error: 1, data: null, message: 'Error al obtener el pago' })
    }
}

export const submitDriverActivatorPayment = async (req: Request, res: Response) => {
    try {
        const updated = await service.submitPayment(
            Number(req.params.id_payment),
            { dt_payment: new Date(req.body.dt_payment), vc_notes: req.body.vc_notes },
            req.user!.id
        )
        res.status(200).json({ ok: true, error: 0, data: updated, message: 'Pago de comisión registrado exitosamente' })
    } catch (error) {
        console.error('SUBMIT DRIVER ACTIVATOR PAYMENT ERROR:', (error as any).message)
        res.status(409).json({ ok: false, error: 1, data: null, message: (error as any).message || 'Error al registrar el pago' })
    }
}

export const updateDriverActivatorPaymentStatus = async (req: Request, res: Response) => {
    try {
        const updated = await service.cancel(Number(req.params.id_payment), req.user!.id)
        res.status(200).json({ ok: true, error: 0, data: updated, message: 'Pago cancelado exitosamente' })
    } catch (error) {
        console.error('CANCEL DRIVER ACTIVATOR PAYMENT ERROR:', (error as any).message)
        res.status(409).json({ ok: false, error: 1, data: null, message: (error as any).message || 'Error al cancelar el pago' })
    }
}

/**
 * Numero completo de la cuenta del chofer, solo para hacer el deposito.
 * Solo master (ver rutas) y queda registrado en la bitacora de usuarios.
 */
export const revealDriverBankAccount = async (req: Request, res: Response) => {
    try {
        const id_account = Number(req.params.id_account)
        const revealed = await new DriverFinance().revealBankAccount(id_account)
        if (!revealed) {
            res.status(404).json({ ok: false, error: 1, data: null, message: 'Cuenta bancaria no encontrada' })
            return
        }
        const last4 = (revealed.clabe || revealed.card_number || '').slice(-4)
        await prisma.user_logs.create({
            data: {
                id_user: req.user!.id,
                log: `Consultó el número completo de la cuenta bancaria #${id_account} del chofer #${revealed.id_driver} (terminación ${last4}), para realizar un depósito manual.`,
            },
        })
        res.status(200).json({ ok: true, error: 0, data: revealed, message: 'Cuenta obtenida exitosamente' })
    } catch (error) {
        console.error('REVEAL DRIVER BANK ACCOUNT ERROR:', (error as any).message)
        res.status(500).json({ ok: false, error: 1, data: null, message: 'Error al obtener la cuenta bancaria' })
    }
}

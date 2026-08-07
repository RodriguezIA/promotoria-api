import { Request, Response } from 'express'
import { PromoterSelfPayments } from './promoter-self-payments.service'

const service = new PromoterSelfPayments()

// OJO de seguridad: nunca se confía en el id_promoter que manda la app en la
// query string, siempre se usa el id que viene del token (req.user.id). Así
// un promotor jamás puede ver los pagos de otro cambiando el parámetro.

export const getHistory = async (req: Request, res: Response) => {
    try {
        const id_promoter = req.user!.id
        const data = await service.getHistory(id_promoter)
        res.status(200).json({ ok: true, error: 0, data, message: 'Historial de pagos obtenido exitosamente' })
    } catch (error) {
        console.error('GET PROMOTER PAYMENTS HISTORY ERROR:', (error as any).message)
        res.status(500).json({ ok: false, error: 1, data: null, message: 'Error al obtener el historial de pagos' })
    }
}

export const getPending = async (req: Request, res: Response) => {
    try {
        const id_promoter = req.user!.id
        const data = await service.getPending(id_promoter)
        res.status(200).json({ ok: true, error: 0, data, message: 'Pagos pendientes obtenidos exitosamente' })
    } catch (error) {
        console.error('GET PROMOTER PAYMENTS PENDING ERROR:', (error as any).message)
        res.status(500).json({ ok: false, error: 1, data: null, message: 'Error al obtener los pagos pendientes' })
    }
}

export const getAffiliation = async (req: Request, res: Response) => {
    try {
        const id_promoter = req.user!.id
        const data = await service.getAffiliation(id_promoter)
        res.status(200).json({ ok: true, error: 0, data, message: 'Resumen de afiliación obtenido exitosamente' })
    } catch (error) {
        console.error('GET PROMOTER AFFILIATION ERROR:', (error as any).message)
        res.status(500).json({ ok: false, error: 1, data: null, message: 'Error al obtener el resumen de afiliación' })
    }
}

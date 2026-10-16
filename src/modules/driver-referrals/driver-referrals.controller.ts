import { Request, Response } from 'express'
import { DriverReferrals } from './driver-referrals.service'

const service = new DriverReferrals()

export const getMyAffiliation = async (req: Request, res: Response) => {
    try {
        const data = await service.getAffiliation(req.user!.id)
        res.status(200).json({ ok: true, error: 0, data, message: 'Afiliación obtenida exitosamente' })
    } catch (error) {
        console.error('f.getMyAffiliation: ', error)
        res.status(500).json({ ok: false, error: 1, data: null, message: 'Error al obtener tu código de invitación' })
    }
}

export const getMyReferrals = async (req: Request, res: Response) => {
    try {
        const data = await service.getReferrals(req.user!.id)
        res.status(200).json({ ok: true, error: 0, data, message: 'Invitados obtenidos exitosamente' })
    } catch (error) {
        console.error('f.getMyReferrals: ', error)
        res.status(500).json({ ok: false, error: 1, data: null, message: 'Error al obtener tus invitados' })
    }
}

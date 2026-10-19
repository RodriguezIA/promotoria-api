import { Request, Response } from 'express'
import { DriverFinance } from './driver-finance.service'

const service = new DriverFinance()

export const getMyPayments = async (req: Request, res: Response) => {
    try {
        const data = await service.getPayments(req.user!.id)
        res.status(200).json({ ok: true, error: 0, data, message: 'Cortes obtenidos exitosamente' })
    } catch (error) {
        console.error('f.getMyPayments: ', error)
        res.status(500).json({ ok: false, error: 1, data: null, message: 'Error al obtener tus cortes' })
    }
}

export const getMyBankAccount = async (req: Request, res: Response) => {
    try {
        const data = await service.getBankAccount(req.user!.id)
        res.status(200).json({ ok: true, error: 0, data, message: 'Cuenta obtenida exitosamente' })
    } catch (error) {
        console.error('f.getMyBankAccount: ', error)
        res.status(500).json({ ok: false, error: 1, data: null, message: 'Error al obtener tu cuenta' })
    }
}

export const saveMyBankAccount = async (req: Request, res: Response) => {
    try {
        const account_type = String(req.body.account_type || '').toUpperCase()
        const holder = String(req.body.account_holder_name || '').trim()
        const bank = String(req.body.bank_name || '').trim()
        const number = String(req.body.number || '').replace(/[\s-]/g, '')

        if (account_type !== 'CLABE' && account_type !== 'CARD') {
            res.status(400).json({ ok: false, error: 1, data: null, message: 'Elige si es CLABE o tarjeta' }); return
        }
        if (!holder || holder.length > 255) {
            res.status(400).json({ ok: false, error: 1, data: null, message: 'Escribe el nombre del titular' }); return
        }
        if (!bank || bank.length > 255) {
            res.status(400).json({ ok: false, error: 1, data: null, message: 'Escribe el nombre del banco' }); return
        }
        if (!/^\d+$/.test(number)) {
            res.status(400).json({ ok: false, error: 1, data: null, message: 'El número solo debe tener dígitos' }); return
        }
        if (account_type === 'CLABE' && number.length !== 18) {
            res.status(400).json({ ok: false, error: 1, data: null, message: 'La CLABE debe tener 18 dígitos' }); return
        }
        if (account_type === 'CARD' && (number.length < 15 || number.length > 16)) {
            res.status(400).json({ ok: false, error: 1, data: null, message: 'La tarjeta debe tener 16 dígitos' }); return
        }

        const data = await service.saveBankAccount(req.user!.id, { account_holder_name: holder, account_type, bank_name: bank, number })
        res.status(200).json({ ok: true, error: 0, data, message: 'Cuenta guardada exitosamente' })
    } catch (error) {
        console.error('f.saveMyBankAccount: ', error)
        res.status(500).json({ ok: false, error: 1, data: null, message: 'Error al guardar tu cuenta' })
    }
}

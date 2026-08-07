import { Request, Response } from 'express'

import { Utils } from '../../core/utils'
import { Promoter } from './promoter.service'
import { StorageService } from '../../services/storage.service'
import { CreatePromoterDTO, LoginPromoterDTO, TokenPromoterPayload, CreatePromoterBankAccountDTO, UpdatePromoterBankAccountDTO } from './promoter.dtos'


const promoterService = new Promoter();

export const getPromoters = async (req: Request, res: Response) => {
    try {
        const promoters = await promoterService.getPromoters()
        const safePromoters = promoters.map(({ password, ...p }) => p)
        res.status(200).json({ ok: true, error: 0, data: safePromoters, message: 'Promotores obtenidos exitosamente' })
    } catch (error) {
        res.status(500).json({ ok: false, error: 1, data: null, message: 'Error al obtener los promotores' })
    }
}

export const getPromoterById = async (req: Request, res: Response) => {
    try {
        const id = Number(req.params.id)
        const promoter = await promoterService.getPromoterById(id)
        res.status(200).json({ ok: true, error: 0, data: promoter, message: 'Promotor obtenido exitosamente' })
    } catch (error) {
        res.status(500).json({ ok: false, error: 1, data: null, message: 'Error al obtener el promotor' })
    }
}

export const createPromoter = async (req: Request, res: Response) => {
    try {
        const body: CreatePromoterDTO = req.body

        const promoter = await promoterService.createPromoter(body)

        res.status(201).json({
            ok: true,
            error: 0,
            data: promoter,
            message: "Promotor creado exitosamente",
        })
    } catch (error) {
        console.log("Error en createPromoter: ", error)
        res.status(400).json({
            ok: false,
            error: 1,
            data: null,
            message: (error as any).message || "Error al crear el promotor",
        })
    }
}

export const loginPromoter = async(req: Request, res: Response) => {
    try {
        const body: LoginPromoterDTO = req.body

        const result = await promoterService.validatePromoterByTermino(body.termino, body.password)

        if (!result) {
            return res.status(401).json({
                ok: false,
                error: 1,
                data: null,
                message: "Credenciales inválidas",
            })
        }

        const { promoter, field } = result

        const tokenPayload: TokenPromoterPayload = {
            id: promoter.id,
            phone: promoter.phone,
            email: promoter.email || undefined,
        }

        const token =  Utils.generate_token(tokenPayload)

        const { password, ...promoterWithoutPassword} = promoter

        await promoterService.updateLastLogin(promoter.id, body.fcm_token)

        if (body.latitude !== undefined && body.longitude !== undefined) {
            await promoterService.updateGeolocation(promoter.id, body.latitude, body.longitude)
        }

        res.status(200).json({
            ok: true,
            error: 0,
            data: { ...promoterWithoutPassword, token },
            message: `Promotor autenticado exitosamente por ${field}`,
        })

    } catch (error) {
        console.log("f.loginPromoter error: ", error)
        res.status(500).json({
            ok: false,
            error: 1,
            data: null,
            message: "Error al iniciar sesión del promotor",
        })
    }
}

export const updateFcmToken = async (req: Request, res: Response) => {
    try {
        const id_promoter = Number(req.params.id_promoter)
        const { fcm_token } = req.body

        const promoter = await promoterService.getPromoterById(id_promoter)
        if (!promoter) {
            return res.status(404).json({ ok: false, error: 1, data: null, message: 'Promotor no encontrado' })
        }

        const updated = await promoterService.updateFcmToken(id_promoter, fcm_token)
        const { password, ...promoterWithoutPassword } = updated

        res.status(200).json({
            ok: true,
            error: 0,
            data: promoterWithoutPassword,
            message: 'Token de notificaciones actualizado exitosamente',
        })
    } catch (error) {
        console.error('f.updateFcmToken: ', error)
        res.status(500).json({ ok: false, error: 1, data: null, message: 'Error al actualizar el token de notificaciones' })
    }
}

export const updatePromoterLocation = async (req: Request, res: Response) => {
    try {
        const id_promoter = Number(req.params.id_promoter)
        const { latitude, longitude } = req.body

        const promoter = await promoterService.getPromoterById(id_promoter)
        if (!promoter) {
            return res.status(404).json({ ok: false, error: 1, data: null, message: 'Promotor no encontrado' })
        }

        const updated = await promoterService.updateGeolocation(id_promoter, latitude, longitude)
        const { password, ...promoterWithoutPassword } = updated

        res.status(200).json({
            ok: true,
            error: 0,
            data: promoterWithoutPassword,
            message: 'Ubicación del promotor actualizada correctamente',
        })
    } catch (error) {
        console.error('f.updatePromoterLocation: ', error)
        res.status(500).json({ ok: false, error: 1, data: null, message: 'Error al actualizar la ubicación del promotor' })
    }
}

export const updateLocationPromoter = async(req: Request, res: Response) => {
    try {
        const { id, latitude, longitude }: { id: number; latitude: number; longitude: number } = req.body
        const updatedPromoter = await promoterService.updateGeolocation(id, latitude, longitude)
        res.status(200).json({
            ok: true,
            error: 0,
            data: updatedPromoter,
            message: "Ubicación del promotor actualizada correctamente",
        })
    } catch (error) {
        res.status(500).json({
            ok: false,
            error: 1,
            data: null,
            message: "Error al actualizar la ubicación del promotor",
        })
    }
}


export const getPromoterBankAccounts = async (req: Request, res: Response) => {
    try {
        const id_promoter = Number(req.params.id_promoter)
        const accounts = await promoterService.getBankAccountsByPromoter(id_promoter)
        res.status(200).json({ ok: true, error: 0, data: accounts, message: 'Cuentas bancarias obtenidas exitosamente' })
    } catch (error) {
        console.error('f.getPromoterBankAccounts: ', error)
        res.status(500).json({ ok: false, error: 1, data: null, message: 'Error al obtener las cuentas bancarias' })
    }
}

export const createPromoterBankAccount = async (req: Request, res: Response) => {
    try {
        const id_promoter = Number(req.params.id_promoter)
        const promoter = await promoterService.getPromoterById(id_promoter)
        if (!promoter) {
            return res.status(404).json({ ok: false, error: 1, data: null, message: 'Promotor no encontrado' })
        }
        const body: CreatePromoterBankAccountDTO = req.body
        const account = await promoterService.createBankAccount(id_promoter, body)
        res.status(201).json({ ok: true, error: 0, data: account, message: 'Cuenta bancaria creada exitosamente' })
    } catch (error) {
        console.error('f.createPromoterBankAccount: ', error)
        res.status(500).json({ ok: false, error: 1, data: null, message: 'Error al crear la cuenta bancaria' })
    }
}

export const getPromoterBankAccount = async (req: Request, res: Response) => {
    try {
        const id_promoter = Number(req.params.id_promoter)
        const id_account = Number(req.params.id_account)
        const account = await promoterService.getBankAccountById(id_account, id_promoter)
        if (!account) {
            return res.status(404).json({ ok: false, error: 1, data: null, message: 'Cuenta bancaria no encontrada' })
        }
        res.status(200).json({ ok: true, error: 0, data: account, message: 'Cuenta bancaria obtenida exitosamente' })
    } catch (error) {
        console.error('f.getPromoterBankAccount: ', error)
        res.status(500).json({ ok: false, error: 1, data: null, message: 'Error al obtener la cuenta bancaria' })
    }
}

export const updatePromoterBankAccount = async (req: Request, res: Response) => {
    try {
        const id_promoter = Number(req.params.id_promoter)
        const id_account = Number(req.params.id_account)
        const existing = await promoterService.getBankAccountById(id_account, id_promoter)
        if (!existing) {
            return res.status(404).json({ ok: false, error: 1, data: null, message: 'Cuenta bancaria no encontrada' })
        }
        const body: UpdatePromoterBankAccountDTO = req.body
        const updated = await promoterService.updateBankAccount(id_account, body)
        res.status(200).json({ ok: true, error: 0, data: updated, message: 'Cuenta bancaria actualizada exitosamente' })
    } catch (error) {
        console.error('f.updatePromoterBankAccount: ', error)
        res.status(500).json({ ok: false, error: 1, data: null, message: 'Error al actualizar la cuenta bancaria' })
    }
}


export const deletePromoterBankAccount = async (req: Request, res: Response) => {
    try {
        const id_promoter = Number(req.params.id_promoter)
        const id_account = Number(req.params.id_account)
        const existing = await promoterService.getBankAccountById(id_account, id_promoter)
        if (!existing) {
            return res.status(404).json({ ok: false, error: 1, data: null, message: 'Cuenta bancaria no encontrada' })
        }
        await promoterService.softDeleteBankAccount(id_account)
        res.status(200).json({ ok: true, error: 0, data: null, message: 'Cuenta bancaria eliminada exitosamente' })
    } catch (error) {
        console.error('f.deletePromoterBankAccount: ', error)
        res.status(500).json({ ok: false, error: 1, data: null, message: 'Error al eliminar la cuenta bancaria' })
    }
}

export const updatePromoterImage = async (req: Request, res: Response) => {
    const { id_promoter } = req.params

    if (!req.file) {
        return res.status(400).json({ ok: false, error: 1, data: null, message: 'No se recibió archivo' })
    }

    const id_promoter_num = Number(id_promoter)

    try {
        // Verificar que el promotor existe
        const promoter = await promoterService.getPromoterById(id_promoter_num)
        if (!promoter) {
            return res.status(404).json({ ok: false, error: 1, data: null, message: 'Promotor no encontrado' })
        }

        const { url, vc_folio } = await StorageService.uploadAsset({
            entity: 'promoter',
            entity_id: id_promoter_num,
            buffer: req.file.buffer,
            mime: req.file.mimetype,
            optimize: { maxW: 400, maxH: 400, quality: 85 },
        })

        res.status(200).json({
            ok: true,
            error: 0,
            data: { url, vc_folio },
            message: 'Imagen de perfil actualizada exitosamente',
        })
    } catch (error) {
        console.error('f.updatePromoterImage: ', error)
        res.status(500).json({
            ok: false,
            error: 1,
            data: null,
            message: 'Error al subir la imagen de perfil',
        })
    }
}

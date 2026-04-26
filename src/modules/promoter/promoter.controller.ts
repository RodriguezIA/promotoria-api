import { Request, Response } from 'express'


import { Utils } from '../../core/utils'
import { Promoter } from './promoter.service'
import { CreatePromoterDTO,  LoginPromoterDTO, TokenPromoterPayload } from './promoter.dtos'


const promoterService = new Promoter();


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
        res.status(500).json({
            ok: false,
            error: 1,
            data: null,
            message: "Error al crear el promotor",
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

        await promoterService.updateLastLogin(promoter.id)

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
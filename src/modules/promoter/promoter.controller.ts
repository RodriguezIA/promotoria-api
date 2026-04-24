import { Request, Response } from 'express'


import { Promoter } from './promoter.service'
import { CreatePromoterDTO } from './promoter.dtos'


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
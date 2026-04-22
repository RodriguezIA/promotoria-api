import {Request, Response} from 'express'

import { SalesChannel } from './channel_sales.service'
import { salesChannelsDTOCreate } from './channel_sales.dto'
import { UploadService } from '../../services/upload.service'

const salesChannelService = new SalesChannel();

export const createSaleChannel = async(req: Request, res: Response) => {
    try {
        const body: salesChannelsDTOCreate = JSON.parse(req.body.data)

        const result = await salesChannelService.create(body);

        if (req.file) {
            const image_url = await UploadService.uploadSaleChannelImage(result.id, req.file.buffer, req.file.originalname, req.file.mimetype);
            await salesChannelService.updateImage(result.id, image_url);
        }

        res.status(201).json({
            ok: true,
            error: 0,
            data: result,
            message: 'Canal de venta creado exitosamente'
        });

    } catch (error) {
        console.error('f.createSaleChannel: ', error);
        res.status(500).json({
            ok: false,
            error: 1,
            data: null,
            message: 'Error al crear el canal de venta',
            error_backend: error
        })
    }
}

export const getSalesChannelList = async(req: Request, res: Response) => {
    try {

        const result = await salesChannelService.getList();

        res.status(200).json({
            ok: true,
            error: 0,
            data: result,
            message: "canels obtenido con exito"
        })
        
    } catch (error) {
        console.error('f.getSalesChannelList: ', error);
        res.status(500).json({
            ok: false,
            error: 1,
            data: null,
            message: 'Error al obtener los conales de venta'
        })
    }
}

export const getSaleChannel = async(req: Request, res: Response) => {
    try {
        const { id_channel } = req.params

        const result = await salesChannelService.getById(Number(id_channel))

        res.status(200).json({
            ok: true,
            error: 0,
            data: result,
            message: "canal obtenido con exito"
        })
    } catch (error) {
        console.error('f.getSaleChannel: ', error);
        res.status(500).json({
            ok: false,
            error: 1,
            data: null,
            message: 'Error al obtener el conal de venta'
        })
    }
}

export const updateSaleChannel = async(req: Request, res: Response) => {
    try {
        const { id_channel } = req.params
        const body: salesChannelsDTOCreate = JSON.parse(req.body.data)

        const result = await salesChannelService.update(Number(id_channel), body)

        if (req.file) {
            const image_url = await UploadService.uploadSaleChannelImage(Number(id_channel), req.file.buffer, req.file.originalname, req.file.mimetype);
            await salesChannelService.updateImage(Number(id_channel), image_url);
        }

        res.status(200).json({
            ok: true,
            error: 0,
            data: result,
            message: "canal obtenido con exito"
        })
    } catch (error) {
        console.error('f.getSaleChannel: ', error);
        res.status(500).json({
            ok: false,
            error: 1,
            data: null,
            message: 'Error al obtener el conal de venta'
        })
    }
}

export const deleteSaleChannel = async(req: Request, res: Response) => {
    try {
        const { id_channel } = req.params

        const result = await salesChannelService.delete(Number(id_channel))

        res.status(200).json({
            ok: true,
            error: 0,
            data: result,
            message: "canal eliminado con exito"
        })
    } catch (error) {
        console.error('f.deleteSaleChannel: ', error);
        res.status(500).json({
            ok: false,
            error: 1,
            data: null,
            message: 'Error al obtener el conal de venta'
        })
    }
}
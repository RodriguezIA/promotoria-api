import {Request, Response} from 'express'

import { SalesChannel } from './channel_sales.service'
import { salesChannelsDTOCreate } from './channel_sales.dto'

const salesChannelService = new SalesChannel();

export const createSaleChannel = async(req: Request, res: Response) => {
    try {
        const body: salesChannelsDTOCreate = req.body


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
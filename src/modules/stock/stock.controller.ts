import { Request, Response } from 'express'
import { Stock } from './stock.service'

const stockService = new Stock()

export const setStockMinimum = async (req: Request, res: Response) => {
    try {
        const { id_product, id_store, i_minimum } = req.body
        const id_user_updater = req.user?.id

        const result = await stockService.setMinimum({
            id_product: Number(id_product),
            id_store: Number(id_store),
            i_minimum: Number(i_minimum),
            id_user_updater,
        })

        res.status(200).json({ ok: true, error: 0, data: result, message: 'Mínimo actualizado exitosamente' })
    } catch (error) {
        console.error('f.setStockMinimum: ', error)
        res.status(500).json({ ok: false, error: 1, data: null, message: 'Error al actualizar el mínimo' })
    }
}

export const getStockMinimumsByStore = async (req: Request, res: Response) => {
    try {
        const id_store = Number(req.params.id_store)
        const id_client = req.query.id_client ? Number(req.query.id_client) : undefined
        const result = await stockService.getMinimumsByStore(id_store, id_client)
        res.status(200).json({ ok: true, error: 0, data: result, message: 'Mínimos obtenidos exitosamente' })
    } catch (error) {
        console.error('f.getStockMinimumsByStore: ', error)
        res.status(500).json({ ok: false, error: 1, data: null, message: 'Error al obtener los mínimos' })
    }
}

export const getStockMapData = async (req: Request, res: Response) => {
    try {
        const { id_channel, id_state, id_municipio, id_client } = req.query
        const result = await stockService.getMapData({
            id_channel: id_channel ? Number(id_channel) : undefined,
            id_state: id_state ? Number(id_state) : undefined,
            id_municipio: id_municipio ? Number(id_municipio) : undefined,
            id_client: id_client ? Number(id_client) : undefined,
        })
        res.status(200).json({ ok: true, error: 0, data: result, message: 'Datos del mapa obtenidos exitosamente' })
    } catch (error) {
        console.error('f.getStockMapData: ', error)
        res.status(500).json({ ok: false, error: 1, data: null, message: 'Error al obtener los datos del mapa' })
    }
}

export const bulkAssignStockMinimum = async (req: Request, res: Response) => {
    try {
        const { id_stores, id_products, i_minimum } = req.body
        const id_user_updater = req.user?.id

        const result = await stockService.bulkAssignToStores({
            id_stores,
            id_products,
            i_minimum: Number(i_minimum),
            id_user_updater,
        })

        res.status(200).json({ ok: true, error: 0, data: result, message: 'Mínimos asignados exitosamente' })
    } catch (error) {
        console.error('f.bulkAssignStockMinimum: ', error)
        res.status(500).json({ ok: false, error: 1, data: null, message: 'Error al asignar los mínimos' })
    }
}

export const countStockMatchingStores = async (req: Request, res: Response) => {
    try {
        const { id_channels, id_state, id_municipios } = req.query
        const parseIds = (v: unknown) => Array.isArray(v) ? v.map(Number) : (v ? [Number(v)] : undefined)

        const count = await stockService.countMatchingStores({
            id_channels: parseIds(id_channels),
            id_state: id_state ? Number(id_state) : undefined,
            id_municipios: parseIds(id_municipios),
        })

        res.status(200).json({ ok: true, error: 0, data: { count }, message: 'Conteo obtenido exitosamente' })
    } catch (error) {
        console.error('f.countStockMatchingStores: ', error)
        res.status(500).json({ ok: false, error: 1, data: null, message: 'Error al contar las tiendas' })
    }
}

export const getStockMatchingStores = async (req: Request, res: Response) => {
    try {
        const { id_channels, id_state, id_municipios, id_products } = req.query
        const parseIds = (v: unknown) => Array.isArray(v) ? v.map(Number) : (v ? [Number(v)] : undefined)

        const stores = await stockService.getMatchingStores({
            id_channels: parseIds(id_channels),
            id_state: id_state ? Number(id_state) : undefined,
            id_municipios: parseIds(id_municipios),
            id_products: parseIds(id_products),
        })

        res.status(200).json({ ok: true, error: 0, data: stores, message: 'Tiendas obtenidas exitosamente' })
    } catch (error) {
        console.error('f.getStockMatchingStores: ', error)
        res.status(500).json({ ok: false, error: 1, data: null, message: 'Error al obtener las tiendas' })
    }
}

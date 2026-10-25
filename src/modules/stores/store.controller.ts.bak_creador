import { Request, Response } from 'express'

import { CreateStoreDTO } from './store.dto'
import { Store } from './store.service'


const storeService = new Store()


export const createStore = async (req: Request, res: Response) => {
    const body: CreateStoreDTO = req.body
    try {
        const store = await storeService.createStore(body)
        res.status(200).json({
            ok: true,
            error: 0,
            data: store,
            message: 'Tienda creada exitosamente'
        })
    } catch(error){
        console.error('CREATE STORE ERROR:', (error as any).message)
        res.status(500).json({
            ok: false,
            error: 1,
            data: null,
            message: 'Error al crear la tienda',
            error_backend: error
        })
    }
}

export const getStore = async (req: Request, res: Response) => {
    const { id_store } = req.params
    try {
        const store = await storeService.getStore(Number(id_store))
        res.status(200).json({
            ok: true,
            error: 0,
            data: store,
            message: 'Tienda obtenida exitosamente'
        })
    } catch (error) {
        res.status(500).json({
            ok: false,
            error: 1,
            data: null,
            message: 'Error al obtener la tienda',
            error_backend: error
        })
    }
}

export const getStores = async (req: Request, res: Response) => {
    try {
        // ?mine=1 filtra a solo las tiendas que ya son del cliente que hace
        // la peticion (las que ya aparecieron en algun pedido suyo). Sin
        // ese parametro, se sigue comportando igual que siempre: el
        // directorio completo compartido.
        const mine = req.query.mine === '1' || req.query.mine === 'true'
        const id_client = mine ? req.user?.id_client : undefined
        const stores = await storeService.getStores(id_client)
        res.status(200).json({
            ok: true,
            error: 0,
            data: stores,
            message: 'Tiendas obtenidas exitosamente'
        })
    } catch (error){
        res.status(500).json({
            ok: false,
            error: 1,
            data: null,
            message: 'Error al obtener las tiendas',
            error_backend: error
        }) 
    }
}

export const updateStore = async (req: Request, res: Response) => {
    const { id_store } = req.params
    const body: CreateStoreDTO = req.body

    try {
        const store = await storeService.updateStore(Number(id_store), body)
        res.status(200).json({
            ok: true,
            error: 0,
            data: store,
            message: 'Tienda actualizada exitosamente'
        })
    } catch (error) {
        res.status(500).json({
            ok: false,
            error: 1,
            data: null,
            message: 'Error al actualizar la tienda',
            error_backend: error
        })
    }
}

export const deleteStore = async (req: Request, res: Response) => {
    const { id_store } = req.params
    
    try {
        const store = await storeService.deleteStore(Number(id_store))
        res.status(200).json({
            ok: true,
            error: 0,
            data: store,
            message: 'Tienda eliminada exitosamente'
        })
    } catch (error) {
        res.status(500).json({
            ok: false,
            error: 1,
            data: null,
            message: 'Error al eliminar la tienda',
            error_backend: error
        })
    }
}
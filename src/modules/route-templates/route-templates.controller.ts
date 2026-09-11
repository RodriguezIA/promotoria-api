import { Request, Response } from 'express'
import { RouteTemplateService } from './route-templates.service'

const service = new RouteTemplateService()

export const createRouteTemplate = async (req: Request, res: Response) => {
    try {
        const { id_client, name, recurrence_type, recurrence_days, storeIds } = req.body
        if (!id_client || !name || !recurrence_type || !Array.isArray(storeIds) || storeIds.length === 0) {
            res.status(400).json({ ok: false, error: 1, data: null, message: 'Faltan datos: cliente, nombre, frecuencia y al menos una tienda' })
            return
        }
        const template = await service.create({
            id_client: Number(id_client),
            name: String(name).trim(),
            recurrence_type: String(recurrence_type),
            recurrence_days: recurrence_days ? String(recurrence_days) : null,
            storeIds: storeIds.map(Number),
        })
        res.status(201).json({ ok: true, error: 0, data: template, message: 'Ruta creada exitosamente' })
    } catch (error) {
        console.error('CREATE ROUTE TEMPLATE ERROR:', (error as any).message)
        res.status(500).json({ ok: false, error: 1, data: null, message: 'Error al crear la ruta' })
    }
}

export const updateRouteTemplate = async (req: Request, res: Response) => {
    try {
        const id_route_template = Number(req.params.id_route_template)
        const { name, recurrence_type, recurrence_days, storeIds } = req.body
        if (!name || !recurrence_type || !Array.isArray(storeIds) || storeIds.length === 0) {
            res.status(400).json({ ok: false, error: 1, data: null, message: 'Faltan datos: nombre, frecuencia y al menos una tienda' })
            return
        }
        const template = await service.update(id_route_template, {
            name: String(name).trim(),
            recurrence_type: String(recurrence_type),
            recurrence_days: recurrence_days ? String(recurrence_days) : null,
            storeIds: storeIds.map(Number),
        })
        res.status(200).json({ ok: true, error: 0, data: template, message: 'Ruta actualizada exitosamente' })
    } catch (error) {
        console.error('UPDATE ROUTE TEMPLATE ERROR:', (error as any).message)
        res.status(500).json({ ok: false, error: 1, data: null, message: 'Error al actualizar la ruta' })
    }
}

export const getRouteTemplates = async (req: Request, res: Response) => {
    try {
        const id_client = Number(req.query.id_client)
        if (!id_client) {
            res.status(400).json({ ok: false, error: 1, data: null, message: 'id_client es requerido' })
            return
        }
        const templates = await service.getAllByClient(id_client)
        res.status(200).json({ ok: true, error: 0, data: templates, message: 'Rutas obtenidas exitosamente' })
    } catch (error) {
        res.status(500).json({ ok: false, error: 1, data: null, message: 'Error al obtener las rutas' })
    }
}

export const getRouteTemplateById = async (req: Request, res: Response) => {
    try {
        const id_route_template = Number(req.params.id_route_template)
        const template = await service.getById(id_route_template)
        if (!template) {
            res.status(404).json({ ok: false, error: 1, data: null, message: 'Ruta no encontrada' })
            return
        }
        res.status(200).json({ ok: true, error: 0, data: template, message: 'Ruta obtenida exitosamente' })
    } catch (error) {
        res.status(500).json({ ok: false, error: 1, data: null, message: 'Error al obtener la ruta' })
    }
}

export const deleteRouteTemplate = async (req: Request, res: Response) => {
    try {
        const id_route_template = Number(req.params.id_route_template)
        await service.delete(id_route_template)
        res.status(200).json({ ok: true, error: 0, data: null, message: 'Ruta eliminada exitosamente' })
    } catch (error) {
        res.status(500).json({ ok: false, error: 1, data: null, message: 'Error al eliminar la ruta' })
    }
}

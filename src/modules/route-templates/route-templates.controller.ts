import { Request, Response } from 'express'
import { RouteTemplateService } from './route-templates.service'

const service = new RouteTemplateService()

function parseRecurrence(body: any): { ok: true; data: { recurrence_type: string; day_of_week: number | null; interval_weeks: number | null; specific_dates: string | null } } | { ok: false; message: string } {
    const { recurrence_type, day_of_week, interval_weeks, specific_dates } = body
    if (recurrence_type === 'SEMANAL') {
        if (!day_of_week || !interval_weeks) {
            return { ok: false, message: 'Selecciona el día de la semana y cada cuántas semanas se repite' }
        }
        return { ok: true, data: { recurrence_type: 'SEMANAL', day_of_week: Number(day_of_week), interval_weeks: Number(interval_weeks), specific_dates: null } }
    }
    if (recurrence_type === 'FECHAS') {
        if (!specific_dates || String(specific_dates).trim().length === 0) {
            return { ok: false, message: 'Agrega al menos una fecha' }
        }
        return { ok: true, data: { recurrence_type: 'FECHAS', day_of_week: null, interval_weeks: null, specific_dates: String(specific_dates) } }
    }
    return { ok: false, message: 'Frecuencia no válida' }
}

export const createRouteTemplate = async (req: Request, res: Response) => {
    try {
        const { id_client, name, storeIds } = req.body
        if (!id_client || !name || !Array.isArray(storeIds) || storeIds.length === 0) {
            res.status(400).json({ ok: false, error: 1, data: null, message: 'Faltan datos: cliente, nombre y al menos una tienda' })
            return
        }
        const recurrence = parseRecurrence(req.body)
        if (!recurrence.ok) {
            res.status(400).json({ ok: false, error: 1, data: null, message: recurrence.message })
            return
        }
        const template = await service.create({
            id_client: Number(id_client),
            name: String(name).trim(),
            ...recurrence.data,
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
        const { name, storeIds } = req.body
        if (!name || !Array.isArray(storeIds) || storeIds.length === 0) {
            res.status(400).json({ ok: false, error: 1, data: null, message: 'Faltan datos: nombre y al menos una tienda' })
            return
        }
        const recurrence = parseRecurrence(req.body)
        if (!recurrence.ok) {
            res.status(400).json({ ok: false, error: 1, data: null, message: recurrence.message })
            return
        }
        const template = await service.update(id_route_template, {
            name: String(name).trim(),
            ...recurrence.data,
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

export const estimateRouteSales = async (req: Request, res: Response) => {
    try {
        const { storeIds } = req.body
        if (!Array.isArray(storeIds) || storeIds.length === 0) {
            res.status(400).json({ ok: false, error: 1, data: null, message: 'Se requiere al menos una tienda' })
            return
        }
        const estimate = await service.estimateSales(storeIds.map(Number))
        res.status(200).json({ ok: true, error: 0, data: estimate, message: 'Estimación calculada exitosamente' })
    } catch (error) {
        console.error('ESTIMATE ROUTE SALES ERROR:', (error as any).message)
        res.status(500).json({ ok: false, error: 1, data: null, message: 'Error al calcular la estimación' })
    }
}

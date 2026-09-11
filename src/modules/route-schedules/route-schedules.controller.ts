import { Request, Response } from 'express'
import { RouteScheduleService } from './route-schedules.service'

const service = new RouteScheduleService()

export const createRouteSchedule = async (req: Request, res: Response) => {
    try {
        const { id_client, id_route_template, id_driver, day_of_week, interval_weeks, anchor_date } = req.body
        if (!id_client || !id_route_template || !id_driver || !day_of_week || !interval_weeks || !anchor_date) {
            res.status(400).json({ ok: false, error: 1, data: null, message: 'Faltan datos para crear la asignación automática' })
            return
        }
        const schedule = await service.create({
            id_client: Number(id_client),
            id_route_template: Number(id_route_template),
            id_driver: Number(id_driver),
            day_of_week: Number(day_of_week),
            interval_weeks: Number(interval_weeks),
            anchor_date: new Date(anchor_date),
        })
        res.status(201).json({ ok: true, error: 0, data: schedule, message: 'Asignación automática creada exitosamente' })
    } catch (error) {
        console.error('CREATE ROUTE SCHEDULE ERROR:', (error as any).message)
        res.status(500).json({ ok: false, error: 1, data: null, message: 'Error al crear la asignación automática' })
    }
}

export const getRouteSchedules = async (req: Request, res: Response) => {
    try {
        const id_client = Number(req.query.id_client)
        if (!id_client) {
            res.status(400).json({ ok: false, error: 1, data: null, message: 'id_client es requerido' })
            return
        }
        const schedules = await service.getAllByClient(id_client)
        res.status(200).json({ ok: true, error: 0, data: schedules, message: 'Asignaciones obtenidas exitosamente' })
    } catch (error) {
        res.status(500).json({ ok: false, error: 1, data: null, message: 'Error al obtener las asignaciones' })
    }
}

export const deleteRouteSchedule = async (req: Request, res: Response) => {
    try {
        const id_schedule = Number(req.params.id_schedule)
        await service.delete(id_schedule)
        res.status(200).json({ ok: true, error: 0, data: null, message: 'Asignación automática eliminada exitosamente' })
    } catch (error) {
        res.status(500).json({ ok: false, error: 1, data: null, message: 'Error al eliminar la asignación' })
    }
}

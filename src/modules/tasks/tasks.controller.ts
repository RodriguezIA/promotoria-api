import { Request, Response } from 'express'

import { Task } from './tasks.service'
import { CreateTaskDTO, UpdateTaskDTO } from './tasks.dtos'
import { TASK_STATUS } from '../../core/constants/status.constants'

const taskService = new Task()

export const assignPromoterToTask = async (req: Request, res: Response) => {
    const { id_task } = req.params
    const { id_promoter } = req.body
    if (!id_promoter) {
        res.status(400).json({ ok: false, error: 1, data: null, message: 'id_promoter es requerido' })
        return
    }
    try {
        const task = await taskService.assignPromoter(Number(id_task), Number(id_promoter))
        res.status(200).json({ ok: true, error: 0, data: task, message: 'Promotor asignado exitosamente' })
    } catch (error) {
        res.status(500).json({ ok: false, error: 1, data: null, message: (error as any).message || 'Error al asignar promotor' })
    }
}

export const createTask = async (req: Request, res: Response) => {
    const body: CreateTaskDTO = req.body
    try {
        const task = await taskService.create(body)
        res.status(200).json({
            ok: true, error: 0, data: task,
            message: 'Tarea creada exitosamente'
        })
    } catch (error) {
        res.status(500).json({
            ok: false, error: 1, data: null,
            message: 'Error al crear la tarea',
            error_backend: (error as any).message
        })
    }
}

export const getTaskById = async (req: Request, res: Response) => {
    const { id_task } = req.params
    try {
        const task = await taskService.getById(Number(id_task))
        if (!task) return res.status(404).json({ ok: false, error: 1, data: null, message: 'Tarea no encontrada' })
        res.status(200).json({ ok: true, error: 0, data: task, message: 'Tarea obtenida exitosamente' })
    } catch (error) {
        res.status(500).json({ ok: false, error: 1, data: null, message: 'Error al obtener la tarea', error_backend: (error as any).message })
    }
}

export const getTasks = async (req: Request, res: Response) => {
    try {
        const { id_client, id_order, id_promoter, id_status, id_request, dt_from, dt_to, page, limit } = req.query
        const result = await taskService.getAll({
            id_client: id_client ? Number(id_client) : undefined,
            id_order: id_order ? Number(id_order) : undefined,
            id_promoter: id_promoter !== undefined ? Number(id_promoter) : undefined,
            id_status: id_status !== undefined ? Number(id_status) : undefined,
            id_request: id_request ? Number(id_request) : undefined,
            dt_from: dt_from ? String(dt_from) : undefined,
            dt_to: dt_to ? String(dt_to) : undefined,
            page: page ? Number(page) : undefined,
            limit: limit ? Number(limit) : undefined,
        })
        res.status(200).json({ ok: true, error: 0, data: result, message: 'Tareas obtenidas exitosamente' })
    } catch (error) {
        res.status(500).json({ ok: false, error: 1, data: null, message: 'Error al obtener las tareas', error_backend: (error as any).message })
    }
}

export const getMyTasks = async (req: Request, res: Response) => {
    try {
        const id_promoter = req.user!.id
        const { id_status } = req.query
        const tasks = await taskService.getTasksByPromoter(
            id_promoter,
            id_status !== undefined ? Number(id_status) : undefined
        )
        res.status(200).json({ ok: true, error: 0, data: tasks, message: 'Tareas del promotor obtenidas exitosamente' })
    } catch (error) {
        res.status(500).json({ ok: false, error: 1, data: null, message: 'Error al obtener las tareas', error_backend: (error as any).message })
    }
}

export const forceNotifyTask = async (req: Request, res: Response) => {
    try {
        const { id_task, folio } = req.body

        const task = await taskService.findByIdOrFolio(id_task, folio)
        if (!task) {
            return res.status(404).json({ ok: false, error: 1, data: null, message: 'Tarea no encontrada' })
        }

        if (task.id_status !== TASK_STATUS.CREADO) {
            return res.status(409).json({
                ok: false,
                error: 1,
                data: null,
                message: `La tarea no está disponible para notificar (estatus actual: ${task.id_status}, id_promoter: ${task.id_promoter ?? 'ninguno'}).`,
            })
        }

        await taskService.forceNotify(task)

        res.status(200).json({
            ok: true,
            error: 0,
            data: { id_task: task.id_task, vc_folio: task.vc_folio, cycle: task.i_current_cycle },
            message: 'Notificación forzada encolada exitosamente',
        })
    } catch (error) {
        console.error('f.forceNotifyTask: ', error)
        res.status(500).json({ ok: false, error: 1, data: null, message: 'Error al forzar la notificación', error_backend: (error as any).message })
    }
}

export const getMyTaskHistory = async (req: Request, res: Response) => {
    try {
        const id_promoter = req.user!.id
        const { reason } = req.query
        const validReason = reason === 'rejected' || reason === 'timeout' ? reason : undefined
        const history = await taskService.getPromoterTaskHistory(id_promoter, validReason)
        res.status(200).json({ ok: true, error: 0, data: history, message: 'Historial de tareas obtenido exitosamente' })
    } catch (error) {
        res.status(500).json({ ok: false, error: 1, data: null, message: 'Error al obtener el historial de tareas', error_backend: (error as any).message })
    }
}

export const updateTask = async (req: Request, res: Response) => {
    const { id_task } = req.params
    try {
        const task = await taskService.update(Number(id_task), req.body as UpdateTaskDTO)
        res.status(200).json({ ok: true, error: 0, data: task, message: 'Tarea actualizada exitosamente' })
    } catch (error) {
        res.status(500).json({ ok: false, error: 1, data: null, message: 'Error al actualizar la tarea', error_backend: (error as any).message })
    }
}

export const deleteTask = async (req: Request, res: Response) => {
    const { id_task } = req.params
    try {
        await taskService.delete(Number(id_task))
        res.status(200).json({ ok: true, error: 0, data: null, message: 'Tarea eliminada exitosamente' })
    } catch (error) {
        res.status(500).json({ ok: false, error: 1, data: null, message: 'Error al eliminar la tarea', error_backend: (error as any).message })
    }
}

export const acceptTask = async (req: Request, res: Response) => {
    const { id_task } = req.params
    const id_promoter = req.user!.id
    try {
        const task = await taskService.acceptTask(Number(id_task), id_promoter)
        res.status(200).json({ ok: true, error: 0, data: task, message: 'Tarea aceptada exitosamente' })
    } catch (error) {
        const msg = (error as any).message
        const status = msg.includes('no esta activa') || msg.includes('ya tiene') || msg.includes('ya rechazo') ? 400 : 500
        res.status(status).json({ ok: false, error: 1, data: null, message: msg, error_backend: msg })
    }
}

export const rejectTask = async (req: Request, res: Response) => {
    const { id_task } = req.params
    const id_promoter = req.user!.id
    try {
        const rejection = await taskService.rejectTask(Number(id_task), id_promoter)
        res.status(200).json({ ok: true, error: 0, data: rejection, message: 'Tarea rechazada exitosamente' })
    } catch (error) {
        const msg = (error as any).message
        const status = msg.includes('no esta disponible') || msg.includes('ya fue aceptada') ? 400 : 500
        res.status(status).json({ ok: false, error: 1, data: null, message: msg, error_backend: msg })
    }
}

export const approveTask = async (req: Request, res: Response) => {
    const { id_task } = req.params
    try {
        const task = await taskService.reviewApprove(Number(id_task))
        res.status(200).json({ ok: true, error: 0, data: task, message: 'Tarea aprobada exitosamente' })
    } catch (error) {
        const msg = (error as any).message
        const status = msg.includes('Solo se puede') || msg.includes('no encontrada') ? 400 : 500
        res.status(status).json({ ok: false, error: 1, data: null, message: msg, error_backend: msg })
    }
}

export const cancelTask = async (req: Request, res: Response) => {
    const { id_task } = req.params
    const { comment } = req.body
    try {
        const task = await taskService.reviewCancel(Number(id_task), comment)
        res.status(200).json({ ok: true, error: 0, data: task, message: 'Tarea cancelada exitosamente' })
    } catch (error) {
        const msg = (error as any).message
        const status = msg.includes('Solo se puede') || msg.includes('no encontrada') ? 400 : 500
        res.status(status).json({ ok: false, error: 1, data: null, message: msg, error_backend: msg })
    }
}

export const getTaskChecklist = async (req: Request, res: Response) => {
    const { id_task } = req.params
    try {
        const task = await taskService.getTaskChecklist(Number(id_task))
        if (!task) return res.status(404).json({ ok: false, error: 1, data: null, message: 'Tarea no encontrada' })
        res.status(200).json({ ok: true, error: 0, data: task, message: 'Checklist de tarea obtenido exitosamente' })
    } catch (error) {
        res.status(500).json({ ok: false, error: 1, data: null, message: 'Error al obtener el checklist', error_backend: (error as any).message })
    }
}

export const answerTaskQuestions = async (req: Request, res: Response) => {
    const { id_task } = req.params
    const id_promoter = req.user!.id

    let parsed: { id_request_product_question: number; vc_answer?: string | null }[] = []
    const rawAnswers = req.body.answers
    if (rawAnswers !== undefined && rawAnswers !== null && rawAnswers !== '' && rawAnswers !== '[]') {
        try {
            parsed = JSON.parse(rawAnswers)
        } catch {
            return res.status(400).json({ ok: false, error: 1, data: null, message: 'answers debe ser un JSON valido' })
        }
        if (!Array.isArray(parsed)) {
            return res.status(400).json({ ok: false, error: 1, data: null, message: 'answers debe ser un arreglo' })
        }
    }

    const files = req.files as Express.Multer.File[] | undefined
    let arrangementPhoto: { buffer: Buffer; mime: string } | undefined
    const images = new Map<number, { buffer: Buffer; mime: string }>()

    if (files && files.length > 0) {
        for (const file of files) {
            if (file.fieldname === 'arrangement_photo') {
                arrangementPhoto = { buffer: file.buffer, mime: file.mimetype }
                continue
            }
            const match = file.fieldname.match(/^image_(\d+)$/)
            if (match) {
                const rpqId = Number(match[1])
                images.set(rpqId, { buffer: file.buffer, mime: file.mimetype })
            }
        }
    }

    if (parsed.length === 0 && !arrangementPhoto && images.size === 0) {
        return res.status(400).json({ ok: false, error: 1, data: null, message: 'Debes enviar respuestas o al menos una imagen' })
    }

    try {
        const answers = parsed.map(a => ({
            id_request_product_question: a.id_request_product_question,
            vc_answer: a.vc_answer ?? null,
        }))

        const { answers: results, arrangement_photo_url } = await taskService.answerTaskQuestions(
            Number(id_task), id_promoter, answers, images, arrangementPhoto
        )

        res.status(200).json({
            ok: true, error: 0, data: { answers: results, arrangement_photo_url },
            message: `${results.length} respuesta(s) guardada(s) exitosamente`
        })
    } catch (error) {
        const msg = (error as any).message
        const status = msg.includes('No tienes asignada') ? 403 : 500
        res.status(status).json({ ok: false, error: 1, data: null, message: msg, error_backend: msg })
    }
}

export const completeTask = async (req: Request, res: Response) => {
    const { id_task } = req.params
    const id_promoter = req.user!.id
    try {
        const task = await taskService.completeTask(Number(id_task), id_promoter)
        res.status(200).json({ ok: true, error: 0, data: task, message: 'Tarea completada exitosamente' })
    } catch (error) {
        const msg = (error as any).message
        const status = msg.includes('No tienes asignada') ? 403 : 500
        res.status(status).json({ ok: false, error: 1, data: null, message: msg, error_backend: msg })
    }
}

export const getNearbyTasks = async (req: Request, res: Response) => {
    const id_promoter = req.user!.id
    const lat = parseFloat(req.query.lat as string)
    const lng = parseFloat(req.query.lng as string)

    if (isNaN(lat) || isNaN(lng)) {
        res.status(400).json({ ok: false, error: 1, data: null, message: 'lat y lng son requeridos y deben ser números válidos' })
        return
    }

    try {
        const tasks = await taskService.getNearbyAvailableTasks(id_promoter, lat, lng)
        res.status(200).json({ ok: true, error: 0, data: tasks, message: `${tasks.length} tarea(s) disponibles cerca de ti` })
    } catch (error) {
        res.status(500).json({ ok: false, error: 1, data: null, message: 'Error al buscar tareas cercanas', error_backend: (error as any).message })
    }
}

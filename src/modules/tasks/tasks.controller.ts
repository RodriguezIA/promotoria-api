import { Request, Response } from 'express'

import { Task } from './tasks.service'
import { CreateTaskDTO, UpdateTaskDTO, AnswerTaskQuestionDTO } from './tasks.dtos'
import { UploadService } from '../../services/upload.service'

const taskService = new Task()

export const createTask = async (req: Request, res: Response) => {
    const body: CreateTaskDTO = req.body
    try {
        const task = await taskService.create(body)
        res.status(200).json({
            ok: true, error: 0, data: task,
            message: 'Tarea creada exitosamente'
        })
    } catch (error) {
        console.error('CREATE TASK ERROR:', (error as any).message)
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
        if (!task) {
            return res.status(404).json({
                ok: false, error: 1, data: null,
                message: 'Tarea no encontrada'
            })
        }
        res.status(200).json({
            ok: true, error: 0, data: task,
            message: 'Tarea obtenida exitosamente'
        })
    } catch (error) {
        res.status(500).json({
            ok: false, error: 1, data: null,
            message: 'Error al obtener la tarea',
            error_backend: (error as any).message
        })
    }
}

export const getTasks = async (req: Request, res: Response) => {
    try {
        const { id_client, id_order, id_promoter, id_status } = req.query
        const tasks = await taskService.getAll({
            id_client: id_client ? Number(id_client) : undefined,
            id_order: id_order ? Number(id_order) : undefined,
            id_promoter: id_promoter !== undefined ? Number(id_promoter) : undefined,
            id_status: id_status !== undefined ? Number(id_status) : undefined,
        })
        res.status(200).json({
            ok: true, error: 0, data: tasks,
            message: 'Tareas obtenidas exitosamente'
        })
    } catch (error) {
        res.status(500).json({
            ok: false, error: 1, data: null,
            message: 'Error al obtener las tareas',
            error_backend: (error as any).message
        })
    }
}

export const updateTask = async (req: Request, res: Response) => {
    const { id_task } = req.params
    const body: UpdateTaskDTO = req.body
    try {
        const task = await taskService.update(Number(id_task), body)
        res.status(200).json({
            ok: true, error: 0, data: task,
            message: 'Tarea actualizada exitosamente'
        })
    } catch (error) {
        res.status(500).json({
            ok: false, error: 1, data: null,
            message: 'Error al actualizar la tarea',
            error_backend: (error as any).message
        })
    }
}

export const deleteTask = async (req: Request, res: Response) => {
    const { id_task } = req.params
    try {
        await taskService.delete(Number(id_task))
        res.status(200).json({
            ok: true, error: 0, data: null,
            message: 'Tarea eliminada exitosamente'
        })
    } catch (error) {
        res.status(500).json({
            ok: false, error: 1, data: null,
            message: 'Error al eliminar la tarea',
            error_backend: (error as any).message
        })
    }
}

export const acceptTask = async (req: Request, res: Response) => {
    const { id_task } = req.params
    const id_promoter = req.user!.id
    try {
        const task = await taskService.acceptTask(Number(id_task), id_promoter)
        res.status(200).json({
            ok: true, error: 0, data: task,
            message: 'Tarea aceptada exitosamente'
        })
    } catch (error) {
        const message = (error as any).message
        const status = message.includes('no está activa') || message.includes('ya tiene') || message.includes('ya rechazó')
            ? 400 : 500
        res.status(status).json({
            ok: false, error: 1, data: null,
            message,
            error_backend: message
        })
    }
}

export const rejectTask = async (req: Request, res: Response) => {
    const { id_task } = req.params
    const id_promoter = req.user!.id
    try {
        const rejection = await taskService.rejectTask(Number(id_task), id_promoter)
        res.status(200).json({
            ok: true, error: 0, data: rejection,
            message: 'Tarea rechazada exitosamente'
        })
    } catch (error) {
        const message = (error as any).message
        const status = message.includes('no está disponible') || message.includes('ya fue aceptada') ? 400 : 500
        res.status(status).json({
            ok: false, error: 1, data: null,
            message,
            error_backend: message
        })
    }
}

export const getTaskChecklist = async (req: Request, res: Response) => {
    const { id_task } = req.params
    try {
        const task = await taskService.getTaskChecklist(Number(id_task))
        if (!task) {
            return res.status(404).json({
                ok: false, error: 1, data: null,
                message: 'Tarea no encontrada'
            })
        }
        res.status(200).json({
            ok: true, error: 0, data: task,
            message: 'Checklist de tarea obtenido exitosamente'
        })
    } catch (error) {
        res.status(500).json({
            ok: false, error: 1, data: null,
            message: 'Error al obtener el checklist',
            error_backend: (error as any).message
        })
    }
}

export const answerTaskQuestion = async (req: Request, res: Response) => {
    const { id_task } = req.params
    const id_promoter = req.user!.id
    const { id_request_product_question, vc_answer } = req.body as AnswerTaskQuestionDTO

    if (!id_request_product_question) {
        return res.status(400).json({
            ok: false, error: 1, data: null,
            message: 'id_request_product_question es requerido'
        })
    }

    try {
        let vc_image_url: string | undefined

        if (req.file) {
            vc_image_url = await UploadService.uploadTaskAnswerImage(
                Number(id_task),
                id_request_product_question,
                req.file.buffer
            )
        }

        const answer = await taskService.answerTaskQuestion(
            Number(id_task),
            id_promoter,
            id_request_product_question,
            vc_answer,
            vc_image_url
        )

        res.status(200).json({
            ok: true, error: 0, data: answer,
            message: 'Respuesta guardada exitosamente'
        })
    } catch (error) {
        const message = (error as any).message
        const status = message.includes('No tienes asignada') ? 403 : 500
        res.status(status).json({
            ok: false, error: 1, data: null,
            message,
            error_backend: message
        })
    }
}

export const completeTask = async (req: Request, res: Response) => {
    const { id_task } = req.params
    const id_promoter = req.user!.id
    try {
        const task = await taskService.completeTask(Number(id_task), id_promoter)
        res.status(200).json({
            ok: true, error: 0, data: task,
            message: 'Tarea completada exitosamente'
        })
    } catch (error) {
        const message = (error as any).message
        const status = message.includes('No tienes asignada') ? 403 : 500
        res.status(status).json({
            ok: false, error: 1, data: null,
            message,
            error_backend: message
        })
    }
}

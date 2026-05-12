import { Router } from 'express'

import { authMiddleware } from '../../core/middleware'
import { uploadAny } from '../../core/middleware/upload.middleware'
import {
    createTask,
    getMyTasks,
    getTaskById,
    getTasks,
    updateTask,
    deleteTask,
    acceptTask,
    rejectTask,
    getTaskChecklist,
    answerTaskQuestions,
    completeTask,
} from './tasks.controller'

const taskRouter = Router()

// Mobile/Promotor: mis tareas (debe ir antes de /:id_task)
taskRouter.get('/my', authMiddleware, getMyTasks)

// Admin: CRUD
taskRouter.post('/', authMiddleware, createTask)
taskRouter.get('/', authMiddleware, getTasks)
taskRouter.get('/:id_task', authMiddleware, getTaskById)
taskRouter.put('/:id_task', authMiddleware, updateTask)
taskRouter.delete('/:id_task', authMiddleware, deleteTask)

// Mobile/Promotor: acciones sobre tarea
taskRouter.post('/:id_task/accept', authMiddleware, acceptTask)
taskRouter.post('/:id_task/reject', authMiddleware, rejectTask)
taskRouter.get('/:id_task/checklist', authMiddleware, getTaskChecklist)

// Batch: enviar todas las respuestas del checklist con imagenes opcionales
taskRouter.post('/:id_task/answers', authMiddleware, uploadAny.any(), answerTaskQuestions)

taskRouter.post('/:id_task/complete', authMiddleware, completeTask)

export default taskRouter

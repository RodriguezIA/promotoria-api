import { Router } from 'express'

import { authMiddleware } from '../../core/middleware'
import { upload } from '../../core/middleware/upload.middleware'
import {
    createTask,
    getTaskById,
    getTasks,
    updateTask,
    deleteTask,
    acceptTask,
    rejectTask,
    getTaskChecklist,
    answerTaskQuestion,
    completeTask,
} from './tasks.controller'

const taskRouter = Router()

// Admin: CRUD de tareas
taskRouter.post('/', authMiddleware, createTask)
taskRouter.get('/', authMiddleware, getTasks)
taskRouter.get('/:id_task', authMiddleware, getTaskById)
taskRouter.put('/:id_task', authMiddleware, updateTask)
taskRouter.delete('/:id_task', authMiddleware, deleteTask)

// Mobile/Promotor: aceptar, rechazar, checklist, contestar
taskRouter.post('/:id_task/accept', authMiddleware, acceptTask)
taskRouter.post('/:id_task/reject', authMiddleware, rejectTask)
taskRouter.get('/:id_task/checklist', authMiddleware, getTaskChecklist)
taskRouter.post('/:id_task/answers', authMiddleware, upload.single('image'), answerTaskQuestion)
taskRouter.post('/:id_task/complete', authMiddleware, completeTask)

export default taskRouter

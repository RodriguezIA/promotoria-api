import { Router } from 'express'
import { authMiddleware, requireRole, uploadVideo } from '../../core/middleware'
import { ROLES } from '../../core/constants/status.constants'
import { getLoginVideo, uploadLoginVideo, removeLoginVideo, getTaskInstructions, setTaskInstructions } from './app-config.controller'

const appConfigRouter = Router()

// Público: la app la consulta antes de iniciar sesión
appConfigRouter.get('/login-video', getLoginVideo)

// Solo master puede subir/quitar el video
appConfigRouter.post('/login-video', authMiddleware, requireRole(ROLES.SUPER), uploadVideo.single('video'), uploadLoginVideo)
appConfigRouter.delete('/login-video', authMiddleware, requireRole(ROLES.SUPER), removeLoginVideo)

// Mensaje de instrucciones que ve el promotor al aceptar una tarea —
// publico para que la app lo consulte, solo el master lo puede editar.
appConfigRouter.get('/task-instructions', getTaskInstructions)
appConfigRouter.put('/task-instructions', authMiddleware, requireRole(ROLES.SUPER), setTaskInstructions)

export default appConfigRouter

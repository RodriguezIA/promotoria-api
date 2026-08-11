import { Router } from 'express'
import { authMiddleware, requireRole, uploadVideo } from '../../core/middleware'
import { ROLES } from '../../core/constants/status.constants'
import { getLoginVideo, uploadLoginVideo, removeLoginVideo } from './app-config.controller'

const appConfigRouter = Router()

// Público: la app la consulta antes de iniciar sesión
appConfigRouter.get('/login-video', getLoginVideo)

// Solo master puede subir/quitar el video
appConfigRouter.post('/login-video', authMiddleware, requireRole(ROLES.SUPER), uploadVideo.single('video'), uploadLoginVideo)
appConfigRouter.delete('/login-video', authMiddleware, requireRole(ROLES.SUPER), removeLoginVideo)

export default appConfigRouter

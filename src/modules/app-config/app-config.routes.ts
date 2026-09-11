import { Router } from 'express'
import { authMiddleware, requireRole, uploadVideo } from '../../core/middleware'
import { ROLES } from '../../core/constants/status.constants'
import { getLoginVideo, uploadLoginVideo, removeLoginVideo, getTaskInstructions, setTaskInstructions, getWhatsappSoporteClientes, setWhatsappSoporteClientes, getWhatsappSoportePromotores, setWhatsappSoportePromotores, getReferralShareMessage, setReferralShareMessage } from './app-config.controller'

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

// WhatsApp de soporte a clientes (boton "Contactar Soporte" en Mi Negocio)
// y a promotores (login sin cuenta encontrada) — publicos para consulta,
// solo el master los edita.
appConfigRouter.get('/whatsapp-soporte-clientes', getWhatsappSoporteClientes)
appConfigRouter.put('/whatsapp-soporte-clientes', authMiddleware, requireRole(ROLES.SUPER), setWhatsappSoporteClientes)
appConfigRouter.get('/whatsapp-soporte-promotores', getWhatsappSoportePromotores)
appConfigRouter.put('/whatsapp-soporte-promotores', authMiddleware, requireRole(ROLES.SUPER), setWhatsappSoportePromotores)

// Mensaje que la app manda al compartir el link de invitacion de un
// promotor. Usa {link} como marcador de posicion.
appConfigRouter.get('/referral-share-message', getReferralShareMessage)
appConfigRouter.put('/referral-share-message', authMiddleware, requireRole(ROLES.SUPER), setReferralShareMessage)

export default appConfigRouter

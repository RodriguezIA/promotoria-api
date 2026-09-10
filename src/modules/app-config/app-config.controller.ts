import { Request, Response } from 'express'
import { AppConfigService } from './app-config.service'

const appConfigService = new AppConfigService()

export const getLoginVideo = async (req: Request, res: Response) => {
    try {
        const data = await appConfigService.getLoginVideo()
        res.status(200).json({ ok: true, error: 0, data, message: 'Configuración obtenida exitosamente' })
    } catch (error) {
        console.error('GET LOGIN VIDEO ERROR:', (error as any).message)
        res.status(500).json({ ok: false, error: 1, data: null, message: 'Error al obtener la configuración', error_backend: error })
    }
}

export const uploadLoginVideo = async (req: Request, res: Response) => {
    try {
        if (!req.file) {
            res.status(400).json({ ok: false, error: 1, data: null, message: 'No se recibió ningún archivo de video' })
            return
        }
        const data = await appConfigService.uploadLoginVideo(
            req.file.buffer,
            req.file.mimetype,
            req.file.originalname,
            req.user!.id
        )
        res.status(200).json({ ok: true, error: 0, data, message: 'Video actualizado exitosamente' })
    } catch (error) {
        console.error('UPLOAD LOGIN VIDEO ERROR:', (error as any).message)
        res.status(500).json({ ok: false, error: 1, data: null, message: 'Error al subir el video', error_backend: error })
    }
}

export const removeLoginVideo = async (req: Request, res: Response) => {
    try {
        const data = await appConfigService.removeLoginVideo()
        res.status(200).json({ ok: true, error: 0, data, message: 'Video eliminado exitosamente' })
    } catch (error) {
        console.error('REMOVE LOGIN VIDEO ERROR:', (error as any).message)
        res.status(500).json({ ok: false, error: 1, data: null, message: 'Error al eliminar el video', error_backend: error })
    }
}

const TASK_INSTRUCTIONS_DEFAULT = 'Ve a {tienda} y acomoda su exhibidor como se indica. Si tiene preventa activada, recuerda levantar el pedido con el dueño.'

export const getTaskInstructions = async (req: Request, res: Response) => {
    try {
        const data = await appConfigService.getSetting('task_instructions_message', TASK_INSTRUCTIONS_DEFAULT)
        res.status(200).json({ ok: true, error: 0, data, message: 'Configuración obtenida exitosamente' })
    } catch (error) {
        res.status(500).json({ ok: false, error: 1, data: null, message: 'Error al obtener la configuración' })
    }
}

export const setTaskInstructions = async (req: Request, res: Response) => {
    try {
        const value = String(req.body.value || '').trim()
        if (!value) {
            res.status(400).json({ ok: false, error: 1, data: null, message: 'El texto es requerido' })
            return
        }
        const data = await appConfigService.setSetting('task_instructions_message', value)
        res.status(200).json({ ok: true, error: 0, data, message: 'Texto actualizado exitosamente' })
    } catch (error) {
        res.status(500).json({ ok: false, error: 1, data: null, message: 'Error al actualizar el texto' })
    }
}

const WHATSAPP_SOPORTE_CLIENTES_DEFAULT = ''
const WHATSAPP_SOPORTE_PROMOTORES_DEFAULT = '5218117105018'

export const getWhatsappSoporteClientes = async (req: Request, res: Response) => {
    try {
        const data = await appConfigService.getSetting('whatsapp_soporte_clientes', WHATSAPP_SOPORTE_CLIENTES_DEFAULT)
        res.status(200).json({ ok: true, error: 0, data, message: 'Configuración obtenida exitosamente' })
    } catch (error) {
        res.status(500).json({ ok: false, error: 1, data: null, message: 'Error al obtener la configuración' })
    }
}

export const setWhatsappSoporteClientes = async (req: Request, res: Response) => {
    try {
        const value = String(req.body.value || '').trim()
        const data = await appConfigService.setSetting('whatsapp_soporte_clientes', value)
        res.status(200).json({ ok: true, error: 0, data, message: 'Número actualizado exitosamente' })
    } catch (error) {
        res.status(500).json({ ok: false, error: 1, data: null, message: 'Error al actualizar el número' })
    }
}

export const getWhatsappSoportePromotores = async (req: Request, res: Response) => {
    try {
        const data = await appConfigService.getSetting('whatsapp_soporte_promotores', WHATSAPP_SOPORTE_PROMOTORES_DEFAULT)
        res.status(200).json({ ok: true, error: 0, data, message: 'Configuración obtenida exitosamente' })
    } catch (error) {
        res.status(500).json({ ok: false, error: 1, data: null, message: 'Error al obtener la configuración' })
    }
}

export const setWhatsappSoportePromotores = async (req: Request, res: Response) => {
    try {
        const value = String(req.body.value || '').trim()
        const data = await appConfigService.setSetting('whatsapp_soporte_promotores', value)
        res.status(200).json({ ok: true, error: 0, data, message: 'Número actualizado exitosamente' })
    } catch (error) {
        res.status(500).json({ ok: false, error: 1, data: null, message: 'Error al actualizar el número' })
    }
}

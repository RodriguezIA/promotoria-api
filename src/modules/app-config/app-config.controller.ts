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

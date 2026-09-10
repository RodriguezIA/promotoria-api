import { Request, Response } from 'express'
import { TaskSettings } from './task-settings.service'

const taskSettingsService = new TaskSettings()

export const getTaskSettings = async (req: Request, res: Response) => {
    try {
        const settings = await taskSettingsService.get()
        res.status(200).json({ ok: true, error: 0, data: settings, message: 'Configuración obtenida exitosamente' })
    } catch (error) {
        console.error('GET TASK SETTINGS ERROR:', (error as any).message)
        res.status(500).json({ ok: false, error: 1, data: null, message: 'Error al obtener la configuración', error_backend: error })
    }
}

export const updateTaskSettings = async (req: Request, res: Response) => {
    try {
        const { i_review_timeout_hours, i_order_auto_close_hours } = req.body
        const updated = await taskSettingsService.update({ i_review_timeout_hours, i_order_auto_close_hours }, req.user!.id)
        res.status(200).json({ ok: true, error: 0, data: updated, message: 'Configuración actualizada exitosamente' })
    } catch (error) {
        console.error('UPDATE TASK SETTINGS ERROR:', (error as any).message)
        res.status(500).json({ ok: false, error: 1, data: null, message: 'Error al actualizar la configuración', error_backend: error })
    }
}

export const updatePreorderPricing = async (req: Request, res: Response) => {
    try {
        const { pricing_type, pricing_value } = req.body
        const updated = await taskSettingsService.updatePreorderPricing({
            pricing_type,
            pricing_value: Number(pricing_value),
            id_user_updater: req.user!.id,
        })
        res.status(200).json({ ok: true, error: 0, data: updated, message: 'Precio de Prepedido actualizado exitosamente' })
    } catch (error) {
        console.error('UPDATE PREORDER PRICING ERROR:', (error as any).message)
        res.status(500).json({ ok: false, error: 1, data: null, message: 'Error al actualizar el precio de Prepedido', error_backend: error })
    }
}

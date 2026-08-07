import { Request, Response } from 'express'
import { FinanceSettings } from './finance-settings.service'

const financeSettingsService = new FinanceSettings()

export const getFinanceSettings = async (req: Request, res: Response) => {
    try {
        const settings = await financeSettingsService.get()
        res.status(200).json({
            ok: true,
            error: 0,
            data: {
                f_promoter_commission_percentage: Number(settings.f_promoter_commission_percentage),
                f_activator_commission_percentage: Number(settings.f_activator_commission_percentage),
            },
            message: 'Configuración de finanzas obtenida exitosamente'
        })
    } catch (error) {
        console.error('GET FINANCE SETTINGS ERROR:', (error as any).message)
        res.status(500).json({
            ok: false,
            error: 1,
            data: null,
            message: 'Error al obtener la configuración de finanzas',
            error_backend: error
        })
    }
}

export const updateFinanceSettings = async (req: Request, res: Response) => {
    try {
        const { f_promoter_commission_percentage, f_activator_commission_percentage } = req.body
        const id_user_updater = req.user!.id
        const settings = await financeSettingsService.update(
            { f_promoter_commission_percentage, f_activator_commission_percentage },
            id_user_updater
        )
        res.status(200).json({
            ok: true,
            error: 0,
            data: {
                f_promoter_commission_percentage: Number(settings.f_promoter_commission_percentage),
                f_activator_commission_percentage: Number(settings.f_activator_commission_percentage),
            },
            message: 'Configuración de finanzas actualizada exitosamente'
        })
    } catch (error) {
        console.error('UPDATE FINANCE SETTINGS ERROR:', (error as any).message)
        res.status(500).json({
            ok: false,
            error: 1,
            data: null,
            message: 'Error al actualizar la configuración de finanzas',
            error_backend: error
        })
    }
}

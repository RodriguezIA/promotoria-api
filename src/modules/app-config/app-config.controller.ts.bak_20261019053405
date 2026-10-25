import { Request, Response } from 'express'
import { Request as RequestService } from '../requests/requests.service'
import { AppConfigService } from './app-config.service'

const appConfigService = new AppConfigService()
const requestsService = new RequestService()

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

const REFERRAL_SHARE_MESSAGE_DEFAULT = 'Te invito a ganar dinero extra como promotor con Promotoria Digital 💰\n\nDescarga la app y regístrate desde este link, tu código de invitación ya viene incluido:\n{link}'

export const getReferralShareMessage = async (req: Request, res: Response) => {
    try {
        const data = await appConfigService.getSetting('referral_share_message', REFERRAL_SHARE_MESSAGE_DEFAULT)
        res.status(200).json({ ok: true, error: 0, data, message: 'Configuración obtenida exitosamente' })
    } catch (error) {
        res.status(500).json({ ok: false, error: 1, data: null, message: 'Error al obtener la configuración' })
    }
}

export const setReferralShareMessage = async (req: Request, res: Response) => {
    try {
        const value = String(req.body.value || '').trim()
        if (!value) {
            res.status(400).json({ ok: false, error: 1, data: null, message: 'El texto es requerido' })
            return
        }
        const data = await appConfigService.setSetting('referral_share_message', value)
        res.status(200).json({ ok: true, error: 0, data, message: 'Texto actualizado exitosamente' })
    } catch (error) {
        res.status(500).json({ ok: false, error: 1, data: null, message: 'Error al actualizar el texto' })
    }
}

// Precio por producto y minimo/maximo de productos que se usan para
// calcular el costo base de una solicitud nueva. Default: $15 por
// producto, minimo 3 productos ($45), maximo 6 productos ($90).
const REQUEST_PRICE_PER_PRODUCT_DEFAULT = '15'
const REQUEST_MIN_PRODUCTS_DEFAULT = '3'
const REQUEST_MAX_PRODUCTS_DEFAULT = '6'

export const getRequestPricingSettings = async (req: Request, res: Response) => {
    try {
        const [price_per_product, min_products, max_products] = await Promise.all([
            appConfigService.getSetting('request_price_per_product', REQUEST_PRICE_PER_PRODUCT_DEFAULT),
            appConfigService.getSetting('request_min_products', REQUEST_MIN_PRODUCTS_DEFAULT),
            appConfigService.getSetting('request_max_products', REQUEST_MAX_PRODUCTS_DEFAULT),
        ])
        res.status(200).json({
            ok: true, error: 0, message: 'Configuración obtenida exitosamente',
            data: {
                price_per_product: Number(price_per_product.value),
                min_products: Number(min_products.value),
                max_products: Number(max_products.value),
            },
        })
    } catch (error) {
        res.status(500).json({ ok: false, error: 1, data: null, message: 'Error al obtener la configuración' })
    }
}

export const setRequestPricingSettings = async (req: Request, res: Response) => {
    try {
        const { price_per_product, min_products, max_products } = req.body
        if (price_per_product == null || min_products == null || max_products == null) {
            res.status(400).json({ ok: false, error: 1, data: null, message: 'Faltan datos' })
            return
        }
        if (Number(min_products) < 1 || Number(max_products) < Number(min_products)) {
            res.status(400).json({ ok: false, error: 1, data: null, message: 'El mínimo debe ser al menos 1 y el máximo no puede ser menor al mínimo' })
            return
        }
        const pricing = {
            price_per_product: Number(price_per_product),
            min_products: Number(min_products),
            max_products: Number(max_products),
        }
        await Promise.all([
            appConfigService.setSetting('request_price_per_product', String(price_per_product)),
            appConfigService.setSetting('request_min_products', String(min_products)),
            appConfigService.setSetting('request_max_products', String(max_products)),
        ])
        // Actualiza el precio de las solicitudes YA guardadas para que
        // queden al dia con la nueva configuracion. Los pedidos que ya
        // estan en curso no se tocan (su precio ya quedo congelado aparte).
        const { total, updated } = await requestsService.recalculateAllPrices(pricing)
        res.status(200).json({ ok: true, error: 0, data: { total, updated }, message: `Configuración actualizada exitosamente. Se actualizó el precio de ${updated} de ${total} solicitud(es) guardada(s)` })
    } catch (error) {
        res.status(500).json({ ok: false, error: 1, data: null, message: 'Error al actualizar la configuración' })
    }
}

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

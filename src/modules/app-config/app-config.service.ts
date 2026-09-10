import { prisma } from '../../core/prisma'
import { StorageService } from '../../services/storage.service'

export class AppConfigService {
    async getLoginVideo() {
        const asset = await prisma.assets.findFirst({
            where: { entity_type: 'app_config', entity_id: 1, is_active: true },
            orderBy: { created_at: 'desc' },
        })
        return { url: asset?.vc_url ?? null }
    }

    async uploadLoginVideo(buffer: Buffer, mime: string, originalName: string, id_user: number) {
        const result = await StorageService.uploadAsset({
            entity: 'app_config',
            entity_id: 1,
            buffer,
            mime,
            originalName,
            id_user,
            optimize: false,
        })
        return { url: result.url }
    }

    async removeLoginVideo() {
        await prisma.assets.updateMany({
            where: { entity_type: 'app_config', entity_id: 1, is_active: true },
            data: { is_active: false },
        })
        return { url: null }
    }

    /**
     * Textos configurables (ej. mensaje de instrucciones al aceptar tarea),
     * para que el master los edite sin necesitar actualizar la app.
     */
    async getSetting(key: string, defaultValue: string) {
        const setting = await prisma.app_settings.findUnique({ where: { vc_key: key } })
        return { key, value: setting?.vc_value ?? defaultValue }
    }

    async setSetting(key: string, value: string) {
        const setting = await prisma.app_settings.upsert({
            where: { vc_key: key },
            create: { vc_key: key, vc_value: value },
            update: { vc_value: value },
        })
        return { key: setting.vc_key, value: setting.vc_value }
    }
}

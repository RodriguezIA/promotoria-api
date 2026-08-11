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
}

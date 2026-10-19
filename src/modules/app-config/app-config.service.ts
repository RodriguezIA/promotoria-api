import { prisma } from '../../core/prisma'
import { StorageService } from '../../services/storage.service'

export interface PaymentAccount {
    bank: string
    holder: string
    clabe: string
    account: string
    instructions: string
}

const PAYMENT_ACCOUNT_KEY = 'payment_account_default'
const EMPTY_ACCOUNT: PaymentAccount = { bank: '', holder: '', clabe: '', account: '', instructions: '' }
const cleanStr = (v: unknown, max: number) => String(v ?? '').trim().slice(0, max)
const normalizeAccount = (i: any): PaymentAccount => ({
    bank: cleanStr(i?.bank, 100),
    holder: cleanStr(i?.holder, 150),
    clabe: cleanStr(i?.clabe, 30),
    account: cleanStr(i?.account, 30),
    instructions: cleanStr(i?.instructions, 500),
})
const parseAccount = (raw: string | null | undefined): PaymentAccount | null => {
    if (!raw) return null
    try { return normalizeAccount(JSON.parse(raw)) } catch { return null }
}

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

    /** Cuenta general donde los clientes depositan sus pagos (la pone el master en Configuracion de la app). */
    async getDefaultPaymentAccount(): Promise<PaymentAccount> {
        const row = await prisma.app_settings.findUnique({ where: { vc_key: PAYMENT_ACCOUNT_KEY } })
        return parseAccount(row?.vc_value) ?? { ...EMPTY_ACCOUNT }
    }

    async setDefaultPaymentAccount(input: any): Promise<PaymentAccount> {
        const account = normalizeAccount(input)
        const value = JSON.stringify(account)
        await prisma.app_settings.upsert({
            where: { vc_key: PAYMENT_ACCOUNT_KEY },
            create: { vc_key: PAYMENT_ACCOUNT_KEY, vc_value: value },
            update: { vc_value: value },
        })
        return account
    }

    /** Cuenta que ve un cliente al pagar: la suya si el master le puso una, si no la general. */
    async getClientPaymentAccount(id_client: number) {
        const c = await prisma.clients.findUnique({ where: { id_client }, select: { vc_payment_account: true } })
        if (!c) throw new Error('Cliente no encontrado')
        const own = parseAccount(c.vc_payment_account)
        if (own) return { account: own, is_custom: true }
        return { account: await this.getDefaultPaymentAccount(), is_custom: false }
    }

    async setClientPaymentAccount(id_client: number, input: any) {
        const account = normalizeAccount(input)
        await prisma.clients.update({ where: { id_client }, data: { vc_payment_account: JSON.stringify(account) } })
        return { account, is_custom: true }
    }

    async resetClientPaymentAccount(id_client: number) {
        await prisma.clients.update({ where: { id_client }, data: { vc_payment_account: null } })
        return { account: await this.getDefaultPaymentAccount(), is_custom: false }
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

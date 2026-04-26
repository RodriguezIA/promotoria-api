export interface PromoterDTO {
    id: number
    name: string
    lastname?: string
    email?: string
    password: string
    phone: string
    fmc_token?: string
    dt_register: string
    dt_updated: string
    dt_last_login?: string
    isActive: boolean
    latitude?: number
    longitude?: number
}

export interface CreatePromoterDTO {
    name: string
    lastname?: string
    email?: string
    password: string
    phone: string
    fcm_token?: string
    latitude?: number
    longitude?: number
}

export interface LoginPromoterDTO {
    termino: string
    password: string
    fcm_token: string
    latitude?: number
    longitude?: number
}

export interface TokenPromoterPayload {
    id: number
    phone: string
    email?: string
}
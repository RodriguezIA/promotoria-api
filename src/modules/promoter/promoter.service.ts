import bcrypt from 'bcrypt'
import { prisma } from '../../core/prisma'

import { CreatePromoterDTO, CreatePromoterBankAccountDTO, UpdatePromoterBankAccountDTO } from './promoter.dtos'

export class Promoter {

    async createPromoter(data: CreatePromoterDTO){

        const hashedPassword = await bcrypt.hash(data.password, 10);

        return await prisma.$transaction(async (tx) => {
            // Si capturó un código de referido, buscamos quién lo activó.
            let id_activator: number | null = null
            if (data.referral_code) {
                const activator = await tx.promoters.findUnique({
                    where: { vc_referral_code: data.referral_code }
                })
                if (!activator) throw new Error('El código de referido no es válido')
                id_activator = activator.id
            }

            const promoter = await tx.promoters.create({
                data: {
                    name: data.name,
                    lastname: data.lastname,
                    email: data.email,
                    password: hashedPassword,
                    phone: data.phone,
                    fcm_token: data.fcm_token,
                    latitude: data.latitude,
                    longitude: data.longitude,
                    id_activator,
                    dt_register: new Date().toISOString(),
                    dt_updated: new Date().toISOString()
                }
            })

            // Cada promotor tiene su propio código para poder invitar a otros.
            const updated = await tx.promoters.update({
                where: { id: promoter.id },
                data: { vc_referral_code: `PR${promoter.id}` }
            })

            await tx.promoter_logs.create({
                data: {
                    id_promotor: promoter.id,
                    vc_log: id_activator
                        ? `Promotor ${promoter.name} registrado (activado por el promotor #${id_activator})`
                        : `Promotor ${promoter.name} registrado`,
                }
            })

            const {password, ...promoterWithoutPassword} = updated
            return promoterWithoutPassword
        })
    }

    async getPromoters(){
        const promoters = await prisma.promoters.findMany()
        if (!promoters.length) return []
        const ids = promoters.map(p => p.id)
        const images = await prisma.assets.findMany({
            where: { entity_type: 'promoter', entity_id: { in: ids }, is_active: true },
            select: { entity_id: true, vc_url: true },
        })
        const imageMap = new Map(images.map(img => [img.entity_id, img.vc_url]))
        return promoters.map(p => ({ ...p, vc_profile_image: imageMap.get(p.id) ?? null }))
    }

    async getPromoterById(id: number){
        const promoter = await prisma.promoters.findUnique({ where: { id } })
        if (!promoter) return null
        const asset = await prisma.assets.findFirst({
            where: { entity_type: 'promoter', entity_id: id, is_active: true },
            select: { vc_url: true },
        })
        return { ...promoter, vc_profile_image: asset?.vc_url ?? null }
    }

    async getPromoterByPhone(phone: string){
        return await prisma.promoters.findUnique({
            where: {
                phone
            }
        })
    }

    async ExistPromoterByPhone(phone: string){
        const promoter = await prisma.promoters.findUnique({
            where: {
                phone
            }
        })

        return !!promoter
    }

    async ExistPromoterByEmail(email: string){
        const promoter = await prisma.promoters.findUnique({
            where: {
                email
            }
        })

        return !!promoter
    }

    async updatePromoter(id: number, data: Partial<CreatePromoterDTO>){
        return await prisma.promoters.update({
            where: {
                id
            },
            data: {
                ...data,
                dt_updated: new Date().toISOString()
            }
        })
    }

    async updateGeolocation(id: number, latitude: number, longitude: number){
        return await prisma.promoters.update({
            where: {
                id
            },
            data: {
                latitude,
                longitude,
                dt_updated: new Date().toISOString()
            }
        })
    }

    async updateLastLogin(id: number, fcm_token: string){
        return await prisma.promoters.update({
            where: {
                id
            },
            data: {
                fcm_token: fcm_token,
                dt_last_login: new Date().toISOString()
            }
        })
    }

    async updateFcmToken(id: number, fcm_token: string){
        return await prisma.promoters.update({
            where: {
                id
            },
            data: {
                fcm_token
            }
        })
    }

    async deletePromoter(id: number){
        return await prisma.$transaction(async (prisma) => {
            await prisma.promoters.update({
                where: {
                    id
                },
                data: {
                    isActive: false,
                    dt_updated: new Date().toISOString()
                }
            })

            await prisma.promoter_logs.create({
                data: {
                    id_promotor: id,
                    vc_log: `Promotor desactivado`,
                }
            })
        })
    }

    async validatePromoter(email: string, plainPassword: string) {
        const promoter = await prisma.promoters.findUnique({ where: { email } });
        if (!promoter) return null;

        const isValid = await bcrypt.compare(plainPassword, promoter.password);
        if (!isValid) return null;

        return promoter;
    }

    async validatePromoterByTermino(termino: string, plainPassword: string){
        const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(termino)
        const isPhone = /^\+?[\d\s\-().]{7,20}$/.test(termino)

        if(!isEmail && !isPhone) return null

        const field = isEmail ? 'email' : 'phone'

        const promoter = await prisma.promoters.findUnique({
            where: isEmail ? { email: termino } : { phone: termino }
        })
        if (!promoter) return null;

        const isValid = await bcrypt.compare(plainPassword, promoter.password);
        if (!isValid) return null;

        const asset = await prisma.assets.findFirst({
            where: { entity_type: 'promoter', entity_id: promoter.id, is_active: true },
            select: { vc_url: true },
        })

        return { promoter: { ...promoter, vc_profile_image: asset?.vc_url ?? null }, field };
    }

    async createBankAccount(id_promoter: number, data: CreatePromoterBankAccountDTO) {
        return await prisma.promoter_bank_accounts.create({
            data: {
                id_promoter,
                account_holder_name: data.account_holder_name,
                account_type: data.account_type,
                clabe: data.account_type === 'CLABE' ? data.clabe : null,
                card_number: data.account_type === 'CARD' ? data.card_number : null,
                bank_name: data.bank_name,
            },
        })
    }

    async getBankAccountsByPromoter(id_promoter: number) {
        return await prisma.promoter_bank_accounts.findMany({
            where: { id_promoter, dt_deleted: null },
            orderBy: { dt_register: 'desc' },
        })
    }

    async getBankAccountById(id: number, id_promoter: number) {
        return await prisma.promoter_bank_accounts.findFirst({
            where: { id, id_promoter, dt_deleted: null },
        })
    }

    async updateBankAccount(id: number, data: UpdatePromoterBankAccountDTO) {
        return await prisma.promoter_bank_accounts.update({
            where: { id },
            data: {
                ...data,
                ...(data.account_type === 'CLABE' ? { card_number: null } : {}),
                ...(data.account_type === 'CARD' ? { clabe: null } : {}),
                dt_updated: new Date(),
            },
        })
    }

    async softDeleteBankAccount(id: number) {
        return await prisma.promoter_bank_accounts.update({
            where: { id },
            data: { dt_deleted: new Date() },
        })
    }

    // async updatePromoterImage(id: number, imageUrl: string) {
    //     return await prisma.promoters.update({
    //         where: { id },
    //         data: {
    //             vc_image: imageUrl,
    //             dt_updated: new Date().toISOString()
    //         }
    //     })
    // }
}

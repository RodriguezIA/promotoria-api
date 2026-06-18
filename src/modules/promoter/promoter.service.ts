import bcrypt from 'bcrypt'
import { prisma } from '../../core/prisma'

import { CreatePromoterDTO } from './promoter.dtos'

export class Promoter {

    async createPromoter(data: CreatePromoterDTO){

        const hashedPassword = await bcrypt.hash(data.password, 10);

        return await prisma.$transaction(async (prisma) => {
            const prometer = await prisma.promoters.create({
                data: {
                    ...data,
                    password: hashedPassword,
                    dt_register: new Date().toISOString(),
                    dt_updated: new Date().toISOString()
                }
            })

            await prisma.promoter_logs.create({
                data: {
                    id_promotor: prometer.id,
                    vc_log: `Promotor ${prometer.name} registrado`,
                }
            })

            const {password, ...promoterWithoutPassword} = prometer
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
}
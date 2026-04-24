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
        return await prisma.promoters.findMany()
    }

    async getPromoterById(id: number){
        return await prisma.promoters.findUnique({
            where: {
                id
            }
        })
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

    async updateLastLogin(id: number){
        return await prisma.promoters.update({
            where: {
                id
            },
            data: {
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
}
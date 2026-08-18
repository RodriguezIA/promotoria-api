import bcrypt from 'bcrypt'
import { prisma } from '../../core/prisma'

import {
    CreatePromoterDTO, CreatePromoterBankAccountDTO, UpdatePromoterBankAccountDTO,
    UpdatePromoterProfileDTO, UpdatePromoterPasswordDTO,
} from './promoter.dtos'
export class Promoter {

    async checkPhoneExists(phone: string): Promise<boolean> {
        const promoter = await prisma.promoters.findUnique({
            where: { phone },
            select: { id: true },
        })
        return !!promoter
    }

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

    async updateProfile(id: number, data: UpdatePromoterProfileDTO) {
        // Validamos unicidad de telefono/correo antes de intentar el update,
        // para devolver un mensaje claro en vez del error crudo de MySQL.
        if (data.phone) {
            const existing = await prisma.promoters.findUnique({ where: { phone: data.phone } })
            if (existing && existing.id !== id) throw new Error('Ese número de celular ya está registrado por otro promotor')
        }
        if (data.email) {
            const existing = await prisma.promoters.findUnique({ where: { email: data.email } })
            if (existing && existing.id !== id) throw new Error('Ese correo ya está registrado por otro promotor')
        }

        const updated = await prisma.promoters.update({
            where: { id },
            data: {
                ...(data.name !== undefined ? { name: data.name } : {}),
                ...(data.lastname !== undefined ? { lastname: data.lastname } : {}),
                ...(data.email !== undefined ? { email: data.email || null } : {}),
                ...(data.phone !== undefined ? { phone: data.phone } : {}),
                dt_updated: new Date().toISOString(),
            },
        })

        const { password, ...promoterWithoutPassword } = updated
        return promoterWithoutPassword
    }

    async updatePassword(id: number, data: UpdatePromoterPasswordDTO) {
        const promoter = await prisma.promoters.findUnique({ where: { id } })
        if (!promoter) throw new Error('Promotor no encontrado')

        const isValid = await bcrypt.compare(data.current_password, promoter.password)
        if (!isValid) throw new Error('La contraseña actual no es correcta')

        const hashedPassword = await bcrypt.hash(data.new_password, 10)
        await prisma.promoters.update({
            where: { id },
            data: { password: hashedPassword, dt_updated: new Date().toISOString() },
        })

        await prisma.promoter_logs.create({
            data: { id_promotor: id, vc_log: 'Promotor actualizó su contraseña' },
        })
    }

    /**
     * Listado de invitados de un promotor (a quienes activó con su código):
     * si están activos, cuánto han generado (lo que se les ha pagado como
     * promotores) y cuánto le ha tocado a él (activador) por cada uno.
     */
    async getReferrals(id_activator: number) {
        const invitees = await prisma.promoters.findMany({
            where: { id_activator },
            select: { id: true, name: true, lastname: true, isActive: true, dt_register: true },
            orderBy: { dt_register: 'desc' },
        })
        if (!invitees.length) return []

        const inviteeIds = invitees.map(p => p.id)

        // Lo que cada invitado ha generado como promotor (total pagado/por pagar
        // a él por sus tareas), uniendo por tarea para mapear a cada invitado.
        const paymentTasks = await prisma.promoter_payment_tasks.findMany({
            where: { task: { id_promoter: { in: inviteeIds } } },
            select: { f_amount: true, task: { select: { id_promoter: true } } },
        })
        const generatedByPromoter = new Map<number, number>()
        for (const pt of paymentTasks) {
            const idPromoter = pt.task.id_promoter
            if (!idPromoter) continue
            generatedByPromoter.set(idPromoter, (generatedByPromoter.get(idPromoter) ?? 0) + Number(pt.f_amount))
        }

        // Lo que le ha tocado a el activador por cada invitado.
        const activatorTasks = await prisma.activator_payment_tasks.findMany({
            where: {
                id_promoter: { in: inviteeIds },
                payment: { id_activator },
            },
            select: { f_amount: true, id_promoter: true },
        })
        const earnedFromInvitee = new Map<number, number>()
        for (const at of activatorTasks) {
            earnedFromInvitee.set(at.id_promoter, (earnedFromInvitee.get(at.id_promoter) ?? 0) + Number(at.f_amount))
        }

        return invitees.map(p => ({
            id: p.id,
            name: `${p.name}${p.lastname ? ' ' + p.lastname : ''}`,
            isActive: p.isActive,
            dt_register: p.dt_register,
            generated: generatedByPromoter.get(p.id) ?? 0,
            earnedForMe: earnedFromInvitee.get(p.id) ?? 0,
        }))
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

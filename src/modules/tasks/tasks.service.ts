import { prisma } from '../../core/prisma'
import { CreateTaskDTO, UpdateTaskDTO, AnswerItemDTO } from './tasks.dtos'

export class Task {

    async create(data: CreateTaskDTO) {
        return await prisma.tasks.create({
            data: {
                id_client: data.id_client,
                id_order: data.id_order,
                id_store: data.id_store,
                id_request: data.id_request,
            }
        })
    }

    async getById(id_task: number) {
        const task = await prisma.tasks.findUnique({
            where: { id_task },
            include: {
                client: { select: { id_client: true, name: true } },
                order: { select: { id_order: true, f_total: true, id_status: true } },
                store: { select: { id_store: true, name: true, store_code: true } },
                promoter: { select: { id: true, name: true, lastname: true, phone: true, email: true } },
                request: { select: { id_request: true, vc_name: true, url_rack_image: true, f_value: true } }
            }
        })
        if (!task) return null

        const storeAddress = await prisma.addresses.findFirst({
            where: { entity_type: 'store', entity_id: task.id_store, is_active: true },
            select: {
                street: true, ext_number: true, int_number: true,
                neighborhood: true, postal_code: true, address_references: true,
                latitude: true, longitude: true,
                city: { select: { id: true, name: true } },
                state: { select: { id: true, name: true } },
            }
        })
        return { ...task, storeAddress }
    }

    async getAll(filters?: { id_client?: number; id_order?: number; id_promoter?: number; id_status?: number }) {
        const where: any = {}
        if (filters?.id_client) where.id_client = filters.id_client
        if (filters?.id_order) where.id_order = filters.id_order
        if (filters?.id_promoter !== undefined) where.id_promoter = filters.id_promoter
        if (filters?.id_status !== undefined) where.id_status = filters.id_status

        return await prisma.tasks.findMany({
            where,
            include: {
                client: { select: { id_client: true, name: true, vc_initialism: true } },
                order: { select: { id_order: true, f_total: true } },
                store: { select: { id_store: true, name: true } },
                promoter: { select: { id: true, name: true, lastname: true, phone: true } },
                request: { select: { id_request: true, vc_name: true } }
            },
            orderBy: { dt_register: 'desc' }
        })
    }

    async getTasksByPromoter(id_promoter: number, id_status?: number) {
        const where: any = { id_promoter }
        if (id_status !== undefined) where.id_status = id_status
        else {
            where.id_status = { in: [1, 2, 3] }
        }

        return await prisma.tasks.findMany({
            where,
            select: {
                id_task: true, id_status: true, dt_register: true, i_notification_count: true,
                store: {
                    select: { id_store: true, name: true, store_code: true }
                },
                request: {
                    select: { id_request: true, vc_name: true, url_rack_image: true }
                },
                order: {
                    select: { id_order: true, f_total: true }
                },
                client: {
                    select: { id_client: true, name: true }
                }
            },
            orderBy: { dt_register: 'desc' }
        })
    }

    async update(id_task: number, data: UpdateTaskDTO) {
        return await prisma.tasks.update({
            where: { id_task },
            data: { ...(data.id_status !== undefined && { id_status: data.id_status }) }
        })
    }

    async delete(id_task: number) {
        return await prisma.tasks.update({
            where: { id_task },
            data: { id_status: 0 }
        })
    }

    async acceptTask(id_task: number, id_promoter: number) {
        const task = await prisma.tasks.findUnique({
            where: { id_task },
            select: { id_promoter: true, id_status: true }
        })
        if (!task || task.id_status !== 1) throw new Error('La tarea no esta activa o no existe')
        if (task.id_promoter !== null) throw new Error('La tarea ya tiene un promotor asignado')

        const rejected = await prisma.task_rejections.findUnique({
            where: { id_task_id_promoter: { id_task, id_promoter } }
        })
        if (rejected) throw new Error('El promotor ya rechazo esta tarea')

        return await prisma.tasks.update({
            where: { id_task },
            data: { id_promoter, id_status: 2 },
            include: {
                store: { select: { id_store: true, name: true } },
                request: { select: { id_request: true, vc_name: true } },
            }
        })
    }

    async rejectTask(id_task: number, id_promoter: number) {
        const task = await prisma.tasks.findUnique({
            where: { id_task },
            select: { id_promoter: true, id_status: true }
        })
        if (!task || task.id_status !== 1) throw new Error('La tarea no esta disponible')
        if (task.id_promoter !== null) throw new Error('La tarea ya fue aceptada por otro promotor')

        const existing = await prisma.task_rejections.findUnique({
            where: { id_task_id_promoter: { id_task, id_promoter } }
        })
        if (existing) return existing

        return await prisma.task_rejections.create({ data: { id_task, id_promoter } })
    }

    async getTaskChecklist(id_task: number) {
        const task = await prisma.tasks.findUnique({
            where: { id_task },
            select: {
                id_task: true, id_status: true, dt_register: true,
                id_client: true, id_order: true, id_request: true, id_promoter: true, id_store: true,
                i_notification_count: true,
                store: { select: { id_store: true, name: true, store_code: true } },
                request: {
                    select: {
                        id_request: true, vc_name: true, url_rack_image: true, f_value: true,
                        request_products: {
                            where: { b_active: true },
                            select: {
                                id_request_product: true,
                                product: {
                                    select: { id_product: true, name: true, description: true, vc_image: true }
                                },
                                request_product_questions: {
                                    where: { b_active: true },
                                    select: {
                                        id_request_product_question: true,
                                        question: {
                                            select: {
                                                id_question: true, question: true, question_type: true,
                                                min_value: true, max_value: true, max_photos: true,
                                                question_options: {
                                                    where: { i_status: true },
                                                    select: { id_option: true, option_text: true, option_value_numeric: true, option_order: true },
                                                    orderBy: { option_order: 'asc' as const }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        })
        if (!task) return null

        const storeAddress = await prisma.addresses.findFirst({
            where: { entity_type: 'store', entity_id: task.id_store, is_active: true },
            select: {
                street: true, ext_number: true, int_number: true,
                neighborhood: true, postal_code: true, address_references: true,
                latitude: true, longitude: true,
                city: { select: { id: true, name: true } },
                state: { select: { id: true, name: true } },
            }
        })

        let myAnswers: any[] = []
        if (task.id_promoter) {
            myAnswers = await prisma.task_answers.findMany({
                where: { id_task, id_promoter: task.id_promoter },
                select: {
                    id_task_answer: true, id_request_product_question: true,
                    vc_answer: true, vc_image_url: true, dt_register: true,
                }
            })
        }

        return { ...task, storeAddress, myAnswers }
    }

    async answerTaskQuestions(
        id_task: number,
        id_promoter: number,
        answers: AnswerItemDTO[],
        imageUrls: Map<number, string>
    ) {
        const task = await prisma.tasks.findUnique({
            where: { id_task },
            select: { id_promoter: true, id_status: true }
        })
        if (!task) throw new Error('Tarea no encontrada')
        if (task.id_promoter !== id_promoter) throw new Error('No tienes asignada esta tarea')

        const results: any[] = []

        for (const item of answers) {
            const vc_image_url = imageUrls.get(item.id_request_product_question) ?? null

            const existing = await prisma.task_answers.findFirst({
                where: { id_task, id_promoter, id_request_product_question: item.id_request_product_question }
            })

            if (existing) {
                const updated = await prisma.task_answers.update({
                    where: { id_task_answer: existing.id_task_answer },
                    data: {
                        vc_answer: item.vc_answer ?? existing.vc_answer,
                        ...(vc_image_url !== null && { vc_image_url }),
                    }
                })
                results.push(updated)
            } else {
                const created = await prisma.task_answers.create({
                    data: {
                        id_task,
                        id_promoter,
                        id_request_product_question: item.id_request_product_question,
                        vc_answer: item.vc_answer ?? null,
                        vc_image_url,
                        dt_register: new Date(),
                    }
                })
                results.push(created)
            }
        }

        return results
    }

    async completeTask(id_task: number, id_promoter: number) {
        const task = await prisma.tasks.findUnique({
            where: { id_task },
            select: { id_promoter: true, id_status: true }
        })
        if (!task) throw new Error('Tarea no encontrada')
        if (task.id_promoter !== id_promoter) throw new Error('No tienes asignada esta tarea')

        return await prisma.tasks.update({
            where: { id_task },
            data: { id_status: 3 }
        })
    }
}

import { prisma } from '../../core/prisma'
import {
    CreateRequestDTO,
    UpdateRequestDTO,
    RequestFiltersDTO,
} from './requests.dtos'

export class Request {

    async createRequest(data: CreateRequestDTO) {
        return await prisma.$transaction(async (tx) => {
            const request = await tx.requests.create({
                data: {
                    id_user: data.id_user,
                    id_client: data.id_client,
                    vc_name: data.vc_name,
                    f_value: data.f_value,
                    url_rack_image: data.url_rack_image,
                }
            })

            if (data.products && data.products.length > 0) {
                for (const product of data.products) {
                    const requestProduct = await tx.request_products.create({
                        data: {
                            id_request: request.id_request,
                            id_product: product.id_product,
                        }
                    })

                    if (product.questions && product.questions.length > 0) {
                        for (const question of product.questions) {
                            await tx.request_product_questions.create({
                                data: {
                                    id_request_product: requestProduct.id_request_product,
                                    id_question: question.id_question
                                }
                            })
                        }
                    }
                }
            }

            return request
        })
    }

    async getAllRequests(filters: RequestFiltersDTO) {
        const page = filters.page ?? 1
        const limit = filters.limit ?? 20
        const skip = (page - 1) * limit

        const where: any = {}
        if (filters.id_client !== undefined) where.id_client = filters.id_client
        if (filters.id_user !== undefined) where.id_user = filters.id_user
        if (filters.id_status !== undefined) where.id_status = filters.id_status
        if (filters.b_active !== undefined) where.b_active = filters.b_active
        else where.b_active = true

        const [requests, total] = await Promise.all([
            prisma.requests.findMany({
                where,
                skip,
                take: limit,
                orderBy: { dt_register: 'desc' },
                include: {
                    request_products: {
                        where: { b_active: true },
                        include: {
                            product: {
                                select: {
                                    id_product: true,
                                    name: true,
                                    vc_image: true,
                                }
                            },
                            request_product_questions: {
                                where: { b_active: true },
                                include: {
                                    question: {
                                        select: {
                                            id_question: true,
                                            question: true,
                                            question_type: true,
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }),
            prisma.requests.count({ where })
        ])

        return {
            data: requests,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        }
    }

    async getRequestById(id_request: number) {
        return await prisma.requests.findUnique({
            where: { id_request },
            include: {
                request_products: {
                    where: { b_active: true },
                    include: {
                        product: {
                            select: {
                                id_product: true,
                                name: true,
                                vc_image: true,
                            }
                        },
                        request_product_questions: {
                            where: { b_active: true },
                            include: {
                                question: {
                                    select: {
                                        id_question: true,
                                        question: true,
                                        question_type: true,
                                    }
                                }
                            }
                        }
                    }
                }
            }
        })
    }

    async updateRequest(id_request: number, data: UpdateRequestDTO) {
        return await prisma.$transaction(async (tx) => {
            const request = await tx.requests.update({
                where: { id_request },
                data: {
                    id_user: data.id_user,
                    id_client: data.id_client,
                    vc_name: data.vc_name,
                    f_value: data.f_value,
                    url_rack_image: data.url_rack_image,
                    id_status: data.id_status,
                    dt_update: new Date(),
                }
            })

            if (data.products) {
                const existingProducts = await tx.request_products.findMany({
                    where: { id_request, b_active: true }
                })

                const incomingProductIds = data.products
                    .filter(p => p.id_request_product)
                    .map(p => p.id_request_product!)

                const productsToDeactivate = existingProducts.filter(
                    ep => !incomingProductIds.includes(ep.id_request_product)
                )

                for (const prod of productsToDeactivate) {
                    await tx.request_products.update({
                        where: { id_request_product: prod.id_request_product },
                        data: { b_active: false, dt_update: new Date() }
                    })

                    await tx.request_product_questions.updateMany({
                        where: { id_request_product: prod.id_request_product },
                        data: { b_active: false, dt_update: new Date() }
                    })
                }

                for (const product of data.products) {
                    let requestProductId: number

                    if (product.id_request_product) {
                        const existing = existingProducts.find(
                            ep => ep.id_request_product === product.id_request_product
                        )

                        if (existing) {
                            await tx.request_products.update({
                                where: { id_request_product: existing.id_request_product },
                                data: {
                                    id_product: product.id_product,
                                    dt_update: new Date()
                                }
                            })
                            requestProductId = existing.id_request_product
                        } else {
                            const created = await tx.request_products.create({
                                data: {
                                    id_request,
                                    id_product: product.id_product,
                                }
                            })
                            requestProductId = created.id_request_product
                        }
                    } else {
                        const created = await tx.request_products.create({
                            data: {
                                id_request,
                                id_product: product.id_product,
                            }
                        })
                        requestProductId = created.id_request_product
                    }

                    if (product.questions) {
                        const existingQuestions = await tx.request_product_questions.findMany({
                            where: { id_request_product: requestProductId, b_active: true }
                        })

                        const incomingQuestionIds = product.questions
                            .filter(q => q.id_request_product_question)
                            .map(q => q.id_request_product_question!)

                        const questionsToDeactivate = existingQuestions.filter(
                            eq => !incomingQuestionIds.includes(eq.id_request_product_question)
                        )

                        for (const q of questionsToDeactivate) {
                            await tx.request_product_questions.update({
                                where: { id_request_product_question: q.id_request_product_question },
                                data: { b_active: false, dt_update: new Date() }
                            })
                        }

                        for (const question of product.questions) {
                            if (question.id_request_product_question) {
                                const existingQ = existingQuestions.find(
                                    eq => eq.id_request_product_question === question.id_request_product_question
                                )
                                if (existingQ) {
                                    await tx.request_product_questions.update({
                                        where: { id_request_product_question: existingQ.id_request_product_question },
                                        data: {
                                            id_question: question.id_question,
                                            dt_update: new Date()
                                        }
                                    })
                                    continue
                                }
                            }

                            await tx.request_product_questions.create({
                                data: {
                                    id_request_product: requestProductId,
                                    id_question: question.id_question,
                                }
                            })
                        }
                    }
                }
            }

            return request
        })
    }

    async deleteRequest(id_request: number) {
        return await prisma.$transaction(async (tx) => {
            await tx.requests.update({
                where: { id_request },
                data: { b_active: false, dt_update: new Date() }
            })

            const products = await tx.request_products.findMany({
                where: { id_request, b_active: true }
            })

            for (const product of products) {
                await tx.request_products.update({
                    where: { id_request_product: product.id_request_product },
                    data: { b_active: false, dt_update: new Date() }
                })

                await tx.request_product_questions.updateMany({
                    where: { id_request_product: product.id_request_product },
                    data: { b_active: false, dt_update: new Date() }
                })
            }

            return { id_request, deleted: true }
        })
    }
}

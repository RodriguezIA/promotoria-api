import { prisma } from '../../core/prisma'

import { CreateQuestionDto } from './questions.dtos'

export class Questions {

    async createQuestion(data: CreateQuestionDto){
        return await prisma.questions.create({
            data: {
                id_user: data.id_user,
                question: data.question,
                question_type: data.question_type,
                min_value: data.min_value,
                max_value: data.max_value,
                max_photos: data.max_photos,
                question_options: {
                    create: data.options.map((option) => ({
                        option_text: option.option_text,
                        option_value_numeric: option.option_value_numeric,
                        option_value_text: option.option_value_text,
                        option_order: option.option_order
                    }))
                },
                questions_client: data.clients ? {
                    create: data.clients.map((id_client) => ({
                        id_client: id_client,
                        id_user: data.id_user
                    }))
                } : undefined
            }
        })
    }

    async getQuestionList(id_client?: number) {
        return await prisma.questions.findMany({
            where: {
                i_status: 1,
                ...(id_client && id_client > 0 && {
                    questions_client: { some: { id_client } }
                })
            },
            include: {
                question_options: true,
                questions_client: {
                    include: {
                        clients: true
                    }
                }
            }
        })
    }

    async getQuestionById(id_question: number) {
        return await prisma.questions.findUnique({
            where: { id_question },
            include: {
                question_options: true,
                questions_client: true
            }
        })
    }

    async updateQuestion(id_question: number, data: Partial<CreateQuestionDto>) {
        return await prisma.questions.update({
            where: { id_question },
            data: {
                question: data.question,
                question_type: data.question_type,
                min_value: data.min_value,
                max_value: data.max_value,
                max_photos: data.max_photos,
                question_options: data.options ? {
                    deleteMany: {},
                    create: data.options.map((option) => ({
                        option_text: option.option_text,
                        option_value_numeric: option.option_value_numeric,
                        option_value_text: option.option_value_text,
                        option_order: option.option_order
                    }))
                } : undefined,
                questions_client: data.clients ? {
                    deleteMany: {},
                    create: data.clients.map((id_client) => ({
                        id_client: id_client,
                        id_user: data.id_user!
                    }))
                } : undefined
            }
        })
    }

    async deleteQuestion(id_question: number) {
        return prisma.questions.update({
            where: { id_question },
            data: { i_status: 0 }
        })
    }

}
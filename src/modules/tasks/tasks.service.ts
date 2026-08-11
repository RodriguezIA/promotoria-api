import { prisma } from '../../core/prisma'
import { CreateTaskDTO, UpdateTaskDTO, AnswerItemDTO } from './tasks.dtos'
import { generateFolio } from '../../services/folio.service'
import { resolveImages } from '../../core/asset-resolver'
import { haversineMeters } from '../../queues/helpers/haversine'
import { StorageService } from '../../services/storage.service'
import { taskRankingQueue } from '../../core/bullmq/queues'
import { NotificationService } from '../../services/notification.service'

export class Task {

    async create(data: CreateTaskDTO) {
        const task = await prisma.$transaction(async (tx) => {
            const vc_folio = await generateFolio(tx, data.id_client, 'tasks')

            return tx.tasks.create({
                data: {
                    id_client: data.id_client,
                    id_order: data.id_order,
                    id_store: data.id_store,
                    id_request: data.id_request,
                    vc_folio,
                }
            })
        })

        // Dispara el primer ciclo de ranking/notificación de inmediato, en vez
        // de esperar al siguiente tick del scheduler (cada 30 min en prod / 1
        // min en dev). Mismo job y mismo jobId determinístico que usa
        // `schedulerWorker`, así que si el scheduler también la encuentra antes
        // de que este ciclo termine, BullMQ deduplica por jobId y no se manda
        // la notificación dos veces para el mismo ciclo.
        try {
            await taskRankingQueue.add('rank_promoters', {
                id_task: task.id_task,
                id_store: task.id_store,
                cycle: task.i_current_cycle
            }, {
                jobId: `rank_task_${task.id_task}_cycle_${task.i_current_cycle}`
            })
            console.log(`[Task] Tarea ${task.id_task} (folio ${task.vc_folio}) encolada para ranqueo inmediato, ciclo ${task.i_current_cycle}.`)
        } catch (error) {
            console.error(`[Task] Error al encolar ranking inmediato para tarea ${task.id_task}:`, error)
        }

        return task
    }

    async getById(id_task: number) {
        const task = await prisma.tasks.findUnique({
            where: { id_task },
            include: {
                client: { select: { id_client: true, name: true } },
                order: { select: { id_order: true, vc_folio: true, f_total: true, id_status: true } },
                store: { select: { id_store: true, name: true, store_code: true } },
                promoter: { select: { id: true, name: true, lastname: true, phone: true, email: true } },
                request: { select: { id_request: true, vc_folio: true, vc_name: true, url_rack_image: true, f_value: true } }
            }
        })
        if (!task) return null

        const [storeAddress, requestAssets] = await Promise.all([
            prisma.addresses.findFirst({
                where: { entity_type: 'store', entity_id: task.id_store, is_active: true },
                select: {
                    street: true, ext_number: true, int_number: true,
                    neighborhood: true, postal_code: true, address_references: true,
                    latitude: true, longitude: true,
                    city: { select: { id: true, name: true } },
                    state: { select: { id: true, name: true } },
                }
            }),
            task.id_request ? resolveImages('request', [task.id_request]) : Promise.resolve(new Map<number, string>()),
        ])

        const request = task.request && task.id_request
            ? { ...task.request, url_rack_image: requestAssets.get(task.id_request) ?? task.request.url_rack_image }
            : task.request;

        return { ...task, request, storeAddress }
    }

    async getAll(filters?: {
        id_client?: number; id_order?: number; id_promoter?: number; id_status?: number
        id_request?: number; dt_from?: string; dt_to?: string
        page?: number; limit?: number
    }) {
        const page = filters?.page ?? 1
        const limit = filters?.limit ?? 20
        const skip = (page - 1) * limit

        const where: any = {}
        if (filters?.id_client) where.id_client = filters.id_client
        if (filters?.id_order) where.id_order = filters.id_order
        if (filters?.id_promoter !== undefined) where.id_promoter = filters.id_promoter
        if (filters?.id_status !== undefined) where.id_status = filters.id_status
        if (filters?.id_request) where.id_request = filters.id_request
        if (filters?.dt_from || filters?.dt_to) {
            where.dt_register = {}
            if (filters.dt_from) where.dt_register.gte = new Date(filters.dt_from)
            if (filters.dt_to) {
                const endOfDay = new Date(filters.dt_to)
                endOfDay.setHours(23, 59, 59, 999)
                where.dt_register.lte = endOfDay
            }
        }

        const [tasks, total] = await Promise.all([
            prisma.tasks.findMany({
                where,
                skip,
                take: limit,
                include: {
                    client: { select: { id_client: true, name: true, vc_initialism: true } },
                    order: { select: { id_order: true, vc_folio: true, f_total: true } },
                    store: { select: { id_store: true, name: true } },
                    promoter: { select: { id: true, name: true, lastname: true, phone: true } },
                    request: { select: { id_request: true, vc_folio: true, vc_name: true } }
                },
                orderBy: { dt_register: 'desc' }
            }),
            prisma.tasks.count({ where })
        ])

        return {
            data: tasks,
            meta: { total, page, limit, totalPages: Math.ceil(total / limit) }
        }
    }

    async getTasksByPromoter(id_promoter: number, id_status?: number | number[]) {
        const where: any = { id_promoter }
        if (id_status !== undefined) {
            where.id_status = Array.isArray(id_status) ? { in: id_status } : id_status
        } else {
            where.id_status = { in: [1, 2, 3] }
        }

        const tasks = await prisma.tasks.findMany({
            where,
            select: {
                id_task: true, vc_folio: true, id_status: true, dt_register: true, i_notification_count: true,
                id_request: true,
                store: {
                    select: { id_store: true, name: true, store_code: true }
                },
                request: {
                    select: { id_request: true, vc_folio: true, vc_name: true, url_rack_image: true }
                },
                order: {
                    select: { id_order: true, vc_folio: true, f_total: true }
                },
                client: {
                    select: { id_client: true, name: true }
                }
            },
            orderBy: { dt_register: 'desc' }
        })

        const requestIds = tasks.filter(t => t.id_request).map(t => t.id_request!);
        const requestAssets = await resolveImages('request', requestIds);

        return tasks.map(t => ({
            ...t,
            request: t.request
                ? { ...t.request, url_rack_image: requestAssets.get(t.request.id_request) ?? t.request.url_rack_image }
                : null,
        }));
    }

    async assignPromoter(id_task: number, id_promoter: number) {
        const task = await prisma.tasks.findUnique({ where: { id_task } })
        if (!task) throw new Error('Tarea no encontrada')

        const promoter = await prisma.promoters.findUnique({ where: { id: id_promoter } })
        if (!promoter) throw new Error('Promotor no encontrado')

        return await prisma.tasks.update({
            where: { id_task },
            data: { id_promoter, id_status: 2, dt_update: new Date() },
            include: {
                store: { select: { id_store: true, name: true } },
                promoter: { select: { id: true, name: true, lastname: true, phone: true } },
                request: { select: { id_request: true, vc_folio: true, vc_name: true } }
            }
        })
    }

    async update(id_task: number, data: UpdateTaskDTO) {
        return await prisma.tasks.update({
            where: { id_task },
            data: {
                ...(data.id_status !== undefined && { id_status: data.id_status }),
                dt_update: new Date(),
            }
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

        // Un promotor solo puede tener una tarea activa a la vez.
        const hasActiveTask = await prisma.tasks.findFirst({
            where: { id_promoter, id_status: { gte: 2, lte: 6 } },
            select: { id_task: true },
        })
        if (hasActiveTask) throw new Error('Ya tienes una tarea activa, termina la actual antes de aceptar otra')

        const rejected = await prisma.task_rejections.findUnique({
            where: { id_task_id_promoter: { id_task, id_promoter } }
        })
        if (rejected) throw new Error('El promotor ya rechazo esta tarea')

        return await prisma.tasks.update({
            where: { id_task },
            data: { id_promoter, id_status: 2 },
            include: {
                store: { select: { id_store: true, name: true } },
                request: { select: { id_request: true, vc_folio: true, vc_name: true } },
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

        return await prisma.task_rejections.create({ data: { id_task, id_promoter, reason: 'rejected' } })
    }

    /**
     * Aprueba una tarea en revisión (id_status 6, "En revisión" en el
     * vocabulario real de la app) -> pasa a 7 ("Terminada con éxito").
     */
    async reviewApprove(id_task: number) {
        const task = await prisma.tasks.findUnique({
            where: { id_task },
            select: { id_status: true }
        })
        if (!task) throw new Error('Tarea no encontrada')
        if (task.id_status !== 6) throw new Error('Solo se puede aprobar una tarea en revisión')

        return await prisma.tasks.update({
            where: { id_task },
            data: { id_status: 7, dt_update: new Date() },
        })
    }

    /**
     * Cancela una tarea en revisión (id_status 6) a petición del cliente/admin,
     * con un comentario obligatorio -> pasa a 0 ("Cancelada"), vc_cancel_type
     * "cliente". Notifica por push al promotor asignado.
     */
    async reviewCancel(id_task: number, comment: string) {
        const task = await prisma.tasks.findUnique({
            where: { id_task },
            select: {
                id_status: true,
                promoter: { select: { fcm_token: true } },
                store: { select: { name: true } },
            }
        })
        if (!task) throw new Error('Tarea no encontrada')
        if (task.id_status !== 6) throw new Error('Solo se puede cancelar una tarea en revisión')

        const updated = await prisma.tasks.update({
            where: { id_task },
            data: {
                id_status: 0,
                vc_cancel_type: 'cliente',
                vc_cancel_reason: comment,
                dt_update: new Date(),
            },
        })

        if (task.promoter?.fcm_token) {
            try {
                await NotificationService.sendPushNotification(task.promoter.fcm_token, {
                    title: 'Tarea cancelada',
                    body: `Tu tarea en ${task.store?.name ?? 'la tienda'} fue cancelada: ${comment}`,
                    // Sin id_task en data a propósito: el listener de la app navega a
                    // /task-offer/:id en cuanto ve id_task en el payload (pensado para
                    // ofertas nuevas), y esta tarea ya no es una oferta válida.
                    data: { type: 'task_cancelled' },
                })
            } catch (error) {
                console.error(`[Task] Error al notificar cancelación de la tarea ${id_task}:`, error)
            }
        }

        return updated
    }

    async findByIdOrFolio(id_task?: number, folio?: string) {
        if (id_task !== undefined) {
            return await prisma.tasks.findUnique({ where: { id_task } })
        }
        if (folio) {
            return await prisma.tasks.findUnique({ where: { vc_folio: folio } })
        }
        return null
    }

    /**
     * Fuerza el envío de la notificación de una tarea sin esperar al scheduler,
     * saltándose la deduplicación por jobId (a diferencia del disparo inmediato
     * normal) para poder repetirlo varias veces en pruebas.
     */
    async forceNotify(task: { id_task: number; id_store: number; i_current_cycle: number }) {
        await taskRankingQueue.add('rank_promoters', {
            id_task: task.id_task,
            id_store: task.id_store,
            cycle: task.i_current_cycle,
        }, {
            jobId: `rank_task_${task.id_task}_cycle_${task.i_current_cycle}_forced_${Date.now()}`,
        })
    }

    async getPromoterTaskHistory(id_promoter: number, reason?: 'rejected' | 'timeout') {
        // Sin @relation en el schema hacia tasks (ver nota en schema.prisma:
        // task_rejections.id_task/id_promoter no pueden tener FK real por un
        // mismatch de tipos preexistente), así que el join se arma a mano.
        const rejections = await prisma.task_rejections.findMany({
            where: {
                id_promoter,
                ...(reason && { reason }),
            },
            orderBy: { dt_register: 'desc' },
        })

        const taskIds = [...new Set(rejections.map(r => r.id_task))]
        const tasks = await prisma.tasks.findMany({
            where: { id_task: { in: taskIds } },
            select: {
                id_task: true,
                vc_folio: true,
                store: { select: { id_store: true, name: true } },
                request: { select: { id_request: true, vc_folio: true, vc_name: true, f_value: true } },
            },
        })
        const taskMap = new Map(tasks.map(t => [t.id_task, t]))

        return rejections.map(r => ({
            ...r,
            task: taskMap.get(r.id_task) ?? null,
        }))
    }

    async getTaskChecklist(id_task: number) {
        const task = await prisma.tasks.findUnique({
            where: { id_task },
            select: {
                id_task: true, vc_folio: true, id_status: true, dt_register: true,
                id_client: true, id_order: true, id_request: true, id_promoter: true, id_store: true,
                i_notification_count: true, vc_cancel_reason: true, vc_cancel_type: true,
                client: { select: { id_client: true, name: true } },
                order: { select: { id_order: true, vc_folio: true, f_total: true, id_status: true } },
                promoter: { select: { id: true, name: true, lastname: true, phone: true, email: true } },
                store: { select: { id_store: true, name: true, store_code: true } },
                request: {
                    select: {
                        id_request: true, vc_folio: true, vc_name: true, url_rack_image: true, f_value: true,
                        // Sin filtro b_active en la query: traemos todo y filtramos abajo en JS,
                        // porque un producto/pregunta desactivado DESPUÉS de que el promotor ya
                        // respondió debe seguir viéndose en el histórico de esta tarea (si no,
                        // "desaparece" el checklist de tareas viejas contestadas). Para una tarea
                        // que aún no se contesta, sí queremos que se filtre a solo lo activo.
                        request_products: {
                            select: {
                                id_request_product: true,
                                b_active: true,
                                product: {
                                    select: { id_product: true, name: true, description: true, vc_image: true }
                                },
                                request_product_questions: {
                                    select: {
                                        id_request_product_question: true,
                                        b_active: true,
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

        // Mantener un producto/pregunta si sigue activo O si ya tiene una
        // respuesta registrada (histórico), aunque se haya desactivado después.
        const answeredQuestionIds = new Set(myAnswers.map((a: any) => a.id_request_product_question))
        if (task.request) {
            task.request.request_products = task.request.request_products
                .map(rp => ({
                    ...rp,
                    request_product_questions: rp.request_product_questions.filter(
                        rpq => rpq.b_active || answeredQuestionIds.has(rpq.id_request_product_question)
                    ),
                }))
                .filter(rp => rp.b_active || rp.request_product_questions.length > 0)
        }

        const productIds = task.request?.request_products.map(rp => rp.product.id_product) ?? [];
        const answerIds = myAnswers.map((a: any) => a.id_task_answer);
        const [requestAssets, productAssets, answerAssets, arrangementAssets] = await Promise.all([
            task.id_request ? resolveImages('request', [task.id_request]) : Promise.resolve(new Map<number, string>()),
            resolveImages('product', productIds),
            resolveImages('task_answer', answerIds),
            resolveImages('task_arrangement', [id_task]),
        ]);

        const resolvedRequest = task.request && task.id_request
            ? {
                ...task.request,
                url_rack_image: requestAssets.get(task.id_request) ?? task.request.url_rack_image,
                request_products: task.request.request_products.map(rp => ({
                    ...rp,
                    product: { ...rp.product, vc_image: productAssets.get(rp.product.id_product) ?? rp.product.vc_image },
                })),
            }
            : task.request;

        const resolvedAnswers = myAnswers.map((a: any) => ({
            ...a,
            vc_image_url: answerAssets.get(a.id_task_answer) ?? a.vc_image_url,
        }));

        return {
            ...task,
            request: resolvedRequest,
            storeAddress,
            myAnswers: resolvedAnswers,
            arrangement_photo_url: arrangementAssets.get(id_task) ?? null,
        }
    }

    async answerTaskQuestions(
        id_task: number,
        id_promoter: number,
        answers: AnswerItemDTO[],
        images: Map<number, { buffer: Buffer; mime: string }>,
        arrangementPhoto?: { buffer: Buffer; mime: string }
    ) {
        const task = await prisma.tasks.findUnique({
            where: { id_task },
            select: { id_promoter: true, id_status: true }
        })
        if (!task) throw new Error('Tarea no encontrada')
        if (task.id_promoter !== id_promoter) throw new Error('No tienes asignada esta tarea')

        const results = await prisma.$transaction(async (tx) => {
            const rows: any[] = []

            for (const item of answers) {
                const result = await tx.task_answers.upsert({
                    where: {
                        id_task_id_promoter_id_request_product_question: {
                            id_task,
                            id_promoter,
                            id_request_product_question: item.id_request_product_question,
                        }
                    },
                    update: {
                        ...(item.vc_answer !== null && item.vc_answer !== undefined && { vc_answer: item.vc_answer }),
                    },
                    create: {
                        id_task,
                        id_promoter,
                        id_request_product_question: item.id_request_product_question,
                        vc_answer: item.vc_answer ?? null,
                        dt_register: new Date(),
                    }
                })
                rows.push(result)
            }

            return rows
        })

        for (const [rpqId, file] of images) {
            const existing = results.find(r => r.id_request_product_question === rpqId)

            const answerRow = await prisma.task_answers.upsert({
                where: {
                    id_task_id_promoter_id_request_product_question: {
                        id_task,
                        id_promoter,
                        id_request_product_question: rpqId,
                    }
                },
                update: {},
                create: {
                    id_task,
                    id_promoter,
                    id_request_product_question: rpqId,
                    vc_answer: null,
                    dt_register: new Date(),
                }
            })

            const { url } = await StorageService.uploadAsset({
                entity: 'task_answer',
                entity_id: answerRow.id_task_answer,
                extraRef: rpqId,
                buffer: file.buffer,
                mime: file.mime,
            })

            const updated = await prisma.task_answers.update({
                where: { id_task_answer: answerRow.id_task_answer },
                data: { vc_image_url: url },
            })

            if (existing) {
                existing.vc_image_url = url
            } else {
                results.push(updated)
            }
        }

        let arrangement_photo_url: string | null = null
        if (arrangementPhoto) {
            const { url } = await StorageService.uploadAsset({
                entity: 'task_arrangement',
                entity_id: id_task,
                buffer: arrangementPhoto.buffer,
                mime: arrangementPhoto.mime,
            })
            arrangement_photo_url = url
        }

        return { answers: results, arrangement_photo_url }
    }

    /**
     * El promotor terminó de llenar el checklist y lo manda a revisión del
     * cliente (id_status 6 = "En revisión" en el vocabulario real de la app,
     * ver fuente de verdad en webs/promotoria-saas/.../tareas/utils.ts).
     */
    async completeTask(id_task: number, id_promoter: number) {
        const task = await prisma.tasks.findUnique({
            where: { id_task },
            select: { id_promoter: true, id_status: true }
        })
        if (!task) throw new Error('Tarea no encontrada')
        if (task.id_promoter !== id_promoter) throw new Error('No tienes asignada esta tarea')

        return await prisma.tasks.update({
            where: { id_task },
            data: { id_status: 6, dt_update: new Date() }
        })
    }

    async getNearbyAvailableTasks(id_promoter: number, lat: number, lng: number, radiusMeters = 1000) {
        // Un promotor solo puede tener una tarea activa a la vez (id_status 2-6:
        // asignada, en camino, llegada, iniciada, en revision). Si ya tiene una,
        // no se le ofrecen tareas nuevas.
        const hasActiveTask = await prisma.tasks.findFirst({
            where: { id_promoter, id_status: { gte: 2, lte: 6 } },
            select: { id_task: true },
        })
        if (hasActiveTask) return []

        const [tasks, rejections] = await Promise.all([
            prisma.tasks.findMany({
                where: {
                    id_status: 1,
                    id_promoter: null,
                    OR: [{ dt_next_retry: null }, { dt_next_retry: { lte: new Date() } }],
                },
                select: {
                    id_task: true, vc_folio: true, id_status: true, dt_register: true,
                    id_store: true, id_request: true,
                    store: { select: { id_store: true, name: true, store_code: true } },
                    request: { select: { id_request: true, vc_folio: true, vc_name: true, url_rack_image: true, f_value: true } },
                    order: { select: { id_order: true, vc_folio: true, f_total: true } },
                    client: { select: { id_client: true, name: true } },
                },
                orderBy: { dt_register: 'desc' },
            }),
            prisma.task_rejections.findMany({
                where: { id_promoter },
                select: { id_task: true },
            }),
        ])

        const rejectedSet = new Set(rejections.map(r => r.id_task))
        const eligible = tasks.filter(t => !rejectedSet.has(t.id_task))

        if (eligible.length === 0) return []

        const storeIds = [...new Set(eligible.map(t => t.id_store))]
        const addresses = await prisma.addresses.findMany({
            where: { entity_type: 'store', entity_id: { in: storeIds }, is_active: true },
            select: { entity_id: true, latitude: true, longitude: true, street: true, ext_number: true, neighborhood: true, postal_code: true },
        })
        const addressByStore = new Map(addresses.map(a => [a.entity_id, a]))

        const nearby = eligible.filter(t => {
            const addr = addressByStore.get(t.id_store)
            if (!addr?.latitude || !addr?.longitude) return false
            const dist = haversineMeters(lat, lng, Number(addr.latitude), Number(addr.longitude))
            return dist <= radiusMeters
        })

        if (nearby.length === 0) return []

        const requestIds = nearby.filter(t => t.id_request).map(t => t.id_request!)
        const requestAssets = await resolveImages('request', requestIds)

        return nearby.map(t => ({
            ...t,
            storeAddress: addressByStore.get(t.id_store) ?? null,
            request: t.request
                ? { ...t.request, url_rack_image: requestAssets.get(t.request.id_request) ?? t.request.url_rack_image }
                : null,
        }))
    }
}

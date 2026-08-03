import { Worker, Job } from 'bullmq'
import { connectionWorker } from './conection'
import { taskRankingQueue } from './queues'
import { prisma } from '../prisma'
import { NotificationService } from '../../services/notification.service'
import { TASK_STATUS } from '../constants/status.constants'

const EN_ROUTE_TIMEOUT_MS = 2 * 60 * 60 * 1000 // 2 horas

export const enRouteTimeoutWorker = new Worker('en_route_timeout_queue', async (job: Job) => {
    const cutoff = new Date(Date.now() - EN_ROUTE_TIMEOUT_MS)

    const expiredTasks = await prisma.tasks.findMany({
        where: {
            id_status: TASK_STATUS.EN_CAMINO,
            id_promoter: { not: null },
            dt_update: { lte: cutoff },
        },
        include: {
            promoter: { select: { id: true, name: true, fcm_token: true } },
            store: { select: { id_store: true, name: true } },
        },
    })

    if (expiredTasks.length === 0) {
        console.log('[EnRouteTimeout] Sin tareas "en camino" que hayan superado las 2h.')
        return
    }

    console.log(`[EnRouteTimeout] ${expiredTasks.length} tarea(s) superaron las 2h en camino sin iniciar. Reasignando...`)

    for (const task of expiredTasks) {
        const id_promoter = task.id_promoter!

        try {
            // 1. Registrar el rechazo del promotor para esta tarea, para que el
            // ranking no se la vuelva a ofrecer.
            await prisma.task_rejections.upsert({
                where: { id_task_id_promoter: { id_task: task.id_task, id_promoter } },
                update: { reason: 'timeout' },
                create: { id_task: task.id_task, id_promoter, reason: 'timeout' },
            })

            // 2. Desvincular al promotor y regresar la tarea a "creada" (disponible).
            await prisma.tasks.update({
                where: { id_task: task.id_task },
                data: {
                    id_promoter: null,
                    id_status: TASK_STATUS.CREADO,
                    i_current_cycle: 0,
                    dt_next_retry: null,
                    dt_update: new Date(),
                },
            })

            console.log(`[EnRouteTimeout] Tarea ${task.id_task} (folio ${task.vc_folio}): promotor ${id_promoter} desvinculado y registrado en task_rejections. Tarea vuelve a estatus CREADO.`)

            // 3. Avisarle al promotor que perdió la tarea (mejor esfuerzo, no bloquea el resto).
            if (task.promoter?.fcm_token) {
                try {
                    await NotificationService.sendPushNotification(task.promoter.fcm_token, {
                        title: 'Tarea reasignada',
                        body: `Se agotó el tiempo para iniciar la tarea en ${task.store.name} y fue reasignada a otro promotor.`,
                        data: { type: 'task_timeout' },
                    })
                } catch (error) {
                    console.error(`[EnRouteTimeout] Error al notificar al promotor ${id_promoter} sobre la reasignación:`, error)
                }
            }

            // 4. Disparar el ranking de inmediato para ofrecerla a otros promotores,
            // igual que al crear una tarea nueva (mismo job, mismo jobId determinístico).
            await taskRankingQueue.add('rank_promoters', {
                id_task: task.id_task,
                id_store: task.id_store,
                cycle: 0,
            }, {
                jobId: `rank_task_${task.id_task}_cycle_0`,
            })
        } catch (error) {
            console.error(`[EnRouteTimeout] Error al procesar timeout de la tarea ${task.id_task}:`, error)
        }
    }
}, { connection: connectionWorker })

enRouteTimeoutWorker.on('failed', (job, err) => {
    console.error(`[EnRouteTimeout] Job ${job?.id} falló:`, err.message)
})

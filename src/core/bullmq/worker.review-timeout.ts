import { Worker, Job } from 'bullmq'
import { connectionWorker } from './conection'
import { prisma } from '../prisma'
import { NotificationService } from '../../services/notification.service'

// Estatus reales de tarea (ver comentario de fuente de verdad en
// webs/promotoria-saas/src/modules/tareas/utils.ts): 6 = En revisión, 7 = Terminada con éxito.
const EN_REVISION = 6
const TERMINADA_CON_EXITO = 7

export const reviewTimeoutWorker = new Worker('review_timeout_queue', async (job: Job) => {
    const settings = await prisma.task_settings.findUnique({ where: { id_setting: 1 } })
    const timeoutHours = settings?.i_review_timeout_hours ?? 24

    const cutoff = new Date(Date.now() - timeoutHours * 60 * 60 * 1000)

    const expiredTasks = await prisma.tasks.findMany({
        where: {
            id_status: EN_REVISION,
            dt_update: { lte: cutoff },
        },
        include: {
            promoter: { select: { id: true, fcm_token: true } },
            store: { select: { name: true } },
        },
    })

    if (expiredTasks.length === 0) {
        console.log(`[ReviewTimeout] Sin tareas en revisión que hayan superado las ${timeoutHours}h.`)
        return
    }

    console.log(`[ReviewTimeout] ${expiredTasks.length} tarea(s) superaron las ${timeoutHours}h en revisión. Auto-aprobando...`)

    for (const task of expiredTasks) {
        try {
            await prisma.tasks.update({
                where: { id_task: task.id_task },
                data: { id_status: TERMINADA_CON_EXITO, dt_update: new Date() },
            })

            console.log(`[ReviewTimeout] Tarea ${task.id_task} (folio ${task.vc_folio}) auto-aprobada por vencimiento del plazo de revisión.`)

            if (task.promoter?.fcm_token) {
                try {
                    await NotificationService.sendPushNotification(task.promoter.fcm_token, {
                        title: 'Tarea aprobada automáticamente',
                        body: `Tu tarea en ${task.store.name} fue aprobada automáticamente al no recibir respuesta del cliente a tiempo.`,
                        data: { type: 'task_auto_approved' },
                    })
                } catch (error) {
                    console.error(`[ReviewTimeout] Error al notificar al promotor sobre la tarea ${task.id_task}:`, error)
                }
            }
        } catch (error) {
            console.error(`[ReviewTimeout] Error al auto-aprobar la tarea ${task.id_task}:`, error)
        }
    }
}, { connection: connectionWorker })

reviewTimeoutWorker.on('failed', (job, err) => {
    console.error(`[ReviewTimeout] Job ${job?.id} falló:`, err.message)
})

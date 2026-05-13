import { Worker, Job } from 'bullmq'
import { connectionWorker } from './conection'
import { TASK_NOTIF_QUEUE_NAME } from './task-notifications.queue'
import { processUnassignedTasks } from './task-notification.service'

const taskNotificationsWorker = new Worker(
    TASK_NOTIF_QUEUE_NAME,
    async (job: Job) => {
        console.log(`[TaskNotifWorker] Procesando job ${job.id}`)
        await processUnassignedTasks()
    },
    { connection: connectionWorker },
)

taskNotificationsWorker.on('completed', (job) => {
    console.log(`[TaskNotifWorker] Job ${job.id} completado`)
})

taskNotificationsWorker.on('failed', (job, err) => {
    console.error(`[TaskNotifWorker] Job ${job?.id} falló:`, err.message)
})

export default taskNotificationsWorker
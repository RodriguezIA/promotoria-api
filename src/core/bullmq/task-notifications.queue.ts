import { Queue } from 'bullmq'
import { connectionQueue } from './conection'

export const TASK_NOTIF_QUEUE_NAME = 'task_notifications'

export const taskNotificationsQueue = new Queue(TASK_NOTIF_QUEUE_NAME, {
    connection: connectionQueue,
    defaultJobOptions: {
        removeOnComplete: 100,
        removeOnFail: 200,
    },
})

const SCHEDULER_JOB_ID = 'task_notification_scheduler'

const DEV_INTERVAL_MS = 60_000
const PROD_INTERVAL_MS = 30 * 60_000
const REPEAT_INTERVAL_MS = process.env.NODE_ENV === 'production' ? PROD_INTERVAL_MS : DEV_INTERVAL_MS

export async function startTaskNotificationScheduler(): Promise<void> {
    // const REPEAT_INTERVAL_MS = 30 * 60_000; // 30 min en prod
    await taskNotificationsQueue.add(
        SCHEDULER_JOB_ID,
        {},
        {
            repeat: { every: REPEAT_INTERVAL_MS },
            jobId: SCHEDULER_JOB_ID,
        },
    )
    console.log(`[TaskNotifQueue] Scheduler recurrente configurado — cada ${REPEAT_INTERVAL_MS / 1000}s`)
}
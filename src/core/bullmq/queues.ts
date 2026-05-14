import { Queue } from 'bullmq'
import { connectionQueue } from './conection'


// 1 QEUEUE de cronner buscador de taresa sin asignacion de promotor
export const schedulerTasksUnsiggnedQueue = new Queue('scheduler_task_unsigned_queue', { connection: connectionQueue })

// 2 QUEUE de asignaccion de  promootor para tarea
export const taskRankingQueue = new Queue('task_ranking_queue', {connection: connectionQueue})

//  3 QUEUE de push notifications
export const pushNotificationsQueue = new Queue('push_notification_queue', {connection: connectionQueue})


export async function startTaskNotificacitonScheduler(): Promise<void> {
    const REPEAT_INTERVAL_MS = process.env.NODE_ENV === 'production' ? 30 * 60_000 : 60_000;

    await schedulerTasksUnsiggnedQueue.add('find_unassigned_tasks', {}, {
        repeat: { 
            every: REPEAT_INTERVAL_MS,
            immediately: true
        },
        jobId: 'scheduler_cron_job',
    });

    console.log(`[Queues] Scheduler configurado cada ${REPEAT_INTERVAL_MS / 1000}s`);
}
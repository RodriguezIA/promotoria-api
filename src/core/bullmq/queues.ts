import { Queue } from 'bullmq'
import { connectionQueue } from './conection'


// 1 QEUEUE de cronner buscador de taresa sin asignacion de promotor
export const schedulerTasksUnsiggnedQueue = new Queue('scheduler_task_unsigned_queue', { connection: connectionQueue })

// 2 QUEUE de asignaccion de  promootor para tarea
export const taskRankingQueue = new Queue('task_ranking_queue', {connection: connectionQueue})

//  3 QUEUE de push notifications
export const pushNotificationsQueue = new Queue('push_notification_queue', {connection: connectionQueue})

//  4 QUEUE de facturación semanal (cobros a clientes + pagos a promotores)
export const billingQueue = new Queue('billing_queue', { connection: connectionQueue })

//  5 QUEUE de timeout de tareas "en camino" (2h sin iniciar tarea = se reasigna)
export const enRouteTimeoutQueue = new Queue('en_route_timeout_queue', { connection: connectionQueue })

//  6 QUEUE de timeout de revisión de tareas por el cliente (auto-aprobar si no responde a tiempo)
export const reviewTimeoutQueue = new Queue('review_timeout_queue', { connection: connectionQueue })


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

export async function startEnRouteTimeoutScheduler(): Promise<void> {
    // Cada 10 min alcanza sobra para una ventana de 2h; no hace falta más precisión.
    const REPEAT_INTERVAL_MS = 10 * 60_000;

    await enRouteTimeoutQueue.add('check_en_route_timeouts', {}, {
        repeat: {
            every: REPEAT_INTERVAL_MS,
            immediately: true
        },
        jobId: 'en_route_timeout_cron_job',
    });

    console.log(`[Queues] Timeout de "en camino" configurado cada ${REPEAT_INTERVAL_MS / 1000}s`);
}

export async function startBillingScheduler(): Promise<void> {
    // Semanal en producción; en desarrollo cada 6h. La generación es idempotente
    // (solo procesa tareas completadas que aún no han sido cobradas/pagadas).
    const REPEAT_INTERVAL_MS = process.env.NODE_ENV === 'production' ? 7 * 24 * 60 * 60_000 : 6 * 60 * 60_000;

    await billingQueue.add('weekly_billing', {}, {
        repeat: {
            every: REPEAT_INTERVAL_MS,
            immediately: false,
        },
        jobId: 'billing_cron_job',
    });

    console.log(`[Queues] Billing scheduler configurado cada ${REPEAT_INTERVAL_MS / 1000}s`);
}

export async function startReviewTimeoutScheduler(): Promise<void> {
    // Cada 15 min es suficiente precisión para una ventana medida en horas.
    const REPEAT_INTERVAL_MS = 15 * 60_000;

    await reviewTimeoutQueue.add('check_review_timeouts', {}, {
        repeat: {
            every: REPEAT_INTERVAL_MS,
            immediately: true
        },
        jobId: 'review_timeout_cron_job',
    });

    console.log(`[Queues] Timeout de revisión de tareas configurado cada ${REPEAT_INTERVAL_MS / 1000}s`);
}
import { schedulerTasksUnsiggnedQueue, taskRankingQueue, pushNotificationsQueue, billingQueue, enRouteTimeoutQueue, reviewTimeoutQueue, startTaskNotificacitonScheduler, startBillingScheduler, startEnRouteTimeoutScheduler, startReviewTimeoutScheduler } from './queues'

// 👇 Cámbialos a este formato para que Node los ejecute sí o sí
import './worker.schedulerTasksUnsiggned'
import './worker.task-ranking'
import './worker.push-notifications'
import './worker.en-route-timeout'
import './worker.review-timeout'

export const queues = [schedulerTasksUnsiggnedQueue, taskRankingQueue, pushNotificationsQueue, billingQueue, enRouteTimeoutQueue, reviewTimeoutQueue];
export { startTaskNotificacitonScheduler, startBillingScheduler, startEnRouteTimeoutScheduler, startReviewTimeoutScheduler };
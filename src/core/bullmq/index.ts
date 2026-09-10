import { schedulerTasksUnsiggnedQueue, taskRankingQueue, pushNotificationsQueue, billingQueue, enRouteTimeoutQueue, reviewTimeoutQueue, orderAutoCloseQueue, startTaskNotificacitonScheduler, startBillingScheduler, startEnRouteTimeoutScheduler, startReviewTimeoutScheduler, startOrderAutoCloseScheduler } from './queues'

// 👇 Cámbialos a este formato para que Node los ejecute sí o sí
import './worker.schedulerTasksUnsiggned'
import './worker.task-ranking'
import './worker.push-notifications'
import './worker.en-route-timeout'
import './worker.review-timeout'
import './worker.order-auto-close'

export const queues = [schedulerTasksUnsiggnedQueue, taskRankingQueue, pushNotificationsQueue, billingQueue, enRouteTimeoutQueue, reviewTimeoutQueue, orderAutoCloseQueue];
export { startTaskNotificacitonScheduler, startBillingScheduler, startEnRouteTimeoutScheduler, startReviewTimeoutScheduler, startOrderAutoCloseScheduler };
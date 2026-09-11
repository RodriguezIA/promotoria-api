import { schedulerTasksUnsiggnedQueue, taskRankingQueue, pushNotificationsQueue, billingQueue, enRouteTimeoutQueue, reviewTimeoutQueue, orderAutoCloseQueue, routeScheduleQueue, startTaskNotificacitonScheduler, startBillingScheduler, startEnRouteTimeoutScheduler, startReviewTimeoutScheduler, startOrderAutoCloseScheduler, startRouteScheduleScheduler } from './queues'

// 👇 Cámbialos a este formato para que Node los ejecute sí o sí
import './worker.schedulerTasksUnsiggned'
import './worker.task-ranking'
import './worker.push-notifications'
import './worker.en-route-timeout'
import './worker.review-timeout'
import './worker.order-auto-close'
import './worker.route-schedule'

export const queues = [schedulerTasksUnsiggnedQueue, taskRankingQueue, pushNotificationsQueue, billingQueue, enRouteTimeoutQueue, reviewTimeoutQueue, orderAutoCloseQueue, routeScheduleQueue];
export { startTaskNotificacitonScheduler, startBillingScheduler, startEnRouteTimeoutScheduler, startReviewTimeoutScheduler, startOrderAutoCloseScheduler, startRouteScheduleScheduler };
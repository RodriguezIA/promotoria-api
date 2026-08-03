import { schedulerTasksUnsiggnedQueue, taskRankingQueue, pushNotificationsQueue, billingQueue, enRouteTimeoutQueue, startTaskNotificacitonScheduler, startBillingScheduler, startEnRouteTimeoutScheduler } from './queues'

// 👇 Cámbialos a este formato para que Node los ejecute sí o sí
import './worker.schedulerTasksUnsiggned'
import './worker.task-ranking'
import './worker.push-notifications'
import './worker.en-route-timeout'

export const queues = [schedulerTasksUnsiggnedQueue, taskRankingQueue, pushNotificationsQueue, billingQueue, enRouteTimeoutQueue];
export { startTaskNotificacitonScheduler, startBillingScheduler, startEnRouteTimeoutScheduler };
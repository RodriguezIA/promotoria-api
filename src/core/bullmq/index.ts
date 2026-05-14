import { schedulerTasksUnsiggnedQueue, taskRankingQueue, pushNotificationsQueue, startTaskNotificacitonScheduler } from './queues'

// 👇 Cámbialos a este formato para que Node los ejecute sí o sí
import './worker.schedulerTasksUnsiggned'
import './worker.task-ranking'
import './worker.push-notifications'

export const queues = [schedulerTasksUnsiggnedQueue, taskRankingQueue, pushNotificationsQueue];
export { startTaskNotificacitonScheduler };
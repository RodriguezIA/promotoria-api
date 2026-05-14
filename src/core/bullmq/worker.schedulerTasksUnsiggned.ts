import { Worker, Job } from 'bullmq'
import { connectionWorker } from './conection'
import { taskRankingQueue } from './queues'
import { prisma } from '../prisma'

export const schedulerWorker = new Worker('scheduler_task_unsigned_queue', async (job: Job) => {

    const tasks = await prisma.tasks.findMany({
        where: { id_status: 1, id_promoter: null,
            OR: [
                { dt_next_retry: null },
                { dt_next_retry: { lte: new Date() }}
            ]
        },
        select: { id_task: true, id_store: true, i_current_cycle: true }
    });

    if (tasks.length > 0) {
        console.log(`[Scheduler] Encontradas ${tasks.length} tareas. Encolando para ranqueo...`);
        for (const task of tasks) {
            await taskRankingQueue.add('rank_promoters', {
                id_task: task.id_task,
                id_store: task.id_store,
                cycle: task.i_current_cycle
            }, {
                jobId: `rank_task_${task.id_task}_cycle_${task.i_current_cycle}`
            });
        }
    }
    
}, { connection: connectionWorker });
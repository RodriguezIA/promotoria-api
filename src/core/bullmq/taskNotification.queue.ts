import { Queue } from "bullmq";

import { registerDynamicQueue } from '../../queues/helpers/bullboard.ts'
import { connectionQueue } from "./conection";

// Cola dinámica por orden + ciclo
// Nombre: task_notif_order_{id_order}_{ciclo}
export function getTaskNotifQueue(id_order: number, ciclo: number): Queue {
    const queueName = `task_notif_order_${id_order}_${ciclo}`;
    const queue = new Queue(queueName, {
        connection: connectionQueue,
        defaultJobOptions: {
            removeOnComplete: 50,
            removeOnFail: 100,
        }
    });

    registerDynamicQueue(queue);
    return queue;
}
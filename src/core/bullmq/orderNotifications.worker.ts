import { Worker, Job } from "bullmq";
import { connectionWorker } from "./conection";
import { prisma } from "../prisma";
import { getTaskNotifQueue } from "./taskNotification.queue";
import { startTaskNotifWorker } from "./taskNotifications.worker";
import { getCicloConfig } from "../../queues/helpers/cycles";

export interface OrderNotifJobData {
    id_order: number;
    ciclo?: number;
}

const orderNotificationsWorker = new Worker(
    "order_notifications",
    async (job: Job<OrderNotifJobData>) => {
        const { id_order } = job.data;

        console.log(`[OrderNotif] Procesando orden ${id_order}`);

        // Buscar tareas activas sin promotor de esta orden
        const tareasSinPromotor = await prisma.tasks.findMany({
            where: {
                id_order,
                id_promoter: null,
                id_status: 1, // activa
            },
            select: { id_task: true, id_store: true, id_request: true }
        });

        console.log("[OrderNotif] Tareas sin promotor:", tareasSinPromotor.length)

        if (tareasSinPromotor.length === 0) {
            console.log(`[OrderNotif] Orden ${id_order} sin tareas pendientes, se omite.`);
            return;
        }

        // Ciclo 1 por defecto al enqueue desde la orden
        const ciclo = job.data.ciclo ?? 1;
        const cicloConfig = getCicloConfig(ciclo);

        if (!cicloConfig) {
            console.log(`[OrderNotif] Orden ${id_order} superó todos los ciclos.`);
            return;
        }

        // Crear cola dinámica para esta orden+ciclo
        const taskQueue = getTaskNotifQueue(id_order, ciclo);
        startTaskNotifWorker(id_order, ciclo);

        // Encolar un job por cada tarea sin promotor
        for (const tarea of tareasSinPromotor) {
            await taskQueue.add(
                `task_${tarea.id_task}`,
                {
                    id_task: tarea.id_task,
                    id_store: tarea.id_store,
                    id_order,
                    ciclo,
                },
                {
                    jobId: `task_${tarea.id_task}_ciclo_${ciclo}`, // evita duplicados
                }
            );
            console.log(`[OrderNotif] Task ${tarea.id_task} encolada en ciclo ${ciclo}`);
        }

        // Re-encolar la orden para el siguiente ciclo con delay.
        // A partir del ciclo 4 el radio ya no crece, pero se sigue encolando.
        const nextCiclo = ciclo + 1;
        const nextCicloConfig = getCicloConfig(nextCiclo);
        if (nextCicloConfig) {
            const { orderNotificationsQueue } = await import("./ordersNotification.queue");
            await orderNotificationsQueue.add(
                `order_${id_order}_ciclo_${nextCiclo}`,
                { id_order, ciclo: nextCiclo },
                {
                    delay: nextCicloConfig.delayMs,
                    jobId: `order_${id_order}_ciclo_${nextCiclo}`,
                }
            );
            console.log(`[OrderNotif] Orden ${id_order} re-encolada para ciclo ${nextCiclo} en ${nextCicloConfig.delayMs}ms`);
        }
    },
    { connection: connectionWorker }
);

orderNotificationsWorker.on("completed", (job) => {
    console.log(`[OrderNotif] Job ${job.id} completado`);
});

orderNotificationsWorker.on("failed", (job, err) => {
    console.error(`[OrderNotif] Job ${job?.id} falló:`, err.message);
});

export default orderNotificationsWorker;
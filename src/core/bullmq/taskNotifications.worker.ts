import { Worker, Job } from "bullmq";
import { connectionWorker } from "./conection";
import { prisma } from "../prisma";
import { haversineMeters } from "../../queues/helpers/haversine";
import { getCicloConfig, PUSH_INTERVAL_MS } from "../../queues/helpers/cycles";
import { NotificationService } from "../../services/notification.service";

export interface TaskNotifJobData {
    id_task: number;
    id_store: number;
    id_order: number;
    ciclo: number;
}

// Mapa de workers dinámicos ya creados, para no duplicar
const activeWorkers = new Map<string, Worker>();

export function startTaskNotifWorker(id_order: number, ciclo: number) {
    const queueName = `task_notif_order_${id_order}_${ciclo}`;

    if (activeWorkers.has(queueName)) return; // ya existe

    const worker = new Worker<TaskNotifJobData>(
        queueName,
        async (job: Job<TaskNotifJobData>) => {
            const { id_task, id_store, ciclo } = job.data;

            console.log(`[TaskNotif] Procesando tarea ${id_task} ciclo ${ciclo}`);

            // 1. Verificar que la tarea sigue sin promotor
            const tarea = await prisma.tasks.findUnique({
                where: { id_task },
                select: { id_promoter: true, id_status: true }
            });

            if (!tarea || tarea.id_promoter !== null || tarea.id_status !== 1) {
                console.log(`[TaskNotif] Tarea ${id_task} ya fue atendida o inactiva. Se omite.`);
                return;
            }

            await prisma.tasks.update({
                where: { id_task },
                data: { i_notification_count: { increment: 1 } }
            });

            // 2. Obtener coordenadas de la tienda desde addresses
            const storeAddress = await prisma.addresses.findFirst({
                where: {
                    entity_type: "store",
                    entity_id: id_store,
                    is_active: true,
                },
                select: { latitude: true, longitude: true }
            });

            if (!storeAddress?.latitude || !storeAddress?.longitude) {
                console.warn(`[TaskNotif] Tienda ${id_store} sin coordenadas. Se omite.`);
                return;
            }

            const storeLat = Number(storeAddress.latitude);
            const storeLon = Number(storeAddress.longitude);

            // 3. Obtener config del ciclo actual
            const cicloConfig = getCicloConfig(ciclo);
            if (!cicloConfig) return;

            // 4. Buscar promotores activos con ubicación
            const promotores = await prisma.promoters.findMany({
                where: {
                    isActive: true,
                    latitude: { not: null },
                    longitude: { not: null },
                    fcm_token: { not: null },
                },
                select: {
                    id: true,
                    name: true,
                    fcm_token: true,
                    latitude: true,
                    longitude: true,
                    dt_register: true,
                },
                orderBy: { dt_register: "asc" } // más antiguos primero
            });

            // 5. Filtrar por radio y verificar que no hayan rechazado la tarea
            const rechazos = await prisma.task_rejections.findMany({
                where: { id_task },
                select: { id_promoter: true }
            });
            const rechazadosSet = new Set(rechazos.map(r => r.id_promoter));

            const promotoresCercanos = promotores.filter(p => {
                if (rechazadosSet.has(p.id)) return false;
                const distancia = haversineMeters(
                    storeLat, storeLon,
                    Number(p.latitude), Number(p.longitude)
                );
                return distancia <= cicloConfig.radioMetros;
            });

            if (promotoresCercanos.length === 0) {
                console.log(`[TaskNotif] Sin promotores en radio ${cicloConfig.radioMetros}m para tarea ${id_task}`);
                return;
            }

            // 6. Enviar push cada 30s, detenerse si alguien acepta
            for (const promotor of promotoresCercanos) {
                // Re-verificar que sigue sin promotor antes de cada envío
                const tareaActual = await prisma.tasks.findUnique({
                    where: { id_task },
                    select: { id_promoter: true }
                });

                if (tareaActual?.id_promoter !== null) {
                    console.log(`[TaskNotif] Tarea ${id_task} aceptada durante el ciclo. Deteniendo.`);
                    return;
                }

                await NotificationService.sendPushNotification(
                    promotor.fcm_token!,
                    {
                        title: "Nueva tarea disponible",
                        body: `Hay una tarea cerca de ti. ¡Revísala ahora!`,
                        data: {
                            id_task: String(id_task),
                            type: "new_task",
                        }
                    }
                );

                console.log(`[TaskNotif] Push enviada a promotor ${promotor.id} para tarea ${id_task}`);

                // Esperar 30s antes del siguiente promotor
                await new Promise(res => setTimeout(res, PUSH_INTERVAL_MS));
            }
        },
        { connection: connectionWorker }
    );

    worker.on("completed", (job) => {
        console.log(`[TaskNotif][${queueName}] Job ${job.id} completado`);
    });

    worker.on("failed", (job, err) => {
        console.error(`[TaskNotif][${queueName}] Job ${job?.id} falló:`, err.message);
    });

    activeWorkers.set(queueName, worker);
    console.log(`[TaskNotif] Worker iniciado para cola ${queueName}`);
}
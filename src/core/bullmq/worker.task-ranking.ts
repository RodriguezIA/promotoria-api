import { Worker, Job } from 'bullmq'
import { connectionWorker } from './conection'
import { pushNotificationsQueue } from './queues'
import { prisma } from '../prisma'
import { haversineMeters } from '../../queues/helpers/haversine'
import { getCicloConfig, PUSH_INTERVAL_MS } from '../../queues/helpers/cycles'

export const taskRankingWorker = new Worker('task_ranking_queue', async (job: Job) => {
    const { id_task, id_store, cycle } = job.data;
    const nextCycle = cycle + 1;
    const cycleConfig = getCicloConfig(nextCycle);

    // if (!cycleConfig) return; // Superó los ciclos máximos

    const store = await prisma.addresses.findFirst({
        where: { entity_type: 'store', entity_id: id_store, is_active: true },
        select: { latitude: true, longitude: true }
    });

    if (!store?.latitude || !store?.longitude) {
        console.warn(`[Ranking] Tienda ${id_store} sin coordenadas. Avanzando ciclo para evitar bucle infinito.`);
        await prisma.tasks.update({ where: { id_task }, data: { i_current_cycle: nextCycle } });
        return;
    }

    // Obtener rechazos previos
    const rejections = await prisma.task_rejections.findMany({ where: { id_task } });
    const rejectedSet = new Set(rejections.map(r => r.id_promoter));

    // Obtener promotores ordenados por antigüedad (el que se registró primero va primero)
    const promoters = await prisma.promoters.findMany({
        where: { isActive: true, fcm_token: { not: null }, latitude: { not: null }, longitude: { not: null } },
        orderBy: { dt_register: 'asc' } // <-- Tu lógica de ranqueo actual
    });

    // Filtrar por distancia según el ciclo
    const candidates = promoters.filter(p => {
        if (rejectedSet.has(p.id)) return false;
        const distance = haversineMeters(Number(store.latitude), Number(store.longitude), Number(p.latitude), Number(p.longitude));
        return distance <= cycleConfig.radioMetros;
    });

    if (candidates.length === 0) {
        // Avanzamos el ciclo directo en DB si no hay nadie
        await prisma.tasks.update({ where: { id_task }, data: { i_current_cycle: nextCycle } });
        return;
    }

    console.log(`[Ranking] Tarea ${id_task}: Encontrados ${candidates.length} promotores. Encolando pushes...`);

    // Encolar los push notifications usando la propiedad nativa "delay" de BullMQ
    for (let i = 0; i < candidates.length; i++) {
        const promoter = candidates[i];
        
        await pushNotificationsQueue.add('send_push', {
            id_task,
            id_promoter: promoter.id,
            fcm_token: promoter.fcm_token
        }, {
            delay: i * (PUSH_INTERVAL_MS || 10000),
            removeOnComplete: 100, // 👈 Guarda el historial de los últimos 100 envíos exitosos
            removeOnFail: 500      // 👈 Opcional: Guarda hasta 500 errores si Firebase falla
        });
    }

    // Actualizamos el ciclo para que el Scheduler lo sepa la próxima vez
    await prisma.tasks.update({ where: { id_task }, data: { i_current_cycle: nextCycle } });

}, { connection: connectionWorker, concurrency: 5 });
import { prisma } from '../prisma'
import { haversineMeters } from '../../queues/helpers/haversine'
import { NOTIFICATION_CYCLES, getCicloConfig, PUSH_INTERVAL_MS } from '../../queues/helpers/cycles'
import { NotificationService } from '../../services/notification.service'

const MAX_CYCLES = NOTIFICATION_CYCLES.length

export async function processUnassignedTasks(): Promise<void> {
    const tasks = await prisma.tasks.findMany({
        where: {
            id_status: 1,
            id_promoter: null,
            i_current_cycle: { lt: MAX_CYCLES },
        },
        select: {
            id_task: true,
            id_store: true,
            i_current_cycle: true,
        },
    })

    if (tasks.length === 0) return

    console.log(`[TaskNotifService] Procesando ${tasks.length} tareas sin promotor`)

    for (const task of tasks) {
        await processTask(task.id_task, task.id_store, task.i_current_cycle)
    }
}

async function processTask(id_task: number, id_store: number, currentCycle: number): Promise<void> {
    const cycle = currentCycle + 1
    const cycleConfig = getCicloConfig(cycle)

    if (!cycleConfig) {
        console.log(`[TaskNotifService] Tarea ${id_task} superó todos los ciclos (${cycle})`)
        return
    }

    const stillUnassigned = await prisma.tasks.findUnique({
        where: { id_task },
        select: { id_promoter: true, id_status: true },
    })

    if (!stillUnassigned || stillUnassigned.id_promoter !== null || stillUnassigned.id_status !== 1) {
        console.log(`[TaskNotifService] Tarea ${id_task} ya fue atendida. Se omite.`)
        return
    }

    const storeAddress = await prisma.addresses.findFirst({
        where: {
            entity_type: 'store',
            entity_id: id_store,
            is_active: true,
        },
        select: { latitude: true, longitude: true },
    })

    if (!storeAddress?.latitude || !storeAddress?.longitude) {
        console.warn(`[TaskNotifService] Tienda ${id_store} sin coordenadas. Se omite tarea ${id_task}.`)
        return
    }

    const storeLat = Number(storeAddress.latitude)
    const storeLon = Number(storeAddress.longitude)

    const rejections = await prisma.task_rejections.findMany({
        where: { id_task },
        select: { id_promoter: true },
    })
    const rejectedSet = new Set(rejections.map(r => r.id_promoter))

    const promoters = await prisma.promoters.findMany({
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
        orderBy: { dt_register: 'asc' },
    })

    const nearbyPromoters = promoters.filter(p => {
        if (rejectedSet.has(p.id)) return false
        const distance = haversineMeters(
            storeLat, storeLon,
            Number(p.latitude!), Number(p.longitude!),
        )
        return distance <= cycleConfig.radioMetros
    })

    if (nearbyPromoters.length === 0) {
        console.log(`[TaskNotifService] Tarea ${id_task} ciclo ${cycle} — sin promotores en radio ${cycleConfig.radioMetros}m. Avanzando ciclo.`)
        await prisma.tasks.update({
            where: { id_task },
            data: { i_current_cycle: cycle },
        })
        return
    }

    for (const promoter of nearbyPromoters) {
        const check = await prisma.tasks.findUnique({
            where: { id_task },
            select: { id_promoter: true },
        })

        if (check?.id_promoter !== null) {
            console.log(`[TaskNotifService] Tarea ${id_task} aceptada por promotor ${check?.id_promoter}. Deteniendo notificaciones.`)
            return
        }

        try {
            await NotificationService.sendPushNotification(promoter.fcm_token!, {
                title: 'Nueva tarea disponible',
                body: 'Hay una tarea cerca de ti. ¡Revísala ahora!',
                data: {
                    id_task: String(id_task),
                    type: 'new_task',
                },
            })

            console.log(`[TaskNotifService] Push enviada a promotor ${promoter.id} para tarea ${id_task} ciclo ${cycle}`)

            await prisma.tasks.update({
                where: { id_task },
                data: { i_notification_count: { increment: 1 } },
            })
        } catch (err) {
            console.error(`[TaskNotifService] Error enviando push a promotor ${promoter.id}:`, err)
        }

        if (promoter !== nearbyPromoters[nearbyPromoters.length - 1]) {
            await new Promise(res => setTimeout(res, PUSH_INTERVAL_MS))
        }
    }

    await prisma.tasks.update({
        where: { id_task },
        data: { i_current_cycle: cycle },
    })

    console.log(`[TaskNotifService] Tarea ${id_task} ciclo ${cycle} completado. Avanzando a ciclo ${cycle + 1}.`)
}
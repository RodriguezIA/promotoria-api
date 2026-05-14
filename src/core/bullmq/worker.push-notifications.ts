import { Worker, Job } from 'bullmq'
import { connectionWorker } from './conection'
import { prisma } from '../prisma'
import { NotificationService } from '../../services/notification.service'

export const pushNotificationWorker = new Worker('push_notification_queue', async (job: Job) => {
    const { id_task, id_promoter, fcm_token } = job.data;

    // 1. Verificación de seguridad: ¿Alguien más ya aceptó la tarea mientras este job esperaba su "delay"?
    const taskCheck = await prisma.tasks.findUnique({
        where: { id_task },
        select: { id_promoter: true }
    });

    if (taskCheck?.id_promoter !== null) {
        console.log(`[PushWorker] Abortando envío a promotor ${id_promoter}. La tarea ${id_task} ya fue tomada.`);
        return; 
    }

    // 2. Enviar la notificación
    try {
        await NotificationService.sendPushNotification(fcm_token, {
            title: 'Nueva tarea disponible',
            body: 'Hay una tarea cerca de ti. ¡Revísala ahora!',
            data: { id_task: String(id_task), type: 'new_task' }
        });

        await prisma.tasks.update({
            where: { id_task },
            data: { i_notification_count: { increment: 1 } }
        });

        console.log(`[PushWorker] Notificación enviada al promotor ${id_promoter}`);

    } catch (error: any) {
        console.error(`[PushWorker] Error enviando a promotor ${id_promoter}: ${error.message}`);
        
        // Aquí aplicamos la solución de tu FCM Token inválido que vimos antes
        if (error.code === 'messaging/registration-token-not-registered') {
            console.log(`[PushWorker]  Limpiando token inválido del promotor ${id_promoter}`);
            await prisma.promoters.update({
                where: { id: id_promoter },
                data: { fcm_token: null }
            });
        }
    }
}, { connection: connectionWorker, concurrency: 3 }); // Podemos enviar varias notificaciones simultáneas
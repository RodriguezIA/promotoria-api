import cron from 'node-cron';
import db from '../config/database';
import { NotificationService } from '../services/notification.service';

// Radio en km según cuántas veces el job ha procesado la tarea sin asignar promotor
function getRadiusKm(notificationCount: number): number {
  if (notificationCount <= 1) return 1;
  if (notificationCount <= 2) return 3;
  if (notificationCount <= 4) return 7;
  if (notificationCount <= 6) return 15;
  return 30;
}

async function processUnassignedTasks() {
  try {
    // 1. Obtener tareas sin promotor asignado con la info de su tienda
    const tasks = await db.select<any[]>(`
      SELECT
        t.id_task,
        t.i_notification_count,
        s.latitude  AS store_lat,
        s.longitude AS store_lng,
        o.id_client
      FROM tasks t
      INNER JOIN stores s ON s.id_store = t.id_store
      INNER JOIN orders o ON o.id_order = t.id_order
      WHERE t.id_promoter IS NULL
        AND t.id_status = 1
        AND s.latitude IS NOT NULL
        AND s.longitude IS NOT NULL
    `);

    if (tasks.length === 0) return;

    for (const task of tasks) {

      // console.log( `[NearbyTaskJob] Procesando tarea ${task.id_task} — notificaciones previas: ${task.i_notification_count ?? 0}` );
      // console.log( `[NearbyTaskJob] Ubicación tienda (lat, lng): (${task.store_lat}, ${task.store_lng})` );

      const newCount = (task.i_notification_count ?? 0) + 1;
      const radiusKm = getRadiusKm(newCount);

      // 2. Incrementar contador de notificaciones en la tarea
      await db.execute(
        `UPDATE tasks SET i_notification_count = ? WHERE id_task = ?`,
        [newCount, task.id_task]
      );

      // 3. Buscar promotores activos dentro del radio, excluyendo quienes ya rechazaron esta tarea
      const nearbyPromoters = await db.select<any[]>(`
        SELECT
          p.id_promoter,
          p.vc_name,
          p.vc_fcm_token,
          (6371 * acos(
            cos(radians(?)) * cos(radians(p.f_latitude)) *
            cos(radians(p.f_longitude) - radians(?)) +
            sin(radians(?)) * sin(radians(p.f_latitude))
          )) AS distance_km
        FROM promoters p
        WHERE p.b_active = 1
          AND p.vc_fcm_token IS NOT NULL
          AND p.f_latitude IS NOT NULL
          AND p.f_longitude IS NOT NULL
          AND p.id_promoter NOT IN (
            SELECT id_promoter FROM task_rejections WHERE id_task = ?
          )
        HAVING distance_km <= ?
        ORDER BY distance_km ASC
      `, [task.store_lat, task.store_lng, task.store_lat, task.id_task, radiusKm]);

      // console.log( `[NearbyTaskJob] Tarea ${task.id_task} — promotores cercanos encontrados: ${nearbyPromoters.length} — radio ${radiusKm}km` );

      if (nearbyPromoters.length === 0) continue;

      const fcmTokens = nearbyPromoters.map((p: any) => p.vc_fcm_token);

      await NotificationService.sendMulticastNotification(fcmTokens, {
        title: '¡Nueva tarea disponible!',
        body: `Hay una tarea disponible cerca de ti (radio ${radiusKm} km). ¡Sé el primero en tomarla!`,
        data: {
          id_task: String(task.id_task),
          radius_km: String(radiusKm),
          notification_count: String(newCount),
        },
      });

      console.log(`[NearbyTaskJob] Tarea ${task.id_task} — notificación #${newCount} — radio ${radiusKm}km — ${fcmTokens.length} promotores`);
    }
  } catch (error) {
    console.error('[NearbyTaskJob] Error procesando tareas:', error);
  }
}

export function startNearbyTaskNotificationJob() {
  // Ejecuta cada 5 minutos
  cron.schedule('*/5 * * * *', () => {
  // cron.schedule('*/10 * * * * *', async () => {
    // console.log('[NearbyTaskJob] Buscando tareas sin promotor...');
    processUnassignedTasks();
  });

  console.log('[NearbyTaskJob] Job iniciado — corre cada 10 segundos para pruebas (ajustar a cada 5 minutos en producción)');
}

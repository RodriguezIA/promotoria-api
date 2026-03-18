import express, { Router, Request, Response } from "express";
import db from "../config/database";

const promotorRouter: Router = express.Router();

// ==================== HEALTH CHECK ====================

promotorRouter.get("/", (_req, res) => {
  res.status(200).json({ ok: true, message: "Mobile Promotor API is running" });
});

// ==================== UBICACIÓN ====================

// Actualizar ubicación del promotor
promotorRouter.post("/update-location", async (req: Request, res: Response): Promise<void> => {
  try {
    const { id_promoter, f_latitude, f_longitude } = req.body;
    if (!id_promoter || f_latitude === undefined || f_longitude === undefined) {
      res.status(400).json({ ok: false, error: "id_promoter, f_latitude y f_longitude son requeridos" });
      return;
    }
    await db.execute(
      `UPDATE promoters SET f_latitude = ?, f_longitude = ? WHERE id_promoter = ? AND b_active = 1`,
      [f_latitude, f_longitude, id_promoter]
    );
    res.status(200).json({ ok: true, message: "Ubicación actualizada" });
  } catch (error) {
    res.status(500).json({ ok: false, error: "Error actualizando ubicación" });
  }
});

// ==================== TAREAS ====================

/**
 * GET /tasks?id_promoter=X&id_status=Y
 * Lista de tareas de un promotor, con filtro opcional de estatus.
 *
 * Estatus: 1=Creado 2=Asignado 3=En camino 4=En ejecución 5=Enviado a validación 6=Terminado 7=Rechazado
 */
promotorRouter.get("/tasks", async (req: Request, res: Response): Promise<void> => {
  try {
    const { id_promoter, id_status } = req.query;
    if (!id_promoter) {
      res.status(400).json({ ok: false, error: "id_promoter es requerido" });
      return;
    }

    let query = `
      SELECT
        t.id_task,
        t.id_order,
        t.id_store,
        t.id_promoter,
        t.id_status,
        t.dt_register,
        t.dt_update,
        s.name      AS store_name,
        s.street    AS store_street,
        s.neighborhood AS store_neighborhood,
        s.municipality AS store_municipality,
        s.state     AS store_state,
        s.latitude  AS store_lat,
        s.longitude AS store_lng,
        r.vc_name   AS request_name
      FROM tasks t
      INNER JOIN stores  s ON s.id_store  = t.id_store
      INNER JOIN orders  o ON o.id_order  = t.id_order
      INNER JOIN requests r ON r.id_request = o.id_request
      WHERE t.id_promoter = ?
    `;
    const params: any[] = [id_promoter];

    if (id_status) {
      query += ` AND t.id_status = ?`;
      params.push(id_status);
    }

    query += ` ORDER BY t.dt_update DESC`;

    const tasks = await db.select<any[]>(query, params);
    res.status(200).json({ ok: true, data: tasks });
  } catch (error) {
    res.status(500).json({ ok: false, error: "Error obteniendo tareas" });
  }
});

/**
 * GET /tasks/:id_task
 * Detalle completo de una tarea: tienda (con lat/lng), solicitud, productos y preguntas con opciones.
 */
promotorRouter.get("/tasks/:id_task", async (req: Request, res: Response): Promise<void> => {
  try {
    const { id_task } = req.params;

    // 1. Cabecera de la tarea + tienda + request
    const taskRows = await db.select<any[]>(`
      SELECT
        t.id_task, t.id_order, t.id_store, t.id_promoter, t.id_status, t.i_notification_count,
        t.dt_register, t.dt_update,
        s.name          AS store_name,
        s.street        AS store_street,
        s.ext_number    AS store_ext_number,
        s.int_number    AS store_int_number,
        s.neighborhood  AS store_neighborhood,
        s.municipality  AS store_municipality,
        s.state         AS store_state,
        s.postal_code   AS store_postal_code,
        s.latitude      AS store_lat,
        s.longitude     AS store_lng,
        r.id_request,
        r.vc_name       AS request_name,
        r.f_value       AS request_value
      FROM tasks t
      INNER JOIN stores   s ON s.id_store   = t.id_store
      INNER JOIN orders   o ON o.id_order   = t.id_order
      INNER JOIN requests r ON r.id_request = o.id_request
      WHERE t.id_task = ?
    `, [id_task]);

    if (taskRows.length === 0) {
      res.status(404).json({ ok: false, error: "Tarea no encontrada" });
      return;
    }

    const task = taskRows[0];

    // 2. Productos de la solicitud
    const products = await db.select<any[]>(`
      SELECT
        rp.id_request_product,
        rp.id_product,
        rp.f_subtotal,
        p.name AS product_name
      FROM request_products rp
      INNER JOIN products p ON p.id_product = rp.id_product
      WHERE rp.id_request = ? AND rp.b_active = 1
    `, [task.id_request]);

    // 3. Preguntas por producto (con opciones si las tienen)
    for (const product of products) {
      const questions = await db.select<any[]>(`
        SELECT
          rpq.id_request_product_question,
          rpq.id_question,
          rpq.f_value AS precio_aplicado,
          rpq.f_value_promoter,
          q.question,
          q.question_type,
          q.promoter_earns,
          q.is_multiple,
          q.min_value,
          q.max_value,
          q.max_photos
        FROM request_product_questions rpq
        INNER JOIN questions q ON q.id_question = rpq.id_question
        WHERE rpq.id_request_product = ? AND rpq.b_active = 1
      `, [product.id_request_product]);

      // Opciones para preguntas tipo 'options'
      for (const question of questions) {
        if (question.question_type === 'options') {
          question.options = await db.select<any[]>(`
            SELECT id_option, option_text, option_value_numeric, option_value_text, option_order
            FROM question_options
            WHERE id_question = ? AND i_status = 1
            ORDER BY option_order ASC
          `, [question.id_question]);
        } else {
          question.options = [];
        }
      }

      product.questions = questions;
    }

    res.status(200).json({
      ok: true,
      data: {
        id_task: task.id_task,
        id_order: task.id_order,
        id_status: task.id_status,
        i_notification_count: task.i_notification_count,
        dt_register: task.dt_register,
        dt_update: task.dt_update,
        store: {
          id_store: task.id_store,
          name: task.store_name,
          street: task.store_street,
          ext_number: task.store_ext_number,
          int_number: task.store_int_number,
          neighborhood: task.store_neighborhood,
          municipality: task.store_municipality,
          state: task.store_state,
          postal_code: task.store_postal_code,
          latitude: task.store_lat,
          longitude: task.store_lng,
        },
        request: {
          id_request: task.id_request,
          name: task.request_name,
          value: task.request_value,
        },
        products,
      },
    });
  } catch (error) {
    console.error("Error en task detail:", error);
    res.status(500).json({ ok: false, error: "Error obteniendo detalle de tarea" });
  }
});

/**
 * POST /tasks/:id_task/accept
 * El promotor acepta una tarea → id_status 2 (Asignado)
 */
promotorRouter.post("/tasks/:id_task/accept", async (req: Request, res: Response): Promise<void> => {
  try {
    const { id_task } = req.params;
    const { id_promoter } = req.body;

    if (!id_promoter) {
      res.status(400).json({ ok: false, error: "id_promoter es requerido" });
      return;
    }

    // Verificar que la tarea no tenga ya un promotor
    const rows = await db.select<any[]>(
      `SELECT id_task, id_promoter FROM tasks WHERE id_task = ? AND id_status = 1`,
      [id_task]
    );

    if (rows.length === 0) {
      res.status(409).json({ ok: false, error: "La tarea no está disponible o ya fue asignada" });
      return;
    }

    await db.execute(
      `UPDATE tasks SET id_promoter = ?, id_status = 2, dt_update = NOW() WHERE id_task = ?`,
      [id_promoter, id_task]
    );

    res.status(200).json({ ok: true, message: "Tarea aceptada y asignada al promotor" });
  } catch (error) {
    res.status(500).json({ ok: false, error: "Error aceptando tarea" });
  }
});

/**
 * POST /tasks/:id_task/reject
 * El promotor rechaza una tarea → se registra para que el cron no vuelva a notificarle.
 */
promotorRouter.post("/tasks/:id_task/reject", async (req: Request, res: Response): Promise<void> => {
  try {
    const { id_task } = req.params;
    const { id_promoter } = req.body;

    if (!id_promoter) {
      res.status(400).json({ ok: false, error: "id_promoter es requerido" });
      return;
    }

    // INSERT IGNORE para que no falle si ya existe el rechazo
    await db.execute(
      `INSERT IGNORE INTO task_rejections (id_task, id_promoter, dt_register) VALUES (?, ?, NOW())`,
      [id_task, id_promoter]
    );

    res.status(200).json({ ok: true, message: "Tarea rechazada registrada" });
  } catch (error) {
    res.status(500).json({ ok: false, error: "Error rechazando tarea" });
  }
});

/**
 * PATCH /tasks/:id_task/status
 * Actualizar estatus de una tarea.
 * Estatus válidos: 2=Asignado 3=En camino 4=En ejecución 5=Enviado a validación
 * (6=Terminado y 7=Rechazado los controla el SaaS/admin, no el promotor)
 */
promotorRouter.patch("/tasks/:id_task/status", async (req: Request, res: Response): Promise<void> => {
  try {
    const { id_task } = req.params;
    const { id_promoter, id_status } = req.body;

    if (!id_promoter || id_status === undefined) {
      res.status(400).json({ ok: false, error: "id_promoter e id_status son requeridos" });
      return;
    }

    const PROMOTER_ALLOWED_STATUSES = [2, 3, 4, 5];
    if (!PROMOTER_ALLOWED_STATUSES.includes(Number(id_status))) {
      res.status(400).json({
        ok: false,
        error: `Estatus inválido. El promotor puede asignar: ${PROMOTER_ALLOWED_STATUSES.join(", ")}`,
      });
      return;
    }

    // Verificar que la tarea pertenece al promotor
    const rows = await db.select<any[]>(
      `SELECT id_task FROM tasks WHERE id_task = ? AND id_promoter = ?`,
      [id_task, id_promoter]
    );

    if (rows.length === 0) {
      res.status(403).json({ ok: false, error: "Tarea no encontrada o no asignada a este promotor" });
      return;
    }

    await db.execute(
      `UPDATE tasks SET id_status = ?, dt_update = NOW() WHERE id_task = ?`,
      [id_status, id_task]
    );

    res.status(200).json({ ok: true, message: "Estatus actualizado" });
  } catch (error) {
    res.status(500).json({ ok: false, error: "Error actualizando estatus" });
  }
});

/**
 * POST /tasks/:id_task/answers
 * Guarda las respuestas del checklist del promotor.
 * Body: { id_promoter, arrangement_photo_url?, answers: [{ id_request_product_question, value }] }
 * - Si value empieza con "http" se guarda en vc_image_url (foto), si no en vc_answer (texto)
 */
promotorRouter.post("/tasks/:id_task/answers", async (req: Request, res: Response): Promise<void> => {
  try {
    const { id_task } = req.params;
    const { id_promoter, arrangement_photo_url, answers } = req.body;

    if (!id_promoter || !Array.isArray(answers) || answers.length === 0) {
      res.status(400).json({ ok: false, error: "id_promoter y answers son requeridos" });
      return;
    }

    // Verificar que la tarea pertenece al promotor
    const rows = await db.select<any[]>(
      `SELECT id_task FROM tasks WHERE id_task = ? AND id_promoter = ?`,
      [id_task, id_promoter]
    );
    if (rows.length === 0) {
      res.status(403).json({ ok: false, error: "Tarea no encontrada o no asignada a este promotor" });
      return;
    }

    // Guardar foto de acomodo en la tarea si viene
    if (arrangement_photo_url) {
      await db.execute(
        `UPDATE tasks SET vc_arrangement_photo_url = ?, dt_update = NOW() WHERE id_task = ?`,
        [arrangement_photo_url, id_task]
      );
    }

    // Reemplazar respuestas anteriores e insertar las nuevas
    await db.execute(`DELETE FROM task_answers WHERE id_task = ? AND id_promoter = ?`, [id_task, id_promoter]);

    for (const answer of answers) {
      if (!answer.id_request_product_question || answer.value === undefined) continue;
      const valueStr = String(answer.value);
      const isPhoto = valueStr.startsWith("http");
      await db.execute(
        `INSERT INTO task_answers (id_task, id_promoter, id_request_product_question, vc_answer, vc_image_url, dt_register)
         VALUES (?, ?, ?, ?, ?, NOW())`,
        [
          id_task,
          id_promoter,
          answer.id_request_product_question,
          isPhoto ? null : valueStr,
          isPhoto ? valueStr : null,
        ]
      );
    }

    res.status(200).json({ ok: true, message: "Respuestas guardadas exitosamente" });
  } catch (error) {
    console.error("Error guardando respuestas:", error);
    res.status(500).json({ ok: false, error: "Error guardando respuestas" });
  }
});

export default promotorRouter;

import { Router } from 'express'

import { authMiddleware, debugBasicAuthMiddleware, validateBody } from '../../core/middleware'
import { uploadAny } from '../../core/middleware/upload.middleware'
import { createTask,getMyTasks, getMyTaskHistory, getTaskById, getTasks, updateTask, deleteTask, acceptTask, rejectTask, getTaskChecklist, answerTaskQuestions, completeTask, assignPromoterToTask, getNearbyTasks, forceNotifyTask, approveTask, cancelTask } from './tasks.controller'
import { forceNotifyTaskSchema, cancelTaskSchema } from './tasks.schema'

const taskRouter = Router()

/**
 * @openapi
 * /tasks/force-notify:
 *   post:
 *     tags: [Tasks]
 *     summary: "[Debug] Fuerza el envío de la notificación de una tarea (Basic Auth, no JWT)"
 *     description: >
 *       Solo para pruebas. Encola de inmediato el ranking/push de la tarea sin
 *       esperar al scheduler y sin deduplicar por jobId (se puede repetir).
 *       Requiere que la tarea esté en estatus CREADO (sin promotor asignado).
 *     security:
 *       - basicAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id_task: { type: integer }
 *               folio: { type: string }
 *             description: "Enviar id_task o folio."
 *     responses:
 *       200: { description: "Notificación forzada encolada." }
 *       401: { description: "Basic Auth inválido o no configurado." }
 *       404: { description: "Tarea no encontrada." }
 *       409: { description: "La tarea no está en estatus CREADO." }
 */
// Debug: fuerza notificación con Basic Auth propio (no JWT). Antes de /:id_task.
taskRouter.post('/force-notify', debugBasicAuthMiddleware, validateBody(forceNotifyTaskSchema), forceNotifyTask)

/**
 * @openapi
 * /tasks/my:
 *   get:
 *     tags: [Tasks]
 *     summary: Mis tareas (promotor autenticado)
 *     parameters:
 *       - { in: query, name: id_status, schema: { type: integer } }
 *     responses:
 *       200: { description: "Tareas del promotor." }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
// Mobile/Promotor: mis tareas (debe ir antes de /:id_task)
taskRouter.get('/my', authMiddleware, getMyTasks)

/**
 * @openapi
 * /tasks/my/history:
 *   get:
 *     tags: [Tasks]
 *     summary: Historial de tareas rechazadas/canceladas del promotor autenticado
 *     parameters:
 *       - { in: query, name: reason, schema: { type: string, enum: [rejected, timeout] }, description: "Filtra por motivo; si se omite regresa ambos." }
 *     responses:
 *       200: { description: "Historial de task_rejections del promotor, con datos de tienda y solicitud." }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
// Debe ir antes de /:id_task
taskRouter.get('/my/history', authMiddleware, getMyTaskHistory)

/**
 * @openapi
 * /tasks/nearby:
 *   get:
 *     tags: [Tasks]
 *     summary: Tareas disponibles cerca del promotor (radio 1 km)
 *     description: >
 *       Devuelve tareas sin promotor asignado (id_status=1) dentro de 1 km
 *       de las coordenadas enviadas. Excluye tareas ya rechazadas por el promotor.
 *     parameters:
 *       - { in: query, name: lat, required: true, schema: { type: number }, description: "Latitud actual del promotor" }
 *       - { in: query, name: lng, required: true, schema: { type: number }, description: "Longitud actual del promotor" }
 *     responses:
 *       200: { description: "Lista de tareas cercanas disponibles." }
 *       400: { description: "lat y lng son requeridos." }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
taskRouter.get('/nearby', authMiddleware, getNearbyTasks)

/**
 * @openapi
 * /tasks:
 *   post:
 *     tags: [Tasks]
 *     summary: Crear tarea
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [id_client, id_order, id_store, id_request]
 *             properties:
 *               id_client: { type: integer }
 *               id_order: { type: integer }
 *               id_store: { type: integer }
 *               id_request: { type: integer }
 *     responses:
 *       200: { description: "Tarea creada." }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *   get:
 *     tags: [Tasks]
 *     summary: Listar tareas (filtros + paginado)
 *     parameters:
 *       - { in: query, name: id_client, schema: { type: integer } }
 *       - { in: query, name: id_order, schema: { type: integer } }
 *       - { in: query, name: id_promoter, schema: { type: integer } }
 *       - { in: query, name: id_status, schema: { type: integer } }
 *       - { in: query, name: id_request, schema: { type: integer } }
 *       - { in: query, name: dt_from, schema: { type: string, format: date }, description: "Fecha de registro desde (YYYY-MM-DD)." }
 *       - { in: query, name: dt_to, schema: { type: string, format: date }, description: "Fecha de registro hasta (YYYY-MM-DD), inclusive." }
 *       - { in: query, name: page, schema: { type: integer, default: 1 } }
 *       - { in: query, name: limit, schema: { type: integer, default: 20 } }
 *     responses:
 *       200:
 *         description: "Página de tareas."
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         data: { type: array, items: { type: object } }
 *                         meta: { $ref: '#/components/schemas/Pagination' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
// Admin: CRUD
taskRouter.post('/', authMiddleware, createTask)
taskRouter.get('/', authMiddleware, getTasks)

/**
 * @openapi
 * /tasks/{id_task}:
 *   get:
 *     tags: [Tasks]
 *     summary: Obtener una tarea
 *     parameters:
 *       - { in: path, name: id_task, required: true, schema: { type: integer } }
 *     responses:
 *       200: { description: "Tarea encontrada." }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *   put:
 *     tags: [Tasks]
 *     summary: Actualizar una tarea
 *     parameters:
 *       - { in: path, name: id_task, required: true, schema: { type: integer } }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id_status: { type: integer }
 *     responses:
 *       200: { description: "Tarea actualizada." }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *   delete:
 *     tags: [Tasks]
 *     summary: Eliminar una tarea
 *     parameters:
 *       - { in: path, name: id_task, required: true, schema: { type: integer } }
 *     responses:
 *       200: { description: "Tarea eliminada." }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
taskRouter.get('/:id_task', authMiddleware, getTaskById)
taskRouter.put('/:id_task', authMiddleware, updateTask)
taskRouter.delete('/:id_task', authMiddleware, deleteTask)

/**
 * @openapi
 * /tasks/{id_task}/accept:
 *   post:
 *     tags: [Tasks]
 *     summary: Aceptar una tarea (promotor)
 *     parameters:
 *       - { in: path, name: id_task, required: true, schema: { type: integer } }
 *     responses:
 *       200: { description: "Tarea aceptada." }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *
 * /tasks/{id_task}/reject:
 *   post:
 *     tags: [Tasks]
 *     summary: Rechazar una tarea (promotor)
 *     parameters:
 *       - { in: path, name: id_task, required: true, schema: { type: integer } }
 *     responses:
 *       200: { description: "Tarea rechazada." }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *
 * /tasks/{id_task}/checklist:
 *   get:
 *     tags: [Tasks]
 *     summary: Checklist de la tarea (productos + preguntas)
 *     parameters:
 *       - { in: path, name: id_task, required: true, schema: { type: integer } }
 *     responses:
 *       200: { description: "Checklist de la tarea." }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
// Mobile/Promotor: acciones sobre tarea
taskRouter.post('/:id_task/accept', authMiddleware, acceptTask)
taskRouter.post('/:id_task/reject', authMiddleware, rejectTask)
taskRouter.get('/:id_task/checklist', authMiddleware, getTaskChecklist)

/**
 * @openapi
 * /tasks/{id_task}/answers:
 *   post:
 *     tags: [Tasks]
 *     summary: Guardado incremental del checklist (respuestas + fotos opcionales)
 *     description: >
 *       Multipart. `answers` es un JSON string con el arreglo de respuestas; puede
 *       omitirse o venir como `[]` **si** se envía al menos un archivo (foto de
 *       acomodo o de alguna pregunta). Cada imagen de pregunta va en un campo
 *       `image_{id_request_product_question}`; la foto de acomodo de la tarea va
 *       en el campo `arrangement_photo`. Upsert idempotente por
 *       `(id_task, id_promoter, id_request_product_question)`.
 *     parameters:
 *       - { in: path, name: id_task, required: true, schema: { type: integer } }
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               answers:
 *                 type: string
 *                 description: >
 *                   JSON string. Ej: [{"id_request_product_question":12,"vc_answer":"Sí"}].
 *                   Puede omitirse o ser "[]" si se envía arrangement_photo y/o image_{id}.
 *               arrangement_photo: { type: string, format: binary, description: "Foto de acomodo de la tarea (página 0)" }
 *               image_12: { type: string, format: binary, description: "Imagen para la respuesta del rpq 12 (campo dinámico)" }
 *     responses:
 *       200:
 *         description: >
 *           Respuestas guardadas. `data` = { answers: [...filas upserteadas...],
 *           arrangement_photo_url: string|null }.
 *       400: { description: "answers inválido, o no se envió ni respuestas ni archivos." }
 *       403: { description: "La tarea no está asignada al promotor." }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *
 * /tasks/{id_task}/complete:
 *   post:
 *     tags: [Tasks]
 *     summary: Marcar la tarea como completada (promotor)
 *     parameters:
 *       - { in: path, name: id_task, required: true, schema: { type: integer } }
 *     responses:
 *       200: { description: "Tarea completada." }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *
 * /tasks/{id_task}/assign:
 *   put:
 *     tags: [Tasks]
 *     summary: Asignar un promotor a la tarea
 *     parameters:
 *       - { in: path, name: id_task, required: true, schema: { type: integer } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [id_promoter]
 *             properties:
 *               id_promoter: { type: integer }
 *     responses:
 *       200: { description: "Promotor asignado." }
 *       400: { description: "id_promoter es requerido." }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
/**
 * @openapi
 * /tasks/{id_task}/approve:
 *   patch:
 *     tags: [Tasks]
 *     summary: Aprueba una tarea en revisión (admin/superadmin) -> Terminada con éxito
 *     parameters:
 *       - { in: path, name: id_task, required: true, schema: { type: integer } }
 *     responses:
 *       200: { description: "Tarea aprobada." }
 *       400: { description: "La tarea no está en revisión." }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *
 * /tasks/{id_task}/cancel:
 *   patch:
 *     tags: [Tasks]
 *     summary: Cancela una tarea en revisión (admin/superadmin), requiere comentario
 *     description: >
 *       Pasa la tarea a estatus Cancelada con vc_cancel_type "cliente" y el
 *       comentario enviado en vc_cancel_reason. Notifica por push al promotor.
 *     parameters:
 *       - { in: path, name: id_task, required: true, schema: { type: integer } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [comment]
 *             properties:
 *               comment: { type: string }
 *     responses:
 *       200: { description: "Tarea cancelada." }
 *       400: { description: "La tarea no está en revisión, o falta el comentario." }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
// Admin/superadmin: revisión de tarea (aprobar / cancelar con comentario)
taskRouter.patch('/:id_task/approve', authMiddleware, approveTask)
taskRouter.patch('/:id_task/cancel', authMiddleware, validateBody(cancelTaskSchema), cancelTask)

// Batch: enviar todas las respuestas del checklist con imagenes opcionales
taskRouter.post('/:id_task/answers', authMiddleware, uploadAny.any(), answerTaskQuestions)

taskRouter.post('/:id_task/complete', authMiddleware, completeTask)
taskRouter.put('/:id_task/assign', authMiddleware, assignPromoterToTask)

export default taskRouter

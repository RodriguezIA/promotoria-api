import { Router } from 'express'

import { authMiddleware } from '../../core/middleware'
import { uploadAny } from '../../core/middleware/upload.middleware'
import {
    createTask,
    getMyTasks,
    getTaskById,
    getTasks,
    updateTask,
    deleteTask,
    acceptTask,
    rejectTask,
    getTaskChecklist,
    answerTaskQuestions,
    completeTask,
    assignPromoterToTask,
} from './tasks.controller'

const taskRouter = Router()

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
 *     summary: Listar tareas (filtros)
 *     parameters:
 *       - { in: query, name: id_client, schema: { type: integer } }
 *       - { in: query, name: id_order, schema: { type: integer } }
 *       - { in: query, name: id_promoter, schema: { type: integer } }
 *       - { in: query, name: id_status, schema: { type: integer } }
 *     responses:
 *       200: { description: "Lista de tareas." }
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
 *     summary: Enviar respuestas del checklist (con imágenes opcionales)
 *     description: >
 *       Multipart. `answers` es un JSON string con el arreglo de respuestas.
 *       Cada imagen va en un campo `image_{id_request_product_question}`.
 *     parameters:
 *       - { in: path, name: id_task, required: true, schema: { type: integer } }
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [answers]
 *             properties:
 *               answers:
 *                 type: string
 *                 description: 'JSON string. Ej: [{"id_request_product_question":12,"vc_answer":"Sí"}]'
 *               image_12: { type: string, format: binary, description: "Imagen para la respuesta del rpq 12 (campo dinámico)" }
 *     responses:
 *       200: { description: "Respuestas guardadas." }
 *       400: { description: "answers inválido." }
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
// Batch: enviar todas las respuestas del checklist con imagenes opcionales
taskRouter.post('/:id_task/answers', authMiddleware, uploadAny.any(), answerTaskQuestions)

taskRouter.post('/:id_task/complete', authMiddleware, completeTask)
taskRouter.put('/:id_task/assign', authMiddleware, assignPromoterToTask)

export default taskRouter

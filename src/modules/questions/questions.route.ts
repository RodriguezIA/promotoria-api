import { Router } from 'express'
import { authMiddleware, validateBody } from '../../core/middleware'
import { createQuestion, getQuestionList, getQuestionById, updateQuestion, assignClientsToQuestion, deleteQuestion } from './questions.controller'
import { createQuestionSchema, updateQuestionSchema, assignClientsSchema } from './questions.schema'

const questionRouter = Router()

/**
 * @openapi
 * /questions:
 *   post:
 *     tags: [Questions]
 *     summary: Crear pregunta
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [id_user, question, question_type]
 *             properties:
 *               id_user: { type: integer }
 *               question: { type: string }
 *               question_type:
 *                 type: string
 *                 enum: [open, boolean, numeric, range, evidence, multiple]
 *               min_value: { type: number }
 *               max_value: { type: number }
 *               max_photos: { type: integer }
 *               options:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     option_text: { type: string }
 *                     option_value_numeric: { type: number }
 *                     option_value_text: { type: string }
 *                     option_order: { type: integer }
 *               clients:
 *                 type: array
 *                 items: { type: integer }
 *     responses:
 *       200: { description: "Pregunta creada." }
 *       400: { description: "Datos inválidos." }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
questionRouter.post('/', authMiddleware, validateBody(createQuestionSchema), createQuestion)

/**
 * @openapi
 * /questions/list/{id_client}:
 *   get:
 *     tags: [Questions]
 *     summary: Listar preguntas asignadas a un cliente
 *     parameters:
 *       - in: path
 *         name: id_client
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: "Lista de preguntas." }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
questionRouter.get('/list/:id_client', authMiddleware, getQuestionList)

/**
 * @openapi
 * /questions/{id_question}:
 *   get:
 *     tags: [Questions]
 *     summary: Obtener una pregunta
 *     parameters:
 *       - in: path
 *         name: id_question
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: "Pregunta encontrada." }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *   put:
 *     tags: [Questions]
 *     summary: Actualizar una pregunta
 *     parameters:
 *       - in: path
 *         name: id_question
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               question: { type: string }
 *               question_type:
 *                 type: string
 *                 enum: [open, boolean, numeric, range, evidence, multiple]
 *               min_value: { type: number }
 *               max_value: { type: number }
 *               max_photos: { type: integer }
 *     responses:
 *       200: { description: "Pregunta actualizada." }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *   delete:
 *     tags: [Questions]
 *     summary: Eliminar una pregunta
 *     parameters:
 *       - in: path
 *         name: id_question
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: "Pregunta eliminada." }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
questionRouter.get('/:id_question', authMiddleware, getQuestionById)
questionRouter.put('/:id_question', authMiddleware, validateBody(updateQuestionSchema), updateQuestion)

/**
 * @openapi
 * /questions/assign-clients/{id_question}:
 *   put:
 *     tags: [Questions]
 *     summary: Asignar clientes a una pregunta
 *     parameters:
 *       - in: path
 *         name: id_question
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [id_user, clients]
 *             properties:
 *               id_user: { type: integer }
 *               clients:
 *                 type: array
 *                 items: { type: integer }
 *     responses:
 *       200: { description: "Clientes asignados." }
 *       400: { description: "Datos inválidos." }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
questionRouter.put('/assign-clients/:id_question', authMiddleware, validateBody(assignClientsSchema), assignClientsToQuestion)
questionRouter.delete('/:id_question', authMiddleware, deleteQuestion)

export default questionRouter
import { Router } from 'express'
import { getAllUsersByClientId, createUser, refreshToken } from './controller'
import { authMiddleware, validateBody } from "../../core/middleware"
import { createUserSchema } from './user.schema'

const userAdminRouter = Router()

// RUTAS ESTATICAS

/**
 * @openapi
 * /users:
 *   post:
 *     tags: [Users]
 *     summary: Crear usuario administrador
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, name, lastname, password, id_client]
 *             properties:
 *               email: { type: string, format: email }
 *               name: { type: string }
 *               lastname: { type: string }
 *               password: { type: string, minLength: 6 }
 *               i_rol: { type: integer }
 *               i_status: { type: integer }
 *               id_client: { type: integer }
 *     responses:
 *       200: { description: "Usuario creado." }
 *       400: { description: "Datos inválidos." }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       500: { $ref: '#/components/responses/ServerError' }
 */
userAdminRouter.post('/', authMiddleware, validateBody(createUserSchema), createUser)

/**
 * @openapi
 * /users/refresh-token:
 *   get:
 *     tags: [Users]
 *     summary: Renovar el token de sesión
 *     security: []
 *     parameters:
 *       - in: header
 *         name: Authorization
 *         schema: { type: string }
 *         description: "Bearer {token} a renovar."
 *     responses:
 *       200: { description: "Nuevo token emitido." }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
userAdminRouter.get('/refresh-token', refreshToken)

// RUTAS DINAMICAS

/**
 * @openapi
 * /users/{id_client}:
 *   get:
 *     tags: [Users]
 *     summary: Listar usuarios de un cliente
 *     parameters:
 *       - in: path
 *         name: id_client
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: "Lista de usuarios." }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       500: { $ref: '#/components/responses/ServerError' }
 */
userAdminRouter.get('/:id_client', authMiddleware, getAllUsersByClientId)



export default userAdminRouter
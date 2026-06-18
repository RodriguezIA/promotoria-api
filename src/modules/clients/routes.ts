import { Router } from 'express'
import { authMiddleware, validateBody } from "../../core/middleware"
import { uploadAny } from "../../core/middleware/upload.middleware"
import { createClient, getClient, getClientsList, uploadClientDoc, deleteClient, getCountriesList, getCitiesList, getStatesList} from './controller';
import { createClientSchema } from './client.schema'

const clientRouter = Router();

/**
 * @openapi
 * /clients:
 *   get:
 *     tags: [Clients]
 *     summary: Listar clientes
 *     responses:
 *       200: { description: "Lista de clientes." }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *   post:
 *     tags: [Clients]
 *     summary: Crear cliente
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [id_user, name]
 *             properties:
 *               id_user: { type: integer }
 *               name: { type: string }
 *               rfc: { type: string }
 *               email: { type: string, format: email }
 *               phone: { type: string }
 *               id_pais: { type: integer }
 *               id_estado: { type: integer }
 *               id_ciudad: { type: integer }
 *               street: { type: string }
 *               ext_number: { type: string }
 *               int_number: { type: string }
 *               neighborhood: { type: string }
 *               zip: { type: string }
 *               addiccional_notes: { type: string }
 *     responses:
 *       200: { description: "Cliente creado." }
 *       400: { description: "Datos inválidos." }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
clientRouter.get('/', authMiddleware, getClientsList);

/**
 * @openapi
 * /clients/countries:
 *   get:
 *     tags: [Clients]
 *     summary: Catálogo de países
 *     responses:
 *       200: { description: "Lista de países." }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
clientRouter.get('/countries', authMiddleware, getCountriesList);

/**
 * @openapi
 * /clients/states/{id_pais}:
 *   get:
 *     tags: [Clients]
 *     summary: Estados de un país
 *     parameters:
 *       - in: path
 *         name: id_pais
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: "Lista de estados." }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
clientRouter.get('/states/:id_pais', authMiddleware, getStatesList);

/**
 * @openapi
 * /clients/cities/{id_estado}:
 *   get:
 *     tags: [Clients]
 *     summary: Ciudades de un estado
 *     parameters:
 *       - in: path
 *         name: id_estado
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: "Lista de ciudades." }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
clientRouter.get('/cities/:id_estado', authMiddleware, getCitiesList);

clientRouter.post('/', authMiddleware, validateBody(createClientSchema), createClient);

/**
 * @openapi
 * /clients/{id_client}:
 *   get:
 *     tags: [Clients]
 *     summary: Obtener un cliente
 *     parameters:
 *       - in: path
 *         name: id_client
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: "Cliente encontrado." }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       500: { $ref: '#/components/responses/ServerError' }
 *   delete:
 *     tags: [Clients]
 *     summary: Eliminar un cliente
 *     parameters:
 *       - in: path
 *         name: id_client
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: "Cliente eliminado." }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
clientRouter.get('/:id_client', authMiddleware, getClient);

/**
 * @openapi
 * /clients/{id_client}/docs:
 *   post:
 *     tags: [Clients]
 *     summary: Subir documento (situación fiscal) del cliente
 *     parameters:
 *       - in: path
 *         name: id_client
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [file]
 *             properties:
 *               file: { type: string, format: binary, description: "PDF o imagen" }
 *     responses:
 *       200: { description: "Documento subido. Devuelve { url }." }
 *       400: { description: "No se recibió archivo." }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
clientRouter.post('/:id_client/docs', authMiddleware, uploadAny.single('file'), uploadClientDoc);

clientRouter.delete('/:id_client', authMiddleware, deleteClient);

export default clientRouter;
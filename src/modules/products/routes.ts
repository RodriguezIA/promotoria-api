import { Router } from 'express'
import { createProduct, getProductsByClientId, getProductsPaginated, getProductById, updateProduct, updateProductImage, deleteProduct } from './controller'
import { authMiddleware, validateBody } from "../../core/middleware"
import { uploadAny } from "../../core/middleware/upload.middleware"
import { updateProductSchema } from './product.schema'

const productRouter = Router()

/**
 * @openapi
 * /products:
 *   post:
 *     tags: [Products]
 *     summary: Crear producto (con imagen opcional)
 *     description: Un solo request multipart con los datos del producto y, opcionalmente, su imagen en el campo `file`.
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [id_user, id_client, name]
 *             properties:
 *               id_user: { type: integer, example: 1 }
 *               id_client: { type: integer, example: 2 }
 *               name: { type: string, example: "Coca-Cola 600ml" }
 *               description: { type: string, example: "Refresco" }
 *               file: { type: string, format: binary, description: "Imagen del producto (opcional)" }
 *     responses:
 *       200:
 *         description: Producto creado.
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - properties:
 *                     data: { $ref: '#/components/schemas/Product' }
 *       400: { description: "Faltan campos requeridos (name, id_user, id_client)." }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       500: { $ref: '#/components/responses/ServerError' }
 */
productRouter.post('/', authMiddleware, uploadAny.single('file'), createProduct);

/**
 * @openapi
 * /products/product/{id_product}:
 *   get:
 *     tags: [Products]
 *     summary: Obtener un producto por id
 *     parameters:
 *       - in: path
 *         name: id_product
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Producto encontrado.
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - properties:
 *                     data: { $ref: '#/components/schemas/Product' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       500: { $ref: '#/components/responses/ServerError' }
 */
productRouter.get('/product/:id_product', authMiddleware, getProductById);

/**
 * @openapi
 * /products/paginated/{id_client}:
 *   get:
 *     tags: [Products]
 *     summary: Listar productos de un cliente (paginado + búsqueda)
 *     parameters:
 *       - in: path
 *         name: id_client
 *         required: true
 *         schema: { type: integer }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 12 }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *         description: Filtra por nombre (contains).
 *     responses:
 *       200:
 *         description: Página de productos.
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         data:
 *                           type: array
 *                           items: { $ref: '#/components/schemas/Product' }
 *                         meta: { $ref: '#/components/schemas/Pagination' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       500: { $ref: '#/components/responses/ServerError' }
 */
productRouter.get('/paginated/:id_client', authMiddleware, getProductsPaginated);

/**
 * @openapi
 * /products/{id_client}:
 *   get:
 *     tags: [Products]
 *     summary: Listar todos los productos activos de un cliente
 *     parameters:
 *       - in: path
 *         name: id_client
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Lista de productos.
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - properties:
 *                     data:
 *                       type: array
 *                       items: { $ref: '#/components/schemas/Product' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       500: { $ref: '#/components/responses/ServerError' }
 */
productRouter.get('/:id_client', authMiddleware, getProductsByClientId);

/**
 * @openapi
 * /products/upload-image/{id_client}/{id_product}:
 *   post:
 *     tags: [Products]
 *     summary: Subir/actualizar la imagen de un producto
 *     parameters:
 *       - in: path
 *         name: id_client
 *         required: true
 *         schema: { type: integer }
 *       - in: path
 *         name: id_product
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
 *               file: { type: string, format: binary }
 *     responses:
 *       200: { description: "Imagen actualizada." }
 *       400: { description: "No se recibió archivo." }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       500: { $ref: '#/components/responses/ServerError' }
 */
productRouter.post('/upload-image/:id_client/:id_product', authMiddleware, uploadAny.single('file'), updateProductImage);

/**
 * @openapi
 * /products/{id_product}:
 *   put:
 *     tags: [Products]
 *     summary: Actualizar datos de un producto
 *     parameters:
 *       - in: path
 *         name: id_product
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               description: { type: string }
 *     responses:
 *       200: { description: "Producto actualizado." }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       500: { $ref: '#/components/responses/ServerError' }
 *   delete:
 *     tags: [Products]
 *     summary: Eliminar (desactivar) un producto
 *     parameters:
 *       - in: path
 *         name: id_product
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: "Producto desactivado (i_status = 0)." }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       500: { $ref: '#/components/responses/ServerError' }
 */
productRouter.put('/:id_product', authMiddleware, validateBody(updateProductSchema), updateProduct);
productRouter.delete('/:id_product', authMiddleware, deleteProduct);

export default productRouter
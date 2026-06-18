import { Router, Request, Response, NextFunction } from 'express'
import { ZodSchema } from 'zod'
import { uploadAny } from '../../core/middleware/upload.middleware'
import { createSaleChannel, getSaleChannel, getSalesChannelList, updateSaleChannel, deleteSaleChannel } from './channel_sales.controller'
import { createChannelSalesSchema, updateChannelSalesSchema } from './channel_sales.schema'

const channelsSalesRouter = Router()

/**
 * Helper para validar el campo `data` (JSON string) en requests multipart.
 * Si es válido, reemplaza req.body con el objeto parseado para que el controller
 * ya no necesite hacer JSON.parse manualmente.
 */
const validateMultipartData = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const raw = req.body?.data ?? '{}';
      const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
      schema.parse(parsed);
      req.body = parsed;
      next();
    } catch (error: any) {
      res.status(400).json({
        ok: false,
        error: 1,
        data: null,
        message: 'Datos de entrada inválidos',
        error_backend: error instanceof Error ? error.message : String(error),
      });
    }
  };
};

/**
 * @openapi
 * /channel-sales:
 *   post:
 *     tags: [Sales Channels]
 *     summary: Crear canal de venta
 *     security: []
 *     description: Multipart. El campo `data` es un JSON string con los datos; `file` es la imagen opcional.
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [data]
 *             properties:
 *               data:
 *                 type: string
 *                 description: 'JSON string. Ej: {"name":"Autoservicio","description":"..."}'
 *               file: { type: string, format: binary }
 *     responses:
 *       201: { description: "Canal creado." }
 *       400: { description: "Datos inválidos." }
 *   get:
 *     tags: [Sales Channels]
 *     summary: Listar canales de venta
 *     security: []
 *     responses:
 *       200: { description: "Lista de canales." }
 */
channelsSalesRouter.post('/', uploadAny.single('file'), validateMultipartData(createChannelSalesSchema), createSaleChannel);
channelsSalesRouter.get('/', getSalesChannelList);

/**
 * @openapi
 * /channel-sales/{id_channel}:
 *   get:
 *     tags: [Sales Channels]
 *     summary: Obtener un canal de venta
 *     security: []
 *     parameters:
 *       - in: path
 *         name: id_channel
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: "Canal encontrado." }
 *       500: { $ref: '#/components/responses/ServerError' }
 *   put:
 *     tags: [Sales Channels]
 *     summary: Actualizar un canal de venta
 *     security: []
 *     parameters:
 *       - in: path
 *         name: id_channel
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               data: { type: string, description: "JSON string con los campos a actualizar" }
 *               file: { type: string, format: binary }
 *     responses:
 *       200: { description: "Canal actualizado." }
 *   delete:
 *     tags: [Sales Channels]
 *     summary: Eliminar un canal de venta
 *     security: []
 *     parameters:
 *       - in: path
 *         name: id_channel
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: "Canal eliminado." }
 */
channelsSalesRouter.get('/:id_channel', getSaleChannel);
channelsSalesRouter.put('/:id_channel', uploadAny.single('file'), validateMultipartData(updateChannelSalesSchema), updateSaleChannel);
channelsSalesRouter.delete('/:id_channel', deleteSaleChannel);

export default channelsSalesRouter
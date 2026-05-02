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

channelsSalesRouter.post('/', uploadAny.single('file'), validateMultipartData(createChannelSalesSchema), createSaleChannel);
channelsSalesRouter.get('/', getSalesChannelList);
channelsSalesRouter.get('/:id_channel', getSaleChannel);
channelsSalesRouter.put('/:id_channel', uploadAny.single('file'), validateMultipartData(updateChannelSalesSchema), updateSaleChannel);
channelsSalesRouter.delete('/:id_channel', deleteSaleChannel);

export default channelsSalesRouter
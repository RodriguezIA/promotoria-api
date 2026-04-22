import { Router } from 'express'


import { authMiddleware } from '../../core/middleware/auth.middleware'
import { uploadAny } from '../../core/middleware/upload.middleware'
import {} from './channel_sales.controller'


const channelsSalesRouter = Router()


channelsSalesRouter.post('/', authMiddleware, uploadAny.single('file'));
channelsSalesRouter.get('/', authMiddleware);
channelsSalesRouter.get('/:id_channel', authMiddleware);
channelsSalesRouter.put('/:id_channel', authMiddleware);
channelsSalesRouter.delete('/:id_channel', authMiddleware);
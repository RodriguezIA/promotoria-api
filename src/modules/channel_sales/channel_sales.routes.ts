import { Router } from 'express'


import { authMiddleware } from '../../core/middleware/auth.middleware'
import { uploadAny } from '../../core/middleware/upload.middleware'
import {createSaleChannel, getSaleChannel, getSalesChannelList, updateSaleChannel, deleteSaleChannel} from './channel_sales.controller'


const channelsSalesRouter = Router()


// channelsSalesRouter.post('/', authMiddleware, uploadAny.single('file'),createSaleChannel);
// channelsSalesRouter.get('/', authMiddleware, getSalesChannelList);
// channelsSalesRouter.get('/:id_channel', authMiddleware, getSaleChannel);
// channelsSalesRouter.put('/:id_channel', authMiddleware, updateSaleChannel);
// channelsSalesRouter.delete('/:id_channel', authMiddleware, deleteSaleChannel);

channelsSalesRouter.post('/',  uploadAny.single('file'),createSaleChannel);
channelsSalesRouter.get('/',  getSalesChannelList);
channelsSalesRouter.get('/:id_channel', getSaleChannel);
channelsSalesRouter.put('/:id_channel', updateSaleChannel);
channelsSalesRouter.delete('/:id_channel', deleteSaleChannel);

export default channelsSalesRouter
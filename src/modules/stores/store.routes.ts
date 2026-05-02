import { Router } from 'express'

import { authMiddleware, validateBody } from '../../core/middleware'
import { createStore, getStore, getStores, updateStore, deleteStore } from './store.controller'
import { createStoreSchema, updateStoreSchema } from './store.schema'

const storeRouter = Router()

storeRouter.post('/', authMiddleware, validateBody(createStoreSchema), createStore);
storeRouter.get('/', authMiddleware, getStores);
storeRouter.get('/:id_store', authMiddleware, getStore);
storeRouter.put('/:id_store', authMiddleware, validateBody(updateStoreSchema), updateStore);
storeRouter.delete('/:id_store', authMiddleware, deleteStore);

export default storeRouter
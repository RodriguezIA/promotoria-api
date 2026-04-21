import { Router } from 'express'


import { authMiddleware } from '../../core/middleware/auth.middleware'
import { createStore, getStore, getStores, updateStore, deleteStore } from './store.controller'


const storeRouter = Router()


storeRouter.post('/', authMiddleware, createStore);
storeRouter.get('/', authMiddleware, getStores);
storeRouter.get('/:id_store', authMiddleware, getStore);
storeRouter.put('/:id_store', authMiddleware, updateStore);
storeRouter.delete('/:id_store', authMiddleware, deleteStore);


export default storeRouter
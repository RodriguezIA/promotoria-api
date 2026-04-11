import { Router } from 'express'
import { authMiddleware } from "../../core/middleware/auth.middleware"
import { uploadAny } from "../../core/middleware/upload.middleware"
import { createClient, getClient, getClientsList, uploadClientDoc, deleteClient, getCountriesList, getCitiesList, getStatesList} from './controller';


const clientRouter = Router();


clientRouter.get('/', authMiddleware, getClientsList);
clientRouter.get('/countries', authMiddleware, getCountriesList);
clientRouter.get('/states/:id_pais', authMiddleware, getStatesList);
clientRouter.get('/cities/:id_estado', authMiddleware, getCitiesList);
clientRouter.post('/', authMiddleware, createClient);
clientRouter.get('/:id_client', authMiddleware, getClient);
clientRouter.post('/:id_client/docs', authMiddleware, uploadAny.single('file'), uploadClientDoc);
clientRouter.delete('/:id_client', authMiddleware, deleteClient);


export default clientRouter;
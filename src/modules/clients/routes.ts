import { Router } from 'express'
import { authMiddleware } from "../../core/middleware/auth.middleware"
import { uploadAny } from "../../core/middleware/upload.middleware"

import { getClient, createClient, uploadClientDoc } from './controller';

const clientRouter = Router();

clientRouter.post('/', authMiddleware, createClient);
clientRouter.get('/:id_client', authMiddleware, getClient);
clientRouter.post('/:id_client/docs', authMiddleware, uploadAny.single('file'), uploadClientDoc);

export default clientRouter;
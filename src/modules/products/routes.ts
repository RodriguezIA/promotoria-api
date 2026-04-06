import { Router, Request, Response} from 'express'
import { getProductsByClientId } from './controller'
import { authMiddleware } from "../../core/middleware/auth.middleware"

const productRouter = Router()

productRouter.get('/:id_client', authMiddleware, getProductsByClientId);

export default productRouter
import { Router, Request, Response} from 'express'
import { getAllUsersByClientId } from './controller'
import { authMiddleware } from "../../core/middleware/auth.middleware"

const userAdminRouter = Router()

userAdminRouter.get('/:id_client', authMiddleware, getAllUsersByClientId)


export default userAdminRouter
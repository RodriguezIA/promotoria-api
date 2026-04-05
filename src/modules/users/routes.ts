import { Router, Request, Response} from 'express'
import { getAllUsersByClientId, createUser } from './controller'
import { authMiddleware } from "../../core/middleware/auth.middleware"

const userAdminRouter = Router()

userAdminRouter.post('/', authMiddleware, createUser)
userAdminRouter.get('/:id_client', authMiddleware, getAllUsersByClientId)



export default userAdminRouter
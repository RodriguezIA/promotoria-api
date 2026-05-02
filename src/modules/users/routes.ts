import { Router } from 'express'
import { getAllUsersByClientId, createUser } from './controller'
import { authMiddleware, validateBody } from "../../core/middleware"
import { createUserSchema } from './user.schema'

const userAdminRouter = Router()

userAdminRouter.post('/', authMiddleware, validateBody(createUserSchema), createUser)
userAdminRouter.get('/:id_client', authMiddleware, getAllUsersByClientId)

export default userAdminRouter
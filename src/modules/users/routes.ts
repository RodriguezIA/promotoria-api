import { Router } from 'express'
import { getAllUsersByClientId, createUser, refreshToken } from './controller'
import { authMiddleware, validateBody } from "../../core/middleware"
import { createUserSchema } from './user.schema'

const userAdminRouter = Router()

userAdminRouter.post('/', authMiddleware, validateBody(createUserSchema), createUser)
userAdminRouter.get('/refresh-token', refreshToken)

userAdminRouter.get('/:id_client', authMiddleware, getAllUsersByClientId)

export default userAdminRouter
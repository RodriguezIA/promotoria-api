import { Router } from 'express'
import { validateBody } from '../../core/middleware'
import { updateLocationPromoter, createPromoter, loginPromoter } from './promoter.controller'
import { createPromoterSchema, loginPromoterSchema, updateLocationPromoterSchema } from './promoter.schema'

const promoterRouter = Router()

promoterRouter.post('/', validateBody(createPromoterSchema), createPromoter)
promoterRouter.post('/login', validateBody(loginPromoterSchema), loginPromoter)
promoterRouter.put('/update-location', validateBody(updateLocationPromoterSchema), updateLocationPromoter)

export default promoterRouter
import { Router } from 'express'


import { updateLocationPromoter, createPromoter } from './promoter.controller'


const promoterRouter = Router()


promoterRouter.post('/', createPromoter)
promoterRouter.put('/update-location', updateLocationPromoter)


export default promoterRouter
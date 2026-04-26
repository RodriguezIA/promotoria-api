import { Router } from 'express'


import { updateLocationPromoter, createPromoter, loginPromoter } from './promoter.controller'


const promoterRouter = Router()


promoterRouter.post('/', createPromoter)
promoterRouter.post('/login', loginPromoter)
promoterRouter.put('/update-location', updateLocationPromoter)


export default promoterRouter
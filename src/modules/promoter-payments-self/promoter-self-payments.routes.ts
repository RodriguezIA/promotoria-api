import { Router } from 'express'
import { authMiddleware } from '../../core/middleware'
import { getHistory, getPending, getAffiliation } from './promoter-self-payments.controller'

const promoterSelfPaymentsRouter = Router()

promoterSelfPaymentsRouter.get('/history', authMiddleware, getHistory)
promoterSelfPaymentsRouter.get('/pending', authMiddleware, getPending)
promoterSelfPaymentsRouter.get('/affiliation', authMiddleware, getAffiliation)

export default promoterSelfPaymentsRouter

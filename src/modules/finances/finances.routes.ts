import { Router } from 'express'
import clientChargesRouter from './client-charges/client-charges.routes'
import promoterPaymentsRouter from './promoter-payments/promoter-payments.routes'
import financeSettingsRouter from './settings/finance-settings.routes'

const financesRouter = Router()

financesRouter.use('/client-charges', clientChargesRouter)
financesRouter.use('/promoter-payments', promoterPaymentsRouter)
financesRouter.use('/settings', financeSettingsRouter)

export default financesRouter

import { Router } from 'express'
import { authMiddleware, requireRole } from '../../core/middleware'
import { ROLES } from '../../core/constants/status.constants'
import { createRouteSchedule, getRouteSchedules, deleteRouteSchedule } from './route-schedules.controller'

const routeSchedulesRouter = Router()

routeSchedulesRouter.post('/', authMiddleware, requireRole(ROLES.SUPER, ROLES.ADMIN), createRouteSchedule)
routeSchedulesRouter.get('/', authMiddleware, requireRole(ROLES.SUPER, ROLES.ADMIN), getRouteSchedules)
routeSchedulesRouter.delete('/:id_schedule', authMiddleware, requireRole(ROLES.SUPER, ROLES.ADMIN), deleteRouteSchedule)

export default routeSchedulesRouter

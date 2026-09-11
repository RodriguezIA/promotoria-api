import { Router } from 'express'
import { authMiddleware, requireRole } from '../../core/middleware'
import { ROLES } from '../../core/constants/status.constants'
import {
    createRouteTemplate,
    updateRouteTemplate,
    getRouteTemplates,
    getRouteTemplateById,
    deleteRouteTemplate,
    estimateRouteSales,
} from './route-templates.controller'

const routeTemplatesRouter = Router()

routeTemplatesRouter.post('/', authMiddleware, requireRole(ROLES.SUPER, ROLES.ADMIN), createRouteTemplate)
routeTemplatesRouter.get('/', authMiddleware, requireRole(ROLES.SUPER, ROLES.ADMIN), getRouteTemplates)
routeTemplatesRouter.post('/estimate-sales', authMiddleware, requireRole(ROLES.SUPER, ROLES.ADMIN), estimateRouteSales)
routeTemplatesRouter.get('/:id_route_template', authMiddleware, requireRole(ROLES.SUPER, ROLES.ADMIN), getRouteTemplateById)
routeTemplatesRouter.put('/:id_route_template', authMiddleware, requireRole(ROLES.SUPER, ROLES.ADMIN), updateRouteTemplate)
routeTemplatesRouter.delete('/:id_route_template', authMiddleware, requireRole(ROLES.SUPER, ROLES.ADMIN), deleteRouteTemplate)

export default routeTemplatesRouter

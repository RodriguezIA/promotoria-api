import { Router } from 'express'
import { authMiddleware } from '../../core/middleware'
import { getPendingPreorders, createRoute, getRoutesByClient, setRouteActive, updateRoute, deleteRoute, getMyRoutes, updateStop, getStoreDeliveryHistory, getDriverSales, getDriverRoutesInRange } from './delivery-routes.controller'

const deliveryRoutesRouter = Router()

// Cliente empresarial: ver pendientes por surtir y armar/ver rutas.
deliveryRoutesRouter.get('/pending-preorders', authMiddleware, getPendingPreorders)
deliveryRoutesRouter.get('/stores/:id_store/history', authMiddleware, getStoreDeliveryHistory)
deliveryRoutesRouter.get('/drivers/:id_driver/sales', authMiddleware, getDriverSales)
deliveryRoutesRouter.get('/drivers/:id_driver/routes', authMiddleware, getDriverRoutesInRange)
deliveryRoutesRouter.post('/', authMiddleware, createRoute)
deliveryRoutesRouter.get('/', authMiddleware, getRoutesByClient)
deliveryRoutesRouter.patch('/:id_route/active', authMiddleware, setRouteActive)
deliveryRoutesRouter.put('/:id_route', authMiddleware, updateRoute)
deliveryRoutesRouter.delete('/:id_route', authMiddleware, deleteRoute)

// El chofer: sus propias rutas y actualizar el estatus de cada parada.
deliveryRoutesRouter.get('/mine', authMiddleware, getMyRoutes)
deliveryRoutesRouter.patch('/stops/:id_stop', authMiddleware, updateStop)

export default deliveryRoutesRouter

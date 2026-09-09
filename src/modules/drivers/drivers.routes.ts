import { Router } from 'express'
import { authMiddleware, uploadAny } from '../../core/middleware'
import {
    createDriver, listDrivers, listDriversByClient, deactivateDriver, suspendDriver, reactivateDriver, updateDriver, uploadDriverPhoto,
    driverLogin, checkDriverPhone, createStoreByDriver, getDriverProfile, updateDriverPassword, updateDriverLocation,
} from './drivers.controller'

const driversRouter = Router()

// Login del chofer — publico, es como obtiene su token.
driversRouter.post('/login', driverLogin)
driversRouter.get('/check-phone/:phone', checkDriverPhone)

// Acciones del cliente empresarial sobre sus choferes (alta/baja/edicion).
driversRouter.post('/', authMiddleware, createDriver)
driversRouter.get('/', authMiddleware, listDrivers)
driversRouter.get('/by-client/:id_client', authMiddleware, listDriversByClient)
driversRouter.put('/:id_driver', authMiddleware, updateDriver)
driversRouter.delete('/:id_driver', authMiddleware, deactivateDriver)
driversRouter.patch('/:id_driver/suspend', authMiddleware, suspendDriver)
driversRouter.patch('/:id_driver/reactivate', authMiddleware, reactivateDriver)
driversRouter.post('/:id_driver/photo', authMiddleware, uploadAny.single('file'), uploadDriverPhoto)

// El chofer viendo/editando su propia sesion.
driversRouter.get('/me/profile', authMiddleware, getDriverProfile)
driversRouter.patch('/me/password', authMiddleware, updateDriverPassword)
driversRouter.patch('/me/location', authMiddleware, updateDriverLocation)
driversRouter.post('/me/stores', authMiddleware, createStoreByDriver)

export default driversRouter

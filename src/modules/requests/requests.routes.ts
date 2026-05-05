import { Router } from 'express'
import { authMiddleware } from '../../core/middleware'
import { upload } from '../../core/middleware/upload.middleware'
import {
    createRequest,
    getAllRequests,
    getRequestById,
    updateRequest,
    deleteRequest
} from './requests.controller'

const requestRouter = Router()

requestRouter.post('/', authMiddleware, upload.single('rackImage'), createRequest)
requestRouter.get('/', authMiddleware, getAllRequests)
requestRouter.get('/:id_request', authMiddleware, getRequestById)
requestRouter.put('/:id_request', authMiddleware, upload.single('rackImage'), updateRequest)
requestRouter.delete('/:id_request', authMiddleware, deleteRequest)

export default requestRouter

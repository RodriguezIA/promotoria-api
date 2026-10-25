import { Router } from 'express'
import { authMiddleware, requireRole, upload } from '../../core/middleware'
import { ROLES } from '../../core/constants/status.constants'
import {
    getSummary, getMovements, getBankInfo, setBankInfo, createTopup, listTopups,
    approveTopup, rejectTopup, adjustBalance, setPaymentMode,
} from './balance.controller'

const balanceRouter = Router()

// Cliente (ADMIN) ve lo suyo; el master puede consultar cualquier cliente con ?id_client=
balanceRouter.get('/summary', authMiddleware, getSummary)
balanceRouter.get('/movements', authMiddleware, getMovements)

// Datos bancarios para recargar: los ve cualquier usuario del panel, solo el master los edita
balanceRouter.get('/bank-info', authMiddleware, getBankInfo)
balanceRouter.put('/bank-info', authMiddleware, requireRole(ROLES.SUPER), setBankInfo)

// Recargas
balanceRouter.post('/topups', authMiddleware, upload.single('receipt'), createTopup)
balanceRouter.get('/topups', authMiddleware, listTopups)
balanceRouter.patch('/topups/:id_topup/approve', authMiddleware, requireRole(ROLES.SUPER), approveTopup)
balanceRouter.patch('/topups/:id_topup/reject', authMiddleware, requireRole(ROLES.SUPER), rejectTopup)

// Solo master
balanceRouter.post('/adjust', authMiddleware, requireRole(ROLES.SUPER), adjustBalance)
balanceRouter.patch('/clients/:id_client/payment-mode', authMiddleware, requireRole(ROLES.SUPER), setPaymentMode)

export default balanceRouter

import { Router } from 'express'
import { authMiddleware } from '../../core/middleware'
import { uploadAny } from '../../core/middleware/upload.middleware'
import {
    getInvoices,
    getInvoiceById,
    reviewInvoicePayment,
    markInvoiceLate,
    getPromoterPayments,
    payPromoter,
    getSummary,
    generateBilling,
    getConfig,
    updateGlobalConfig,
    updateClientConfig,
    getMyInvoices,
    getMyInvoiceById,
    submitInvoicePayment,
} from './finance.controller'

const financeRouter = Router()

// ---- Cliente ----
financeRouter.get('/my-invoices', authMiddleware, getMyInvoices)
financeRouter.get('/my-invoices/:id', authMiddleware, getMyInvoiceById)
financeRouter.post('/invoices/:id/payments', authMiddleware, uploadAny.single('receipt'), submitInvoicePayment)

// ---- Super admin: cobros ----
financeRouter.get('/invoices', authMiddleware, getInvoices)
financeRouter.get('/invoices/:id', authMiddleware, getInvoiceById)
financeRouter.put('/invoices/:id/late', authMiddleware, markInvoiceLate)
financeRouter.put('/invoice-payments/:id/review', authMiddleware, reviewInvoicePayment)

// ---- Super admin: pagos a promotores ----
financeRouter.get('/promoter-payments', authMiddleware, getPromoterPayments)
financeRouter.put('/promoter-payments/:id/pay', authMiddleware, payPromoter)

// ---- Super admin: resumen / generación / config ----
financeRouter.get('/summary', authMiddleware, getSummary)
financeRouter.post('/generate', authMiddleware, generateBilling)
financeRouter.get('/config', authMiddleware, getConfig)
financeRouter.put('/config', authMiddleware, updateGlobalConfig)
financeRouter.put('/config/client/:id_client', authMiddleware, updateClientConfig)

export default financeRouter

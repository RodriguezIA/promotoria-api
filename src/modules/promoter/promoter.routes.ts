import { Router } from 'express'


import { upload } from '../../core/middleware/upload.middleware'
import { authMiddleware, validateBody, validateParams } from '../../core/middleware'
import { uploadAny } from '../../core/middleware/upload.middleware'
import {
  updateLocationPromoter, createPromoter, loginPromoter, getPromoters,
  getPromoterBankAccounts, createPromoterBankAccount, getPromoterBankAccount,
  updatePromoterBankAccount, deletePromoterBankAccount, getPromoterById,
  updateFcmToken,
  // updatePromoterImage
} from './promoter.controller'

import {
  createPromoterSchema, loginPromoterSchema, updateLocationPromoterSchema,
  createPromoterBankAccountSchema, updatePromoterBankAccountSchema,
  promoterIdParamSchema, bankAccountIdParamSchema, updateFcmTokenSchema,
} from './promoter.schema'

const promoterRouter = Router()

promoterRouter.get('/', authMiddleware, getPromoters)
promoterRouter.post('/', validateBody(createPromoterSchema), createPromoter)
promoterRouter.post('/login', loginPromoter)
promoterRouter.put('/update-location', validateBody(updateLocationPromoterSchema), updateLocationPromoter)
promoterRouter.get('/:id', authMiddleware, getPromoterById)

// Sincroniza el FCM token fuera del login (rotación de token, reinstalación, etc.)
promoterRouter.put('/:id_promoter/fcm-token',
  authMiddleware, validateParams(promoterIdParamSchema), validateBody(updateFcmTokenSchema), updateFcmToken)


// Upload de imagen de perfil - NUEVA RUTA
// promoterRouter.post('/:id_promoter/upload-image', authMiddleware, validateParams(promoterIdParamSchema), uploadAny.single('file'), updatePromoterImage)

// Cuentas bancarias
promoterRouter.get('/:id_promoter/bank-accounts',
  authMiddleware, validateParams(promoterIdParamSchema), getPromoterBankAccounts)

promoterRouter.post('/:id_promoter/bank-accounts',
  authMiddleware, validateParams(promoterIdParamSchema), validateBody(createPromoterBankAccountSchema), createPromoterBankAccount)

promoterRouter.get('/:id_promoter/bank-accounts/:id_account',
  authMiddleware, validateParams(bankAccountIdParamSchema), getPromoterBankAccount)

promoterRouter.put('/:id_promoter/bank-accounts/:id_account',
  authMiddleware, validateParams(bankAccountIdParamSchema), validateBody(updatePromoterBankAccountSchema), updatePromoterBankAccount)

promoterRouter.delete('/:id_promoter/bank-accounts/:id_account',
  authMiddleware, validateParams(bankAccountIdParamSchema), deletePromoterBankAccount)

export default promoterRouter

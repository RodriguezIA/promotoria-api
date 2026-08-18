import { Router } from 'express'


import { upload } from '../../core/middleware/upload.middleware'
import { authMiddleware, validateBody, validateParams } from '../../core/middleware'
import { uploadAny } from '../../core/middleware/upload.middleware'
import {
  updateLocationPromoter, createPromoter, loginPromoter, getPromoters,
  getPromoterBankAccounts, createPromoterBankAccount, getPromoterBankAccount,
  updatePromoterBankAccount, deletePromoterBankAccount, getPromoterById,
  updateFcmToken, updatePromoterLocation, refreshPromoterToken, getAffiliationCode,
  updatePromoterImage, checkPhone, updatePromoterProfile, updatePromoterPassword,
  getPromoterReferrals,
} from './promoter.controller'

import {
  createPromoterSchema, loginPromoterSchema, updateLocationPromoterSchema,
  createPromoterBankAccountSchema, updatePromoterBankAccountSchema,
  promoterIdParamSchema, bankAccountIdParamSchema, updateFcmTokenSchema,
  updatePromoterLocationSchema, updatePromoterProfileSchema, updatePromoterPasswordSchema,
} from './promoter.schema'

const promoterRouter = Router()

promoterRouter.get('/', authMiddleware, getPromoters)
promoterRouter.post('/', validateBody(createPromoterSchema), createPromoter)
promoterRouter.get('/check-phone/:phone', checkPhone)
promoterRouter.post('/login', loginPromoter)
promoterRouter.post('/refresh-token', refreshPromoterToken)
promoterRouter.put('/update-location', validateBody(updateLocationPromoterSchema), updateLocationPromoter)
promoterRouter.get('/:id', authMiddleware, getPromoterById)

// Sincroniza el FCM token fuera del login (rotación de token, reinstalación, etc.)
promoterRouter.put('/:id_promoter/fcm-token',
  authMiddleware, validateParams(promoterIdParamSchema), validateBody(updateFcmTokenSchema), updateFcmToken)

// La app llama esta ruta (id en la URL); /update-location (id en el body) se deja
// intacta por si algo más la usa, pero la app no la usaba y por eso la
// ubicación del promotor nunca se actualizaba (siempre 404).
promoterRouter.put('/:id_promoter/location',
  authMiddleware, validateParams(promoterIdParamSchema), validateBody(updatePromoterLocationSchema), updatePromoterLocation)

// Código de invitación del promotor (para que invite a otros)
promoterRouter.get('/:id_promoter/affiliation-code',
  authMiddleware, validateParams(promoterIdParamSchema), getAffiliationCode)

// Listado de invitados del promotor: activo/inactivo, cuanto han generado y
// cuanto le ha tocado a el (activador) por cada uno.
promoterRouter.get('/:id_promoter/referrals',
  authMiddleware, validateParams(promoterIdParamSchema), getPromoterReferrals)

// Edicion de datos propios: nombre, apellido, correo, celular.
promoterRouter.patch('/:id_promoter/profile',
  authMiddleware, validateParams(promoterIdParamSchema), validateBody(updatePromoterProfileSchema), updatePromoterProfile)

// Cambio de contraseña (pide la contraseña actual).
promoterRouter.patch('/:id_promoter/password',
  authMiddleware, validateParams(promoterIdParamSchema), validateBody(updatePromoterPasswordSchema), updatePromoterPassword)

// Foto de perfil. La app manda PATCH con multipart, campo "photo".
promoterRouter.patch('/:id_promoter/profile-photo',
  authMiddleware, validateParams(promoterIdParamSchema), uploadAny.single('photo'), updatePromoterImage)

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

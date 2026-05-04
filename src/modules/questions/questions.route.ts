import { Router } from 'express'
import { authMiddleware, validateBody } from '../../core/middleware'
import { createQuestion, getQuestionList, getQuestionById, updateQuestion, assignClientsToQuestion, deleteQuestion } from './questions.controller'
import { createQuestionSchema, updateQuestionSchema, assignClientsSchema } from './questions.schema'

const questionRouter = Router()

questionRouter.post('/', authMiddleware, validateBody(createQuestionSchema), createQuestion)
questionRouter.get('/list/:id_client', authMiddleware, getQuestionList)
questionRouter.get('/:id_question', authMiddleware, getQuestionById)
questionRouter.put('/:id_question', authMiddleware, validateBody(updateQuestionSchema), updateQuestion)
questionRouter.put('/assign-clients/:id_question', authMiddleware, validateBody(assignClientsSchema), assignClientsToQuestion)
questionRouter.delete('/:id_question', authMiddleware, deleteQuestion)

export default questionRouter
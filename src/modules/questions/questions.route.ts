import { Router } from 'express'


import { authMiddleware } from '../../core/middleware'
import { createQuestion, getQuestionList, getQuestionById, updateQuestion, deleteQuestion } from './questions.controller'


const questionRouter = Router()

questionRouter.post('/', authMiddleware, createQuestion)
questionRouter.get('/list/:id_client', authMiddleware, getQuestionList)
questionRouter.get('/:id_question', authMiddleware, getQuestionById)
questionRouter.put('/:id_question', authMiddleware, updateQuestion)
questionRouter.delete('/:id_question', authMiddleware, deleteQuestion)

export default questionRouter
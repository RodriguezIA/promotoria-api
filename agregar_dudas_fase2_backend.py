import io
import os

cambios = 0

def leer(path):
    with io.open(path, "r", encoding="utf-8") as f:
        return f.read()

def escribir(path, content):
    with io.open(path, "w", encoding="utf-8") as f:
        f.write(content)

# ---------- 1. Crear la carpeta del modulo ----------
os.makedirs("src/modules/faq", exist_ok=True)

# ---------- 2. faq.dto.ts ----------
path_dto = "src/modules/faq/faq.dto.ts"
if os.path.exists(path_dto):
    print("YA ESTABA: faq.dto.ts")
else:
    content_dto = """export const FAQ_GREETING_SETTING_KEY = 'faq_greeting_message'
export const FAQ_GREETING_DEFAULT = '¡Hola! ¿En qué te puedo ayudar?'

export interface FaqPhraseDTO {
    id_faq_question_phrase: number
    vc_phrase: string
}

export interface FaqQuestionDTO {
    id_faq_question: number
    vc_answer_text: string
    phrases: FaqPhraseDTO[]
    dt_register: Date
    dt_updated: Date
}

export interface CreateFaqQuestionDTO {
    vc_answer_text: string
    phrases: string[]
}

export interface UpdateFaqQuestionDTO {
    vc_answer_text?: string
    phrases?: string[]
}
"""
    escribir(path_dto, content_dto)
    cambios += 1
    print("OK: faq.dto.ts creado")

# ---------- 3. faq.service.ts ----------
path_service = "src/modules/faq/faq.service.ts"
if os.path.exists(path_service):
    print("YA ESTABA: faq.service.ts")
else:
    content_service = """import { prisma } from '../../core/prisma'
import { FAQ_GREETING_SETTING_KEY, FAQ_GREETING_DEFAULT, CreateFaqQuestionDTO, UpdateFaqQuestionDTO } from './faq.dto'

export class FaqService {
    async listQuestions() {
        return prisma.faq_questions.findMany({
            where: { i_status: 1 },
            include: { phrases: true },
            orderBy: { dt_register: 'desc' },
        })
    }

    async getQuestion(id_faq_question: number) {
        const question = await prisma.faq_questions.findFirst({
            where: { id_faq_question, i_status: 1 },
            include: { phrases: true },
        })
        if (!question) throw new Error('Pregunta no encontrada')
        return question
    }

    async createQuestion(data: CreateFaqQuestionDTO) {
        const phrases = (data.phrases || []).map(p => p.trim()).filter(p => p.length > 0)
        if (phrases.length === 0) throw new Error('Debes agregar al menos una forma de preguntarlo')
        if (!data.vc_answer_text || !data.vc_answer_text.trim()) throw new Error('La respuesta no puede estar vacía')

        return prisma.faq_questions.create({
            data: {
                vc_answer_text: data.vc_answer_text.trim(),
                phrases: { create: phrases.map(vc_phrase => ({ vc_phrase })) },
            },
            include: { phrases: true },
        })
    }

    async updateQuestion(id_faq_question: number, data: UpdateFaqQuestionDTO) {
        const existing = await prisma.faq_questions.findFirst({ where: { id_faq_question, i_status: 1 } })
        if (!existing) throw new Error('Pregunta no encontrada')

        return prisma.$transaction(async (tx) => {
            if (data.vc_answer_text !== undefined) {
                if (!data.vc_answer_text.trim()) throw new Error('La respuesta no puede estar vacía')
                await tx.faq_questions.update({
                    where: { id_faq_question },
                    data: { vc_answer_text: data.vc_answer_text.trim() },
                })
            }

            if (data.phrases !== undefined) {
                const phrases = data.phrases.map(p => p.trim()).filter(p => p.length > 0)
                if (phrases.length === 0) throw new Error('Debes dejar al menos una forma de preguntarlo')
                await tx.faq_question_phrases.deleteMany({ where: { id_faq_question } })
                await tx.faq_question_phrases.createMany({
                    data: phrases.map(vc_phrase => ({ id_faq_question, vc_phrase })),
                })
            }

            return tx.faq_questions.findFirst({
                where: { id_faq_question },
                include: { phrases: true },
            })
        })
    }

    async deleteQuestion(id_faq_question: number) {
        const existing = await prisma.faq_questions.findFirst({ where: { id_faq_question, i_status: 1 } })
        if (!existing) throw new Error('Pregunta no encontrada')
        await prisma.faq_questions.update({ where: { id_faq_question }, data: { i_status: 0 } })
        return { deleted: true }
    }

    async getGreeting(): Promise<string> {
        const setting = await prisma.app_settings.findUnique({ where: { vc_key: FAQ_GREETING_SETTING_KEY } })
        return setting?.vc_value ?? FAQ_GREETING_DEFAULT
    }

    async setGreeting(vc_value: string): Promise<string> {
        const trimmed = (vc_value || '').trim()
        if (!trimmed) throw new Error('El saludo no puede estar vacío')
        await prisma.app_settings.upsert({
            where: { vc_key: FAQ_GREETING_SETTING_KEY },
            create: { vc_key: FAQ_GREETING_SETTING_KEY, vc_value: trimmed },
            update: { vc_value: trimmed },
        })
        return trimmed
    }
}
"""
    escribir(path_service, content_service)
    cambios += 1
    print("OK: faq.service.ts creado")

# ---------- 4. faq.controller.ts ----------
path_controller = "src/modules/faq/faq.controller.ts"
if os.path.exists(path_controller):
    print("YA ESTABA: faq.controller.ts")
else:
    content_controller = """import { Request, Response } from 'express'
import { FaqService } from './faq.service'

const service = new FaqService()

export const listFaqQuestions = async (req: Request, res: Response) => {
    try {
        const data = await service.listQuestions()
        res.status(200).json({ ok: true, error: 0, data, message: 'Preguntas obtenidas exitosamente' })
    } catch (error) {
        console.error('LIST FAQ QUESTIONS ERROR:', (error as any).message)
        res.status(500).json({ ok: false, error: 1, data: null, message: 'Error al obtener las preguntas', error_backend: error })
    }
}

export const getFaqQuestion = async (req: Request, res: Response) => {
    try {
        const id_faq_question = Number(req.params.id_faq_question)
        const data = await service.getQuestion(id_faq_question)
        res.status(200).json({ ok: true, error: 0, data, message: 'Pregunta obtenida exitosamente' })
    } catch (error) {
        console.error('GET FAQ QUESTION ERROR:', (error as any).message)
        res.status(404).json({ ok: false, error: 1, data: null, message: (error as any).message || 'Pregunta no encontrada', error_backend: error })
    }
}

export const createFaqQuestion = async (req: Request, res: Response) => {
    try {
        const data = await service.createQuestion(req.body)
        res.status(200).json({ ok: true, error: 0, data, message: 'Pregunta creada exitosamente' })
    } catch (error) {
        console.error('CREATE FAQ QUESTION ERROR:', (error as any).message)
        res.status(500).json({ ok: false, error: 1, data: null, message: (error as any).message || 'Error al crear la pregunta', error_backend: error })
    }
}

export const updateFaqQuestion = async (req: Request, res: Response) => {
    try {
        const id_faq_question = Number(req.params.id_faq_question)
        const data = await service.updateQuestion(id_faq_question, req.body)
        res.status(200).json({ ok: true, error: 0, data, message: 'Pregunta actualizada exitosamente' })
    } catch (error) {
        console.error('UPDATE FAQ QUESTION ERROR:', (error as any).message)
        res.status(500).json({ ok: false, error: 1, data: null, message: (error as any).message || 'Error al actualizar la pregunta', error_backend: error })
    }
}

export const deleteFaqQuestion = async (req: Request, res: Response) => {
    try {
        const id_faq_question = Number(req.params.id_faq_question)
        const data = await service.deleteQuestion(id_faq_question)
        res.status(200).json({ ok: true, error: 0, data, message: 'Pregunta eliminada exitosamente' })
    } catch (error) {
        console.error('DELETE FAQ QUESTION ERROR:', (error as any).message)
        res.status(500).json({ ok: false, error: 1, data: null, message: (error as any).message || 'Error al eliminar la pregunta', error_backend: error })
    }
}

export const getFaqGreeting = async (req: Request, res: Response) => {
    try {
        const data = await service.getGreeting()
        res.status(200).json({ ok: true, error: 0, data: { vc_value: data }, message: 'Saludo obtenido exitosamente' })
    } catch (error) {
        console.error('GET FAQ GREETING ERROR:', (error as any).message)
        res.status(500).json({ ok: false, error: 1, data: null, message: 'Error al obtener el saludo', error_backend: error })
    }
}

export const updateFaqGreeting = async (req: Request, res: Response) => {
    try {
        const { vc_value } = req.body as { vc_value: string }
        const data = await service.setGreeting(vc_value)
        res.status(200).json({ ok: true, error: 0, data: { vc_value: data }, message: 'Saludo actualizado exitosamente' })
    } catch (error) {
        console.error('UPDATE FAQ GREETING ERROR:', (error as any).message)
        res.status(500).json({ ok: false, error: 1, data: null, message: (error as any).message || 'Error al actualizar el saludo', error_backend: error })
    }
}
"""
    escribir(path_controller, content_controller)
    cambios += 1
    print("OK: faq.controller.ts creado")

# ---------- 5. faq.routes.ts ----------
path_routes = "src/modules/faq/faq.routes.ts"
if os.path.exists(path_routes):
    print("YA ESTABA: faq.routes.ts")
else:
    content_routes = """import { Router } from 'express'
import { authMiddleware, requireRole } from '../../core/middleware'
import { ROLES } from '../../core/constants/status.constants'
import { listFaqQuestions, getFaqQuestion, createFaqQuestion, updateFaqQuestion, deleteFaqQuestion, getFaqGreeting, updateFaqGreeting } from './faq.controller'

const faqRouter = Router()

// El saludo lo puede leer cualquier usuario logueado (lo usara la app del
// promotor en la pantalla de "Dudas?"); solo el master lo puede cambiar.
faqRouter.get('/greeting', authMiddleware, getFaqGreeting)
faqRouter.put('/greeting', authMiddleware, requireRole(ROLES.SUPER), updateFaqGreeting)

// Solo el master administra las preguntas frecuentes.
faqRouter.get('/questions', authMiddleware, requireRole(ROLES.SUPER), listFaqQuestions)
faqRouter.get('/questions/:id_faq_question', authMiddleware, requireRole(ROLES.SUPER), getFaqQuestion)
faqRouter.post('/questions', authMiddleware, requireRole(ROLES.SUPER), createFaqQuestion)
faqRouter.put('/questions/:id_faq_question', authMiddleware, requireRole(ROLES.SUPER), updateFaqQuestion)
faqRouter.delete('/questions/:id_faq_question', authMiddleware, requireRole(ROLES.SUPER), deleteFaqQuestion)

export default faqRouter
"""
    escribir(path_routes, content_routes)
    cambios += 1
    print("OK: faq.routes.ts creado")

# ---------- 6. Registrar el router en src/modules/index.ts ----------
path_modules_index = "src/modules/index.ts"
content_mi = leer(path_modules_index)
if "faqRouter" in content_mi:
    print("YA ESTABA: faqRouter en modules/index.ts")
else:
    old_import = "import introVideosRouter from './intro-videos/intro-videos.routes'"
    new_import = "import introVideosRouter from './intro-videos/intro-videos.routes'\nimport faqRouter from './faq/faq.routes'"
    assert content_mi.count(old_import) == 1, "No encontre la linea de import esperada en modules/index.ts"
    content_mi = content_mi.replace(old_import, new_import)

    old_export = "    introVideosRouter,\n}"
    new_export = "    introVideosRouter,\n    faqRouter,\n}"
    assert content_mi.count(old_export) == 1, "No encontre el bloque de export esperado en modules/index.ts"
    content_mi = content_mi.replace(old_export, new_export)

    escribir(path_modules_index, content_mi)
    cambios += 1
    print("OK: faqRouter registrado en modules/index.ts")

# ---------- 7. Registrar la ruta en src/index.ts ----------
path_index = "src/index.ts"
content_idx = leer(path_index)
if "faqRouter" in content_idx:
    print("YA ESTABA: faqRouter en src/index.ts")
else:
    old_import_idx = "routeSchedulesRouter, introVideosRouter } from './modules'"
    new_import_idx = "routeSchedulesRouter, introVideosRouter, faqRouter } from './modules'"
    assert content_idx.count(old_import_idx) == 1, "No encontre la linea de import esperada en src/index.ts"
    content_idx = content_idx.replace(old_import_idx, new_import_idx)

    old_use = 'app.use("/retailink-api/intro-videos", introVideosRouter)'
    new_use = 'app.use("/retailink-api/intro-videos", introVideosRouter)\napp.use("/retailink-api/faq", faqRouter)'
    assert content_idx.count(old_use) == 1, "No encontre la linea de app.use esperada en src/index.ts"
    content_idx = content_idx.replace(old_use, new_use)

    escribir(path_index, content_idx)
    cambios += 1
    print("OK: ruta /retailink-api/faq registrada en src/index.ts")

print(f"TOTAL cambios aplicados: {cambios}")

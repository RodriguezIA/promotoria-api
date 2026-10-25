import io
import re

cambios = 0

def leer(path):
    with io.open(path, "r", encoding="utf-8") as f:
        return f.read()

def escribir(path, content):
    with io.open(path, "w", encoding="utf-8") as f:
        f.write(content)

# ---------- 1. faq.dto.ts: agregar tipos de pantallas/botones ----------
path_dto = "src/modules/faq/faq.dto.ts"
content_dto = leer(path_dto)
if "FaqScreenElementDTO" in content_dto:
    print("YA ESTABA: tipos de pantallas en faq.dto.ts")
else:
    content_dto = content_dto.rstrip("\n") + """

export interface FaqScreenElementDTO {
    id_faq_screen_element: number
    vc_element_key: string
    vc_label: string
    f_x: number
    f_y: number
    f_width: number
    f_height: number
}

export interface FaqScreenDTO {
    id_faq_screen: number
    vc_screen_key: string
    vc_title: string
    vc_screenshot_url: string
    elements: FaqScreenElementDTO[]
}

export interface CreateFaqScreenElementDTO {
    vc_label: string
    f_x: number
    f_y: number
    f_width: number
    f_height: number
}
"""
    escribir(path_dto, content_dto)
    cambios += 1
    print("OK: faq.dto.ts actualizado")

# ---------- 2. faq.service.ts: agregar metodos de pantallas/botones/pasos ----------
path_service = "src/modules/faq/faq.service.ts"
content_service = leer(path_service)
if "listScreens" in content_service:
    print("YA ESTABA: metodos de pantallas en faq.service.ts")
else:
    old_header = """import { prisma } from '../../core/prisma'
import { FAQ_GREETING_SETTING_KEY, FAQ_GREETING_DEFAULT, CreateFaqQuestionDTO, UpdateFaqQuestionDTO } from './faq.dto'

export class FaqService {"""
    new_header = """import { prisma } from '../../core/prisma'
import { StorageService } from '../../services/storage.service'
import { FAQ_GREETING_SETTING_KEY, FAQ_GREETING_DEFAULT, CreateFaqQuestionDTO, UpdateFaqQuestionDTO, CreateFaqScreenElementDTO } from './faq.dto'

function slugifyFaq(text: string): string {
    return text
        .normalize('NFD')
        .replace(/[\\u0300-\\u036f]/g, '')
        .replace(/[^a-zA-Z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '')
        .toLowerCase()
        .slice(0, 40)
}

export class FaqService {"""
    assert content_service.count(old_header) == 1, "No encontre el encabezado esperado en faq.service.ts"
    content_service = content_service.replace(old_header, new_header)

    # Agregar "steps" a todos los includes existentes de "phrases: true",
    # sin importar cuantos espacios de sangria tenga cada uno.
    patron_include = re.compile(r'^([ \t]*)include: \{ phrases: true \},$', re.MULTILINE)
    total_includes = len(patron_include.findall(content_service))
    assert total_includes == 4, "Esperaba 4 ocurrencias de include con phrases:true, encontre " + str(total_includes)
    content_service = patron_include.sub(
        lambda m: m.group(1) + "include: { phrases: true, steps: { include: { element: true }, orderBy: { i_order: 'asc' } } },",
        content_service,
    )

    old_tail = """        return trimmed
    }
}"""
    new_tail = """        return trimmed
    }

    async listScreens() {
        return prisma.faq_screens.findMany({
            include: { elements: true },
            orderBy: { dt_register: 'asc' },
        })
    }

    async createScreen(vc_title: string, buffer: Buffer, mime: string, originalName: string) {
        if (!vc_title || !vc_title.trim()) throw new Error('El titulo de la pantalla es requerido')

        const ext = (originalName.split('.').pop() || 'png').toLowerCase()
        const rand = Math.random().toString(36).slice(2, 8)
        const vc_screen_key = `${slugifyFaq(vc_title)}_${Date.now().toString(36)}`
        const objectPath = `faq_screens/${Date.now()}-${rand}.${ext}`

        const { url, path } = await StorageService.uploadRawFile(buffer, mime, objectPath)

        return prisma.faq_screens.create({
            data: {
                vc_screen_key,
                vc_title: vc_title.trim(),
                vc_screenshot_url: url,
                vc_screenshot_bucket_path: path,
            },
            include: { elements: true },
        })
    }

    async deleteScreen(id_faq_screen: number) {
        const screen = await prisma.faq_screens.findUnique({ where: { id_faq_screen } })
        if (!screen) throw new Error('Pantalla no encontrada')
        await prisma.faq_screens.delete({ where: { id_faq_screen } })
        await StorageService.deleteRawFile(screen.vc_screenshot_bucket_path)
        return { deleted: true }
    }

    async addScreenElement(id_faq_screen: number, data: CreateFaqScreenElementDTO) {
        const screen = await prisma.faq_screens.findUnique({ where: { id_faq_screen } })
        if (!screen) throw new Error('Pantalla no encontrada')
        if (!data.vc_label || !data.vc_label.trim()) throw new Error('El nombre del boton es requerido')

        const vc_element_key = `${slugifyFaq(data.vc_label)}_${Date.now().toString(36)}`

        return prisma.faq_screen_elements.create({
            data: {
                id_faq_screen,
                vc_element_key,
                vc_label: data.vc_label.trim(),
                f_x: data.f_x,
                f_y: data.f_y,
                f_width: data.f_width,
                f_height: data.f_height,
            },
        })
    }

    async deleteScreenElement(id_faq_screen_element: number) {
        const existing = await prisma.faq_screen_elements.findUnique({ where: { id_faq_screen_element } })
        if (!existing) throw new Error('Boton no encontrado')
        await prisma.faq_screen_elements.delete({ where: { id_faq_screen_element } })
        return { deleted: true }
    }

    async setHighlightSteps(id_faq_question: number, element_ids: number[]) {
        const question = await prisma.faq_questions.findFirst({ where: { id_faq_question, i_status: 1 } })
        if (!question) throw new Error('Pregunta no encontrada')

        return prisma.$transaction(async (tx) => {
            await tx.faq_highlight_steps.deleteMany({ where: { id_faq_question } })
            if (element_ids.length > 0) {
                await tx.faq_highlight_steps.createMany({
                    data: element_ids.map((id_faq_screen_element, idx) => ({
                        id_faq_question,
                        id_faq_screen_element,
                        i_order: idx,
                    })),
                })
            }
            return tx.faq_questions.findFirst({
                where: { id_faq_question },
                include: { phrases: true, steps: { include: { element: true }, orderBy: { i_order: 'asc' } } },
            })
        })
    }
}"""
    assert content_service.count(old_tail) == 1, "No encontre el final esperado en faq.service.ts"
    content_service = content_service.replace(old_tail, new_tail)

    escribir(path_service, content_service)
    cambios += 1
    print("OK: faq.service.ts actualizado")

# ---------- 3. faq.controller.ts: agregar controllers de pantallas/botones/pasos ----------
path_controller = "src/modules/faq/faq.controller.ts"
content_controller = leer(path_controller)
if "listFaqScreens" in content_controller:
    print("YA ESTABA: controllers de pantallas en faq.controller.ts")
else:
    nuevo_contenido_controller = """

export const listFaqScreens = async (req: Request, res: Response) => {
    try {
        const data = await service.listScreens()
        res.status(200).json({ ok: true, error: 0, data, message: 'Pantallas obtenidas exitosamente' })
    } catch (error) {
        console.error('LIST FAQ SCREENS ERROR:', (error as any).message)
        res.status(500).json({ ok: false, error: 1, data: null, message: 'Error al obtener las pantallas', error_backend: error })
    }
}

export const createFaqScreen = async (req: Request, res: Response) => {
    try {
        const { vc_title } = req.body as { vc_title: string }
        if (!req.file) {
            res.status(400).json({ ok: false, error: 1, data: null, message: 'No se recibio ninguna imagen' })
            return
        }
        const data = await service.createScreen(vc_title, req.file.buffer, req.file.mimetype, req.file.originalname)
        res.status(200).json({ ok: true, error: 0, data, message: 'Pantalla creada exitosamente' })
    } catch (error) {
        console.error('CREATE FAQ SCREEN ERROR:', (error as any).message)
        res.status(500).json({ ok: false, error: 1, data: null, message: (error as any).message || 'Error al crear la pantalla', error_backend: error })
    }
}

export const deleteFaqScreen = async (req: Request, res: Response) => {
    try {
        const id_faq_screen = Number(req.params.id_faq_screen)
        const data = await service.deleteScreen(id_faq_screen)
        res.status(200).json({ ok: true, error: 0, data, message: 'Pantalla eliminada exitosamente' })
    } catch (error) {
        console.error('DELETE FAQ SCREEN ERROR:', (error as any).message)
        res.status(500).json({ ok: false, error: 1, data: null, message: (error as any).message || 'Error al eliminar la pantalla', error_backend: error })
    }
}

export const addFaqScreenElement = async (req: Request, res: Response) => {
    try {
        const id_faq_screen = Number(req.params.id_faq_screen)
        const data = await service.addScreenElement(id_faq_screen, req.body)
        res.status(200).json({ ok: true, error: 0, data, message: 'Boton agregado exitosamente' })
    } catch (error) {
        console.error('ADD FAQ SCREEN ELEMENT ERROR:', (error as any).message)
        res.status(500).json({ ok: false, error: 1, data: null, message: (error as any).message || 'Error al agregar el boton', error_backend: error })
    }
}

export const deleteFaqScreenElement = async (req: Request, res: Response) => {
    try {
        const id_faq_screen_element = Number(req.params.id_faq_screen_element)
        const data = await service.deleteScreenElement(id_faq_screen_element)
        res.status(200).json({ ok: true, error: 0, data, message: 'Boton eliminado exitosamente' })
    } catch (error) {
        console.error('DELETE FAQ SCREEN ELEMENT ERROR:', (error as any).message)
        res.status(500).json({ ok: false, error: 1, data: null, message: (error as any).message || 'Error al eliminar el boton', error_backend: error })
    }
}

export const setFaqHighlightSteps = async (req: Request, res: Response) => {
    try {
        const id_faq_question = Number(req.params.id_faq_question)
        const { element_ids } = req.body as { element_ids: number[] }
        const data = await service.setHighlightSteps(id_faq_question, element_ids || [])
        res.status(200).json({ ok: true, error: 0, data, message: 'Pasos actualizados exitosamente' })
    } catch (error) {
        console.error('SET FAQ HIGHLIGHT STEPS ERROR:', (error as any).message)
        res.status(500).json({ ok: false, error: 1, data: null, message: (error as any).message || 'Error al actualizar los pasos', error_backend: error })
    }
}
"""
    content_controller = content_controller.rstrip("\n") + "\n" + nuevo_contenido_controller
    escribir(path_controller, content_controller)
    cambios += 1
    print("OK: faq.controller.ts actualizado")

# ---------- 4. faq.routes.ts: agregar rutas de pantallas/botones/pasos ----------
path_routes = "src/modules/faq/faq.routes.ts"
content_routes = leer(path_routes)
if "listFaqScreens" in content_routes:
    print("YA ESTABA: rutas de pantallas en faq.routes.ts")
else:
    old_import1 = "import { authMiddleware, requireRole } from '../../core/middleware'"
    new_import1 = "import { authMiddleware, requireRole, upload } from '../../core/middleware'"
    assert content_routes.count(old_import1) == 1, "No encontre el import de middleware esperado en faq.routes.ts"
    content_routes = content_routes.replace(old_import1, new_import1)

    old_import2 = "import { listFaqQuestions, getFaqQuestion, createFaqQuestion, updateFaqQuestion, deleteFaqQuestion, getFaqGreeting, updateFaqGreeting } from './faq.controller'"
    new_import2 = "import { listFaqQuestions, getFaqQuestion, createFaqQuestion, updateFaqQuestion, deleteFaqQuestion, getFaqGreeting, updateFaqGreeting, listFaqScreens, createFaqScreen, deleteFaqScreen, addFaqScreenElement, deleteFaqScreenElement, setFaqHighlightSteps } from './faq.controller'"
    assert content_routes.count(old_import2) == 1, "No encontre el import de controller esperado en faq.routes.ts"
    content_routes = content_routes.replace(old_import2, new_import2)

    old_tail_route = """faqRouter.delete('/questions/:id_faq_question', authMiddleware, requireRole(ROLES.SUPER), deleteFaqQuestion)

export default faqRouter"""
    new_tail_route = """faqRouter.delete('/questions/:id_faq_question', authMiddleware, requireRole(ROLES.SUPER), deleteFaqQuestion)
faqRouter.put('/questions/:id_faq_question/steps', authMiddleware, requireRole(ROLES.SUPER), setFaqHighlightSteps)

// Pantallas (screenshots) y botones marcados para resaltar en las respuestas.
faqRouter.get('/screens', authMiddleware, requireRole(ROLES.SUPER), listFaqScreens)
faqRouter.post('/screens', authMiddleware, requireRole(ROLES.SUPER), upload.single('screenshot'), createFaqScreen)
faqRouter.delete('/screens/:id_faq_screen', authMiddleware, requireRole(ROLES.SUPER), deleteFaqScreen)
faqRouter.post('/screens/:id_faq_screen/elements', authMiddleware, requireRole(ROLES.SUPER), addFaqScreenElement)
faqRouter.delete('/screens/elements/:id_faq_screen_element', authMiddleware, requireRole(ROLES.SUPER), deleteFaqScreenElement)

export default faqRouter"""
    assert content_routes.count(old_tail_route) == 1, "No encontre el final esperado en faq.routes.ts"
    content_routes = content_routes.replace(old_tail_route, new_tail_route)

    escribir(path_routes, content_routes)
    cambios += 1
    print("OK: faq.routes.ts actualizado")

print(f"TOTAL cambios aplicados: {cambios}")

import io

cambios = 0

def leer(path):
    with io.open(path, "r", encoding="utf-8") as f:
        return f.read()

def escribir(path, content):
    with io.open(path, "w", encoding="utf-8") as f:
        f.write(content)

# ---------- 1. faq.dto.ts: tipos de la respuesta del "cerebro" ----------
path_dto = "src/modules/faq/faq.dto.ts"
content_dto = leer(path_dto)
if "FaqAskResponseDTO" in content_dto:
    print("YA ESTABA: tipos de ask en faq.dto.ts")
else:
    content_dto = content_dto.rstrip("\n") + """

export interface FaqAskStepDTO {
    vc_label: string
    f_x: number
    f_y: number
    f_width: number
    f_height: number
    vc_screenshot_url: string
}

export interface FaqAskResponseDTO {
    matched: boolean
    id_faq_question: number | null
    vc_answer_text: string | null
    steps: FaqAskStepDTO[]
}
"""
    escribir(path_dto, content_dto)
    cambios += 1
    print("OK: faq.dto.ts actualizado")

# ---------- 2. faq.service.ts: normalizeFaqText + askQuestion ----------
path_service = "src/modules/faq/faq.service.ts"
content_service = leer(path_service)
if "askQuestion" in content_service:
    print("YA ESTABA: askQuestion en faq.service.ts")
else:
    old_header_tail = """    .toLowerCase()
        .slice(0, 40)
}

export class FaqService {"""
    new_header_tail = """    .toLowerCase()
        .slice(0, 40)
}

function normalizeFaqText(text: string): string {
    return text
        .normalize('NFD')
        .replace(/[\\u0300-\\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9\\s]/g, ' ')
        .replace(/\\s+/g, ' ')
        .trim()
}

export class FaqService {"""
    assert content_service.count(old_header_tail) == 1, "No encontre el final de slugifyFaq en faq.service.ts"
    content_service = content_service.replace(old_header_tail, new_header_tail)

    old_tail = """            return tx.faq_questions.findFirst({
                where: { id_faq_question },
                include: { phrases: true, steps: { include: { element: true }, orderBy: { i_order: 'asc' } } },
            })
        })
    }
}"""
    new_tail = """            return tx.faq_questions.findFirst({
                where: { id_faq_question },
                include: { phrases: true, steps: { include: { element: true }, orderBy: { i_order: 'asc' } } },
            })
        })
    }

    async askQuestion(message: string) {
        const inputNorm = normalizeFaqText(message)
        if (!inputNorm) {
            return { matched: false, id_faq_question: null, vc_answer_text: null, steps: [] }
        }
        const inputWords = new Set(inputNorm.split(' ').filter((w) => w.length > 1))

        const questions = await prisma.faq_questions.findMany({
            where: { i_status: 1 },
            include: {
                phrases: true,
                steps: { include: { element: { include: { screen: true } } }, orderBy: { i_order: 'asc' } },
            },
        })

        let mejor: { question: (typeof questions)[number]; score: number } | null = null
        for (const q of questions) {
            for (const p of q.phrases) {
                const phraseNorm = normalizeFaqText(p.vc_phrase)
                const phraseWords = phraseNorm.split(' ').filter((w) => w.length > 1)
                if (phraseWords.length === 0) continue
                let coincidencias = 0
                for (const w of phraseWords) {
                    if (inputWords.has(w)) coincidencias++
                }
                let score = coincidencias / phraseWords.length
                if (inputNorm.includes(phraseNorm) || phraseNorm.includes(inputNorm)) {
                    score = Math.max(score, 0.85)
                }
                if (!mejor || score > mejor.score) mejor = { question: q, score }
            }
        }

        const UMBRAL_MINIMO = 0.6
        if (!mejor || mejor.score < UMBRAL_MINIMO) {
            return { matched: false, id_faq_question: null, vc_answer_text: null, steps: [] }
        }

        return {
            matched: true,
            id_faq_question: mejor.question.id_faq_question,
            vc_answer_text: mejor.question.vc_answer_text,
            steps: mejor.question.steps.map((s) => ({
                vc_label: s.element.vc_label,
                f_x: s.element.f_x,
                f_y: s.element.f_y,
                f_width: s.element.f_width,
                f_height: s.element.f_height,
                vc_screenshot_url: s.element.screen.vc_screenshot_url,
            })),
        }
    }
}"""
    assert content_service.count(old_tail) == 1, "No encontre el final esperado en faq.service.ts"
    content_service = content_service.replace(old_tail, new_tail)

    escribir(path_service, content_service)
    cambios += 1
    print("OK: faq.service.ts actualizado")

# ---------- 3. faq.controller.ts: handler de /ask ----------
path_controller = "src/modules/faq/faq.controller.ts"
content_controller = leer(path_controller)
if "askFaqQuestion" in content_controller:
    print("YA ESTABA: askFaqQuestion en faq.controller.ts")
else:
    nuevo_contenido_controller = """

export const askFaqQuestion = async (req: Request, res: Response) => {
    try {
        const { message } = req.body as { message: string }
        const data = await service.askQuestion(message || '')
        res.status(200).json({ ok: true, error: 0, data, message: 'Consulta procesada' })
    } catch (error) {
        console.error('ASK FAQ ERROR:', (error as any).message)
        res.status(500).json({ ok: false, error: 1, data: null, message: 'Error al procesar la pregunta', error_backend: error })
    }
}
"""
    content_controller = content_controller.rstrip("\n") + "\n" + nuevo_contenido_controller
    escribir(path_controller, content_controller)
    cambios += 1
    print("OK: faq.controller.ts actualizado")

# ---------- 4. faq.routes.ts: ruta POST /ask ----------
path_routes = "src/modules/faq/faq.routes.ts"
content_routes = leer(path_routes)
if "askFaqQuestion" in content_routes:
    print("YA ESTABA: ruta /ask en faq.routes.ts")
else:
    old_import = "import { listFaqQuestions, getFaqQuestion, createFaqQuestion, updateFaqQuestion, deleteFaqQuestion, getFaqGreeting, updateFaqGreeting, listFaqScreens, createFaqScreen, deleteFaqScreen, addFaqScreenElement, deleteFaqScreenElement, setFaqHighlightSteps } from './faq.controller'"
    new_import = "import { listFaqQuestions, getFaqQuestion, createFaqQuestion, updateFaqQuestion, deleteFaqQuestion, getFaqGreeting, updateFaqGreeting, listFaqScreens, createFaqScreen, deleteFaqScreen, addFaqScreenElement, deleteFaqScreenElement, setFaqHighlightSteps, askFaqQuestion } from './faq.controller'"
    assert content_routes.count(old_import) == 1, "No encontre el import del controller esperado en faq.routes.ts"
    content_routes = content_routes.replace(old_import, new_import)

    old_greeting_line = "faqRouter.get('/greeting', authMiddleware, getFaqGreeting)"
    new_greeting_line = "faqRouter.get('/greeting', authMiddleware, getFaqGreeting)\nfaqRouter.post('/ask', authMiddleware, askFaqQuestion)"
    assert content_routes.count(old_greeting_line) == 1, "No encontre la ruta de greeting esperada en faq.routes.ts"
    content_routes = content_routes.replace(old_greeting_line, new_greeting_line)

    escribir(path_routes, content_routes)
    cambios += 1
    print("OK: faq.routes.ts actualizado")

print(f"TOTAL cambios aplicados: {cambios}")

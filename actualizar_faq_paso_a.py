import io

def leer(path):
    with io.open(path, "r", encoding="utf-8") as f:
        return f.read()

def escribir(path, content):
    with io.open(path, "w", encoding="utf-8") as f:
        f.write(content)

# ---------- 1. faq.dto.ts ----------
path = "src/modules/faq/faq.dto.ts"
content = leer(path)

old1 = """export interface FaqScreenDTO {
    id_faq_screen: number
    vc_screen_key: string
    vc_title: string
    vc_screenshot_url: string
    elements: FaqScreenElementDTO[]
}"""
new1 = """export interface FaqScreenDTO {
    id_faq_screen: number
    vc_screen_key: string
    vc_title: string
    vc_screenshot_url: string
    vc_app_route: string | null
    elements: FaqScreenElementDTO[]
}"""
assert content.count(old1) == 1, "No encontre FaqScreenDTO"
content = content.replace(old1, new1)

old2 = """export interface FaqAskStepDTO {
    vc_label: string
    f_x: number
    f_y: number
    f_width: number
    f_height: number
    vc_screenshot_url: string
}"""
new2 = """export interface FaqAskStepDTO {
    vc_label: string
    f_x: number
    f_y: number
    f_width: number
    f_height: number
    vc_screenshot_url: string
    vc_app_route: string | null
}"""
assert content.count(old2) == 1, "No encontre FaqAskStepDTO"
content = content.replace(old2, new2)

escribir(path, content)
print("OK: faq.dto.ts actualizado")

# ---------- 2. faq.service.ts ----------
path = "src/modules/faq/faq.service.ts"
content = leer(path)

old3 = "    async createScreen(vc_title: string, buffer: Buffer, mime: string, originalName: string) {"
new3 = "    async createScreen(vc_title: string, buffer: Buffer, mime: string, originalName: string, vc_app_route?: string | null) {"
assert content.count(old3) == 1, "No encontre la firma de createScreen"
content = content.replace(old3, new3)

old4 = """                vc_screenshot_url: url,
                vc_screenshot_bucket_path: path,
            },
            include: { elements: true },
        })
    }"""
new4 = """                vc_screenshot_url: url,
                vc_screenshot_bucket_path: path,
                vc_app_route: vc_app_route || null,
            },
            include: { elements: true },
        })
    }"""
assert content.count(old4) == 1, "No encontre el bloque de create de faq_screens"
content = content.replace(old4, new4)

old5 = """                vc_screenshot_url: s.element.screen.vc_screenshot_url,
            })),
        }"""
new5 = """                vc_screenshot_url: s.element.screen.vc_screenshot_url,
                vc_app_route: s.element.screen.vc_app_route,
            })),
        }"""
assert content.count(old5) == 1, "No encontre el mapeo de steps en askQuestion"
content = content.replace(old5, new5)

escribir(path, content)
print("OK: faq.service.ts actualizado")

# ---------- 3. faq.controller.ts ----------
path = "src/modules/faq/faq.controller.ts"
content = leer(path)

old6 = """        const { vc_title } = req.body as { vc_title: string }
        if (!req.file) {
            res.status(400).json({ ok: false, error: 1, data: null, message: 'No se recibio ninguna imagen' })
            return
        }
        const data = await service.createScreen(vc_title, req.file.buffer, req.file.mimetype, req.file.originalname)"""
new6 = """        const { vc_title, vc_app_route } = req.body as { vc_title: string; vc_app_route?: string }
        if (!req.file) {
            res.status(400).json({ ok: false, error: 1, data: null, message: 'No se recibio ninguna imagen' })
            return
        }
        const data = await service.createScreen(vc_title, req.file.buffer, req.file.mimetype, req.file.originalname, vc_app_route)"""
assert content.count(old6) == 1, "No encontre createFaqScreen"
content = content.replace(old6, new6)

escribir(path, content)
print("OK: faq.controller.ts actualizado")

print("TODO LISTO - Paso A backend completo")

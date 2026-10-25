import io

def leer(path):
    with io.open(path, "r", encoding="utf-8") as f:
        return f.read()

def escribir(path, content):
    with io.open(path, "w", encoding="utf-8") as f:
        f.write(content)

# ---------- faq.dto.ts ----------
path = "src/modules/faq/faq.dto.ts"
content = leer(path)

old1 = """export interface FaqScreenElementDTO {
    id_faq_screen_element: number
    vc_element_key: string
    vc_label: string
    f_x: number
    f_y: number
    f_width: number
    f_height: number
}"""
new1 = """export interface FaqScreenElementDTO {
    id_faq_screen_element: number
    vc_element_key: string
    vc_label: string
    f_x: number
    f_y: number
    f_width: number
    f_height: number
    vc_direction: string | null
}"""
assert content.count(old1) == 1, "No encontre FaqScreenElementDTO"
content = content.replace(old1, new1)

old2 = """export interface CreateFaqScreenElementDTO {
    vc_label: string
    f_x: number
    f_y: number
    f_width: number
    f_height: number
}"""
new2 = """export interface CreateFaqScreenElementDTO {
    vc_label: string
    f_x: number
    f_y: number
    f_width: number
    f_height: number
    vc_direction?: string
}"""
assert content.count(old2) == 1, "No encontre CreateFaqScreenElementDTO"
content = content.replace(old2, new2)

old3 = """export interface FaqAskStepDTO {
    vc_label: string
    f_x: number
    f_y: number
    f_width: number
    f_height: number
    vc_screenshot_url: string
    vc_app_route: string | null
}"""
new3 = """export interface FaqAskStepDTO {
    vc_label: string
    f_x: number
    f_y: number
    f_width: number
    f_height: number
    vc_screenshot_url: string
    vc_app_route: string | null
    vc_direction: string | null
}"""
assert content.count(old3) == 1, "No encontre FaqAskStepDTO"
content = content.replace(old3, new3)

escribir(path, content)
print("OK: faq.dto.ts actualizado")

# ---------- faq.service.ts ----------
path = "src/modules/faq/faq.service.ts"
content = leer(path)

old4 = """        return prisma.faq_screen_elements.create({
            data: {
                id_faq_screen,
                vc_element_key,
                vc_label: data.vc_label.trim(),
                f_x: data.f_x,
                f_y: data.f_y,
                f_width: data.f_width,
                f_height: data.f_height,
            },
        })"""
new4 = """        return prisma.faq_screen_elements.create({
            data: {
                id_faq_screen,
                vc_element_key,
                vc_label: data.vc_label.trim(),
                f_x: data.f_x,
                f_y: data.f_y,
                f_width: data.f_width,
                f_height: data.f_height,
                vc_direction: data.vc_direction || null,
            },
        })"""
assert content.count(old4) == 1, "No encontre el create de faq_screen_elements"
content = content.replace(old4, new4)

old5 = """                vc_screenshot_url: s.element.screen.vc_screenshot_url,
                vc_app_route: s.element.screen.vc_app_route,
            })),
        }"""
new5 = """                vc_screenshot_url: s.element.screen.vc_screenshot_url,
                vc_app_route: s.element.screen.vc_app_route,
                vc_direction: s.element.vc_direction,
            })),
        }"""
assert content.count(old5) == 1, "No encontre el mapeo de steps en askQuestion"
content = content.replace(old5, new5)

escribir(path, content)
print("OK: faq.service.ts actualizado")

print("TODO LISTO")

import io

path = "src/modules/faq/faq.service.ts"
with io.open(path, "r", encoding="utf-8") as f:
    content = f.read()

old = """    async deleteScreen(id_faq_screen: number) {
        const screen = await prisma.faq_screens.findUnique({ where: { id_faq_screen } })
        if (!screen) throw new Error('Pantalla no encontrada')
        await prisma.faq_screens.delete({ where: { id_faq_screen } })
        await StorageService.deleteRawFile(screen.vc_screenshot_bucket_path)
        return { deleted: true }
    }"""

new = """    async deleteScreen(id_faq_screen: number) {
        const screen = await prisma.faq_screens.findUnique({ where: { id_faq_screen } })
        if (!screen) throw new Error('Pantalla no encontrada')

        await prisma.$transaction(async (tx) => {
            const elementos = await tx.faq_screen_elements.findMany({ where: { id_faq_screen } })
            const idsElementos = elementos.map((e) => e.id_faq_screen_element)
            if (idsElementos.length > 0) {
                await tx.faq_highlight_steps.deleteMany({ where: { id_faq_screen_element: { in: idsElementos } } })
                await tx.faq_screen_elements.deleteMany({ where: { id_faq_screen } })
            }
            await tx.faq_screens.delete({ where: { id_faq_screen } })
        })

        await StorageService.deleteRawFile(screen.vc_screenshot_bucket_path)
        return { deleted: true }
    }"""

assert content.count(old) == 1, "No encontre deleteScreen"
content = content.replace(old, new)

with io.open(path, "w", encoding="utf-8") as f:
    f.write(content)

print("OK: deleteScreen arreglado")

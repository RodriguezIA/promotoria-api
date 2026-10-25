import io

path = "prisma/schema.prisma"
with io.open(path, "r", encoding="utf-8") as f:
    content = f.read()

marcador = "vc_app_route"
if marcador in content:
    print("YA ESTABA: vc_app_route en schema.prisma")
else:
    old = "  vc_screenshot_bucket_path String   @db.VarChar(500)"
    new = "  vc_screenshot_bucket_path String   @db.VarChar(500)\n  vc_app_route              String?  @db.VarChar(100)"
    assert content.count(old) == 1, "No encontre la linea esperada en faq_screens"
    content = content.replace(old, new)
    with io.open(path, "w", encoding="utf-8") as f:
        f.write(content)
    print("OK: vc_app_route agregado al schema")

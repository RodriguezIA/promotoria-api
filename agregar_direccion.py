import io

path = "prisma/schema.prisma"
with io.open(path, "r", encoding="utf-8") as f:
    content = f.read()

marcador = "vc_direction"
if marcador in content:
    print("YA ESTABA: vc_direction en schema.prisma")
else:
    old = "  f_height              Float\n"
    assert content.count(old) == 1, "No encontre la linea exacta de f_height"
    new = old + "  vc_direction          String?  @db.VarChar(20)\n"
    content = content.replace(old, new)
    with io.open(path, "w", encoding="utf-8") as f:
        f.write(content)
    print("OK: vc_direction agregado al schema")

import io

cambios = 0

def leer(path):
    with io.open(path, "r", encoding="utf-8") as f:
        return f.read()

def escribir(path, content):
    with io.open(path, "w", encoding="utf-8") as f:
        f.write(content)

# ---------- 1. promoter.schema.ts: aceptar vc_gender en el PATCH de perfil ----------
path_schema = "src/modules/promoter/promoter.schema.ts"
content_schema = leer(path_schema)
if "vc_gender" in content_schema:
    print("YA ESTABA: vc_gender en promoter.schema.ts")
else:
    old = """export const updatePromoterProfileSchema = z.object({
  name: z.string().min(1, 'name no puede estar vacío').optional(),
  lastname: z.string().optional(),
  email: z.string().email('email debe ser válido').optional().or(z.literal('')),
  phone: z.string().min(1, 'phone no puede estar vacío').optional(),
});"""
    new = """export const updatePromoterProfileSchema = z.object({
  name: z.string().min(1, 'name no puede estar vacío').optional(),
  lastname: z.string().optional(),
  email: z.string().email('email debe ser válido').optional().or(z.literal('')),
  phone: z.string().min(1, 'phone no puede estar vacío').optional(),
  b_show_intro_videos: z.boolean().optional(),
  vc_gender: z.enum(['M', 'F']).optional(),
});"""
    assert content_schema.count(old) == 1, "No encontre el schema esperado en promoter.schema.ts"
    content_schema = content_schema.replace(old, new)
    escribir(path_schema, content_schema)
    cambios += 1
    print("OK: promoter.schema.ts actualizado")

# ---------- 2. promoter.dtos.ts: agregar vc_gender al DTO ----------
path_dtos = "src/modules/promoter/promoter.dtos.ts"
content_dtos = leer(path_dtos)
if "vc_gender" in content_dtos:
    print("YA ESTABA: vc_gender en promoter.dtos.ts")
else:
    old = """export interface UpdatePromoterProfileDTO {
    name?: string
    lastname?: string
    email?: string
    phone?: string
    b_show_intro_videos?: boolean
}"""
    new = """export interface UpdatePromoterProfileDTO {
    name?: string
    lastname?: string
    email?: string
    phone?: string
    b_show_intro_videos?: boolean
    vc_gender?: string
}"""
    assert content_dtos.count(old) == 1, "No encontre el DTO esperado en promoter.dtos.ts"
    content_dtos = content_dtos.replace(old, new)
    escribir(path_dtos, content_dtos)
    cambios += 1
    print("OK: promoter.dtos.ts actualizado")

# ---------- 3. promoter.service.ts: guardar vc_gender ----------
path_service = "src/modules/promoter/promoter.service.ts"
content_service = leer(path_service)
if "data.vc_gender" in content_service:
    print("YA ESTABA: vc_gender en promoter.service.ts")
else:
    old = "                ...(data.b_show_intro_videos !== undefined ? { b_show_intro_videos: data.b_show_intro_videos } : {}),"
    new = "                ...(data.b_show_intro_videos !== undefined ? { b_show_intro_videos: data.b_show_intro_videos } : {}),\n                ...(data.vc_gender !== undefined ? { vc_gender: data.vc_gender } : {}),"
    assert content_service.count(old) == 1, "No encontre la linea esperada en promoter.service.ts"
    content_service = content_service.replace(old, new)
    escribir(path_service, content_service)
    cambios += 1
    print("OK: promoter.service.ts actualizado")

print(f"TOTAL cambios aplicados: {cambios}")

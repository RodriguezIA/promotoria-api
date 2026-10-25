import io

path = "prisma/schema.prisma"
with io.open(path, "r", encoding="utf-8") as f:
    content = f.read()

if "turno" in content and "preorder_date_mode" in content:
    print("YA ESTABA: los campos ya existen en schema.prisma")
    raise SystemExit

# 1. Agregar campo "turno" a route_driver_schedules
old_schedule = """  /// Cada cuantas semanas se repite: 1=cada semana, 2=cada 2, 3=cada 3, 4=cada 4
  interval_weeks    Int              @db.TinyInt
  /// Semana de referencia para contar el intervalo (la fecha en que se creo
  /// la primer ruta de esta asignacion). No cambia aunque pasen las semanas.
  anchor_date       DateTime         @db.Date
  is_active         Boolean          @default(true)"""

new_schedule = """  /// Cada cuantas semanas se repite: 1=cada semana, 2=cada 2, 3=cada 3, 4=cada 4
  interval_weeks    Int              @db.TinyInt
  /// Semana de referencia para contar el intervalo (la fecha en que se creo
  /// la primer ruta de esta asignacion). No cambia aunque pasen las semanas.
  anchor_date       DateTime         @db.Date
  /// Turno de la visita en este dia: 'MANANA' o 'TARDE'
  turno             String           @default("MANANA") @db.VarChar(10)
  is_active         Boolean          @default(true)"""

assert content.count(old_schedule) == 1, "No encontre el bloque de route_driver_schedules tal cual esperaba"
content = content.replace(old_schedule, new_schedule)

# 2. Agregar campo "preorder_date_mode" a requests
old_requests = """  b_preorder       Boolean            @default(false)
  url_rack_image   String?            @db.VarChar(500)"""

new_requests = """  b_preorder       Boolean            @default(false)
  /// Solo aplica si b_preorder es true. 'ABIERTA': el encargado de la tienda
  /// elige la fecha/turno de entrega. 'CERRADA': se asigna automaticamente
  /// segun la ruta del cliente.
  preorder_date_mode String           @default("ABIERTA") @db.VarChar(10)
  url_rack_image   String?            @db.VarChar(500)"""

assert content.count(old_requests) == 1, "No encontre el bloque de requests tal cual esperaba"
content = content.replace(old_requests, new_requests)

with io.open(path, "w", encoding="utf-8") as f:
    f.write(content)

print("OK: campos 'turno' y 'preorder_date_mode' agregados a schema.prisma")


import io

path = "src/modules/delivery-routes/delivery-routes.service.ts"
with io.open(path, "r", encoding="utf-8") as f:
    content = f.read()

old = "schedule: { select: { id_schedule: true, day_of_week: true, interval_weeks: true } },"
new = "schedule: { select: { id_schedule: true, day_of_week: true, interval_weeks: true, turno: true } },"

if new in content:
    print("YA ESTABA: ya incluye turno")
else:
    assert content.count(old) == 1, "No encontre la linea esperada del select de schedule"
    content = content.replace(old, new)
    with io.open(path, "w", encoding="utf-8") as f:
        f.write(content)
    print("OK: delivery-routes.service.ts actualizado para incluir turno")

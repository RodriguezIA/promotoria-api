import io

path = "src/modules/route-schedules/route-schedules.service.ts"
with io.open(path, "r", encoding="utf-8") as f:
    content = f.read()

old = """        let daysUntilTarget = schedule.day_of_week - fromDayOfWeek
        if (daysUntilTarget < 0) daysUntilTarget += 7"""

new = """        let daysUntilTarget = schedule.day_of_week - fromDayOfWeek
        if (daysUntilTarget <= 0) daysUntilTarget += 7"""

assert content.count(old) == 1, "No encontre la linea esperada tal cual"
content = content.replace(old, new)

with io.open(path, "w", encoding="utf-8") as f:
    f.write(content)

print("OK: computeNextDeliveryDate corregido, ya no ofrece 'hoy' si ya paso el dia/horario")

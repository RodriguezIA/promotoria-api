import io

cambios = 0

# ---------- 1. Controller ----------
path_ctrl = "src/modules/route-schedules/route-schedules.controller.ts"
with io.open(path_ctrl, "r", encoding="utf-8") as f:
    ctrl = f.read()

old_ctrl = """        const { id_client, id_route_template, id_driver, day_of_week, interval_weeks, anchor_date, turno } = req.body
        if (!id_client || !id_route_template || !id_driver || !day_of_week || !interval_weeks || !anchor_date || !turno) {
            res.status(400).json({ ok: false, error: 1, data: null, message: 'Faltan datos para crear la asignación automática' })
            return
        }
        if (turno !== 'MANANA' && turno !== 'TARDE') {
            res.status(400).json({ ok: false, error: 1, data: null, message: "El turno debe ser 'MANANA' o 'TARDE'" })
            return
        }
        const schedule = await service.create({
            id_client: Number(id_client),
            id_route_template: Number(id_route_template),
            id_driver: Number(id_driver),
            day_of_week: Number(day_of_week),
            interval_weeks: Number(interval_weeks),
            anchor_date: new Date(anchor_date),
            turno,
        })"""

new_ctrl = """        const { id_client, id_route_template, id_driver, day_of_week, interval_weeks, anchor_date } = req.body
        if (!id_client || !id_route_template || !id_driver || !day_of_week || !interval_weeks || !anchor_date) {
            res.status(400).json({ ok: false, error: 1, data: null, message: 'Faltan datos para crear la asignación automática' })
            return
        }
        const schedule = await service.create({
            id_client: Number(id_client),
            id_route_template: Number(id_route_template),
            id_driver: Number(id_driver),
            day_of_week: Number(day_of_week),
            interval_weeks: Number(interval_weeks),
            anchor_date: new Date(anchor_date),
        })"""

if old_ctrl in ctrl:
    assert ctrl.count(old_ctrl) == 1, "No encontre el bloque esperado en route-schedules.controller.ts"
    ctrl = ctrl.replace(old_ctrl, new_ctrl)
    with io.open(path_ctrl, "w", encoding="utf-8") as f:
        f.write(ctrl)
    print("OK: controller revertido")
    cambios += 1
else:
    print("YA ESTABA: el controller ya no tiene 'turno'")

# ---------- 2. Service ----------
path_svc = "src/modules/route-schedules/route-schedules.service.ts"
with io.open(path_svc, "r", encoding="utf-8") as f:
    svc = f.read()

old_svc = """    async create(data: { id_client: number; id_route_template: number; id_driver: number; day_of_week: number; interval_weeks: number; anchor_date: Date; turno: string }) {
        return await prisma.route_driver_schedules.create({
            data: {
                id_client: data.id_client,
                id_route_template: data.id_route_template,
                id_driver: data.id_driver,
                day_of_week: data.day_of_week,
                interval_weeks: data.interval_weeks,
                anchor_date: data.anchor_date,
                turno: data.turno,
            },
        })
    }"""

new_svc = """    async create(data: { id_client: number; id_route_template: number; id_driver: number; day_of_week: number; interval_weeks: number; anchor_date: Date }) {
        return await prisma.route_driver_schedules.create({
            data: {
                id_client: data.id_client,
                id_route_template: data.id_route_template,
                id_driver: data.id_driver,
                day_of_week: data.day_of_week,
                interval_weeks: data.interval_weeks,
                anchor_date: data.anchor_date,
            },
        })
    }"""

if old_svc in svc:
    assert svc.count(old_svc) == 1, "No encontre el bloque esperado en route-schedules.service.ts"
    svc = svc.replace(old_svc, new_svc)
    with io.open(path_svc, "w", encoding="utf-8") as f:
        f.write(svc)
    print("OK: service revertido")
    cambios += 1
else:
    print("YA ESTABA: el service ya no tiene 'turno'")

# ---------- 3. delivery-routes.service.ts ----------
path_dr = "src/modules/delivery-routes/delivery-routes.service.ts"
with io.open(path_dr, "r", encoding="utf-8") as f:
    dr = f.read()

old_dr = "schedule: { select: { id_schedule: true, day_of_week: true, interval_weeks: true, turno: true } },"
new_dr = "schedule: { select: { id_schedule: true, day_of_week: true, interval_weeks: true } },"

if old_dr in dr:
    assert dr.count(old_dr) == 1, "No encontre la linea esperada del select de schedule"
    dr = dr.replace(old_dr, new_dr)
    with io.open(path_dr, "w", encoding="utf-8") as f:
        f.write(dr)
    print("OK: delivery-routes.service.ts revertido")
    cambios += 1
else:
    print("YA ESTABA: delivery-routes.service.ts ya no tiene 'turno'")

print(f"TOTAL cambios aplicados: {cambios}")

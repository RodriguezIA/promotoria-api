import io

cambios = 0

def leer(path):
    with io.open(path, "r", encoding="utf-8") as f:
        return f.read()

def escribir(path, content):
    with io.open(path, "w", encoding="utf-8") as f:
        f.write(content)

# ---------- 1. preorder.service.ts: agregar metodo getDeliveryTurno ----------
path1 = "src/modules/preorder/preorder.service.ts"
c1 = leer(path1)
if "async getDeliveryTurno" in c1:
    print("YA ESTABA: preorder.service.ts ya tiene getDeliveryTurno")
else:
    old1 = """    async getPreorder(id_task: number) {"""
    new1 = """    /**
     * Para que la app sepa, antes de levantar el pedido, si a esta tarea le
     * toca "Fecha cerrada" (fecha/turno calculados solos segun la ruta
     * asignada a la tienda) o "Fecha abierta" (se piden a mano, como antes).
     * Tambien cae en "ABIERTA" si la solicitud es CERRADA pero la tienda no
     * tiene ruta asignada.
     */
    async getDeliveryTurno(id_task: number) {
        const task = await this.getTaskWithPreorderCheck(id_task)

        if (task.request?.preorder_date_mode !== 'CERRADA') {
            return { mode: 'ABIERTA' as const }
        }

        const schedule = await this.routeScheduleService.findActiveScheduleForStore(task.id_store)
        if (!schedule) {
            return { mode: 'ABIERTA' as const }
        }

        const date = this.routeScheduleService.computeNextDeliveryDate(schedule)
        const time = schedule.turno === 'MANANA' ? 'MAÑANA' : 'TARDE'
        return { mode: 'CERRADA' as const, preferred_date: date, preferred_time: time }
    }

    async getPreorder(id_task: number) {"""
    assert c1.count(old1) == 1, "No encontre getPreorder tal cual esperaba en preorder.service.ts"
    c1 = c1.replace(old1, new1)
    escribir(path1, c1)
    print("OK: preorder.service.ts actualizado")
    cambios += 1

# ---------- 2. preorder.controller.ts: corregir 'service' -> 'preorderService' ----------
path2 = "src/modules/preorder/preorder.controller.ts"
c2 = leer(path2)
old2 = "const data = await service.getDeliveryTurno(id_task)"
new2 = "const data = await preorderService.getDeliveryTurno(id_task)"
if new2 in c2 and old2 not in c2:
    print("YA ESTABA: preorder.controller.ts ya tiene el fix")
else:
    assert c2.count(old2) == 1, "No encontre la linea esperada en preorder.controller.ts"
    c2 = c2.replace(old2, new2)
    escribir(path2, c2)
    print("OK: preorder.controller.ts corregido")
    cambios += 1

print(f"TOTAL cambios aplicados: {cambios}")

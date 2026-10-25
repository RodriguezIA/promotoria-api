import io

path = "src/modules/preorder/preorder.service.ts"
with io.open(path, "r", encoding="utf-8") as f:
    content = f.read()

old = """    async getDeliveryTurno(id_task: number) {
        const task = await this.getTaskWithPreorderCheck(id_task)
        const entry = await prisma.route_template_stores.findFirst({
            where: { id_store: task.id_store, route_template: { id_client: task.id_client } },
            select: { turno: true, route_template: { select: { name: true } } },
        })
        if (!entry) return { has_route: false, turno: null, route_name: null }
        return { has_route: true, turno: entry.turno, route_name: entry.route_template.name }
    }"""

new = """    /**
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
    }"""

assert content.count(old) == 1, "No encontre el metodo viejo tal cual esperaba"
content = content.replace(old, new)

with io.open(path, "w", encoding="utf-8") as f:
    f.write(content)

print("OK: getDeliveryTurno reemplazado por la version correcta")

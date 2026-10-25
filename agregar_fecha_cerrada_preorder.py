import io

cambios = 0

def leer(path):
    with io.open(path, "r", encoding="utf-8") as f:
        return f.read()

def escribir(path, content):
    with io.open(path, "w", encoding="utf-8") as f:
        f.write(content)

# ---------- 1. route-schedules.service.ts: nuevos metodos ----------
path1 = "src/modules/route-schedules/route-schedules.service.ts"
c1 = leer(path1)
if "findActiveScheduleForStore" in c1:
    print("YA ESTABA: route-schedules.service.ts ya tiene findActiveScheduleForStore")
else:
    old1 = """    async delete(id_schedule: number) {
        return await prisma.route_driver_schedules.update({
            where: { id_schedule },
            data: { is_active: false },
        })
    }

    /**
     * Revisa todas las asignaciones automaticas activas y, para las que hoy"""
    new1 = """    async delete(id_schedule: number) {
        return await prisma.route_driver_schedules.update({
            where: { id_schedule },
            data: { is_active: false },
        })
    }

    /**
     * Busca si esta tienda esta en alguna ruta con una asignacion automatica
     * activa (route_template_stores -> route_templates -> route_driver_schedules).
     * Se usa para "Fecha cerrada" de prepedidos: si la tienda tiene ruta, se
     * calcula la fecha/turno de entrega solos; si no, se deja como fecha
     * abierta (el encargado/promotor elige a mano).
     */
    async findActiveScheduleForStore(id_store: number) {
        const link = await prisma.route_template_stores.findFirst({
            where: { id_store },
            include: {
                route_template: {
                    include: {
                        schedules: { where: { is_active: true } },
                    },
                },
            },
        })
        return link?.route_template.schedules[0] ?? null
    }

    /**
     * Calcula la proxima fecha (a partir de hoy) en la que le toca entrega a
     * esta asignacion automatica, respetando el dia de la semana, el
     * intervalo de semanas y la fecha ancla. Mismo criterio de
     * dias/semana que runDailyCheck() de abajo.
     */
    computeNextDeliveryDate(schedule: { day_of_week: number; interval_weeks: number; anchor_date: Date }, from: Date = new Date()) {
        const fromDateOnly = new Date(from.getFullYear(), from.getMonth(), from.getDate())
        const jsDay = fromDateOnly.getDay()
        const fromDayOfWeek = jsDay === 0 ? 7 : jsDay

        let daysUntilTarget = schedule.day_of_week - fromDayOfWeek
        if (daysUntilTarget < 0) daysUntilTarget += 7

        let candidate = new Date(fromDateOnly)
        candidate.setDate(candidate.getDate() + daysUntilTarget)

        const anchor = new Date(schedule.anchor_date)
        const anchorDateOnly = new Date(anchor.getFullYear(), anchor.getMonth(), anchor.getDate())
        const msPerWeek = 7 * 24 * 60 * 60 * 1000

        while (true) {
            const weeksSinceAnchor = Math.round((candidate.getTime() - anchorDateOnly.getTime()) / msPerWeek)
            if (weeksSinceAnchor >= 0 && weeksSinceAnchor % schedule.interval_weeks === 0) {
                return candidate
            }
            candidate = new Date(candidate)
            candidate.setDate(candidate.getDate() + 7)
        }
    }

    /**
     * Revisa todas las asignaciones automaticas activas y, para las que hoy"""
    assert c1.count(old1) == 1, "No encontre el bloque esperado en route-schedules.service.ts"
    c1 = c1.replace(old1, new1)
    escribir(path1, c1)
    print("OK: route-schedules.service.ts actualizado")
    cambios += 1

# ---------- 2. preorder.service.ts ----------
path2 = "src/modules/preorder/preorder.service.ts"
c2 = leer(path2)
if "preorder_date_mode" in c2:
    print("YA ESTABA: preorder.service.ts ya tiene preorder_date_mode")
else:
    old_import = """import { prisma } from '../../core/prisma'
import { StorageService } from '../../services/storage.service'

interface PreorderItemInput {
    id_product: number
    quantity: number
}

export class Preorder {"""
    new_import = """import { prisma } from '../../core/prisma'
import { StorageService } from '../../services/storage.service'
import { RouteScheduleService } from '../route-schedules/route-schedules.service'

interface PreorderItemInput {
    id_product: number
    quantity: number
}

export class Preorder {
    private routeScheduleService = new RouteScheduleService()"""
    assert c2.count(old_import) == 1, "No encontre el bloque de import esperado en preorder.service.ts"
    c2 = c2.replace(old_import, new_import)

    old_select = """                request: {
                    select: {
                        b_preorder: true,
                        request_products: { select: { id_product: true } },
                    }
                },"""
    new_select = """                request: {
                    select: {
                        b_preorder: true,
                        preorder_date_mode: true,
                        request_products: { select: { id_product: true } },
                    }
                },"""
    assert c2.count(old_select) == 1, "No encontre el select esperado en preorder.service.ts"
    c2 = c2.replace(old_select, new_select)

    old_signature = """    async createPreorder(input: {
        id_task: number
        manager_whatsapp: string
        preferred_date: Date
        preferred_time: 'MAÑANA' | 'TARDE'
        signature: { buffer: Buffer; mime: string }
        items: PreorderItemInput[]
    }) {
        const task = await this.getTaskWithPreorderCheck(input.id_task)

        const existing = await prisma.task_preorders.findUnique({ where: { id_task: input.id_task } })
        if (existing) throw new Error('Esta tarea ya tiene un prepedido levantado')

        if (!input.items || input.items.length === 0) {
            throw new Error('El pedido debe tener al menos un producto')
        }

        const { url: signatureUrl } = await StorageService.uploadAsset({"""
    new_signature = """    async createPreorder(input: {
        id_task: number
        manager_whatsapp: string
        preferred_date?: Date
        preferred_time?: 'MAÑANA' | 'TARDE'
        signature: { buffer: Buffer; mime: string }
        items: PreorderItemInput[]
    }) {
        const task = await this.getTaskWithPreorderCheck(input.id_task)

        const existing = await prisma.task_preorders.findUnique({ where: { id_task: input.id_task } })
        if (existing) throw new Error('Esta tarea ya tiene un prepedido levantado')

        if (!input.items || input.items.length === 0) {
            throw new Error('El pedido debe tener al menos un producto')
        }

        // "Fecha cerrada": si la tienda de esta tarea esta en una ruta con
        // asignacion automatica activa, la fecha/turno de entrega se
        // calculan solos. Si no tiene ruta asignada, se cae en fecha
        // abierta (se piden fecha/turno a mano, igual que antes).
        let finalDate: Date
        let finalTime: 'MAÑANA' | 'TARDE'

        if (task.request?.preorder_date_mode === 'CERRADA') {
            const schedule = await this.routeScheduleService.findActiveScheduleForStore(task.id_store)
            if (schedule) {
                finalDate = this.routeScheduleService.computeNextDeliveryDate(schedule)
                finalTime = schedule.turno === 'MANANA' ? 'MAÑANA' : 'TARDE'
            } else {
                if (!input.preferred_date || !input.preferred_time) {
                    throw new Error('Esta tienda no tiene ruta asignada; selecciona fecha y turno manualmente')
                }
                finalDate = input.preferred_date
                finalTime = input.preferred_time
            }
        } else {
            if (!input.preferred_date || !input.preferred_time) {
                throw new Error('Debes indicar la fecha y el turno preferidos')
            }
            finalDate = input.preferred_date
            finalTime = input.preferred_time
        }

        const { url: signatureUrl } = await StorageService.uploadAsset({"""
    assert c2.count(old_signature) == 1, "No encontre la firma de createPreorder esperada en preorder.service.ts"
    c2 = c2.replace(old_signature, new_signature)

    old_create_data = """                    preferred_date: input.preferred_date,
                    preferred_time: input.preferred_time,"""
    new_create_data = """                    preferred_date: finalDate,
                    preferred_time: finalTime,"""
    assert c2.count(old_create_data) == 1, "No encontre el data de create esperado en preorder.service.ts"
    c2 = c2.replace(old_create_data, new_create_data)

    escribir(path2, c2)
    print("OK: preorder.service.ts actualizado")
    cambios += 1

# ---------- 3. preorder.controller.ts ----------
path3 = "src/modules/preorder/preorder.controller.ts"
c3 = leer(path3)
if "preferred_date ? new Date" in c3:
    print("YA ESTABA: preorder.controller.ts ya tiene la validacion opcional")
else:
    old3 = """        if (preferred_time !== 'MAÑANA' && preferred_time !== 'TARDE') {
            res.status(400).json({ ok: false, error: 1, data: null, message: 'preferred_time debe ser MAÑANA o TARDE' })
            return
        }

        const parsedItems = typeof items === 'string' ? JSON.parse(items) : items

        const preorder = await preorderService.createPreorder({
            id_task,
            manager_whatsapp,
            preferred_date: new Date(preferred_date),
            preferred_time,
            signature: { buffer: req.file.buffer, mime: req.file.mimetype },
            items: parsedItems,
        })"""
    new3 = """        if (preferred_time && preferred_time !== 'MAÑANA' && preferred_time !== 'TARDE') {
            res.status(400).json({ ok: false, error: 1, data: null, message: 'preferred_time debe ser MAÑANA o TARDE' })
            return
        }

        const parsedItems = typeof items === 'string' ? JSON.parse(items) : items

        const preorder = await preorderService.createPreorder({
            id_task,
            manager_whatsapp,
            preferred_date: preferred_date ? new Date(preferred_date) : undefined,
            preferred_time: preferred_time || undefined,
            signature: { buffer: req.file.buffer, mime: req.file.mimetype },
            items: parsedItems,
        })"""
    assert c3.count(old3) == 1, "No encontre el bloque esperado en preorder.controller.ts"
    c3 = c3.replace(old3, new3)
    escribir(path3, c3)
    print("OK: preorder.controller.ts actualizado")
    cambios += 1

print(f"TOTAL cambios aplicados: {cambios}")

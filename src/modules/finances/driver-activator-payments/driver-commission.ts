import { prisma } from '../../../core/prisma'

export interface DriverEligibleTask {
  id_task: number
  id_promoter: number
  id_driver: number
  f_amount: number
}

export async function getFinanceSettings() {
  const settings = await prisma.finance_settings.findUnique({ where: { id_setting: 1 } })
  if (!settings) throw new Error('finance_settings no está inicializado')
  return settings
}

/**
 * Tareas que le generan comisión a un chofer: las terminadas con éxito (7) de
 * promotores que él invitó y que todavía no entran en ningún pago a choferes.
 * Misma regla que los activadores promotores: el % del activador se aplica
 * sobre lo que YA gana el promotor (valor de la tarea x % promotor x % activador).
 */
export async function findEligibleDriverTasks(
  opts: { dt_start?: Date; dt_end?: Date; id_driver?: number },
  promoterPct: number,
  activatorPct: number
): Promise<DriverEligibleTask[]> {
  const dt_update: { gte?: Date; lte?: Date } = {}
  if (opts.dt_start) dt_update.gte = opts.dt_start
  if (opts.dt_end) dt_update.lte = opts.dt_end

  const tasks = await prisma.tasks.findMany({
    where: {
      id_status: 7,
      id_driver_activator_payment: null,
      id_promoter: { not: null },
      id_request: { not: null },
      ...(opts.dt_start || opts.dt_end ? { dt_update } : {}),
      promoter: {
        id_driver_activator: opts.id_driver !== undefined ? opts.id_driver : { not: null },
      },
    },
    select: {
      id_task: true, id_order: true, id_request: true, id_store: true,
      promoter: { select: { id: true, id_driver_activator: true } },
    },
  })
  if (tasks.length === 0) return []

  const orderIds = [...new Set(tasks.map(t => t.id_order))]
  const orderItems = await prisma.order_items.findMany({
    where: { id_order: { in: orderIds } },
    select: { id_order: true, id_request: true, id_store: true, f_value: true },
  })
  const valueMap = new Map<string, number>()
  for (const oi of orderItems) {
    valueMap.set(`${oi.id_order}:${oi.id_request}:${oi.id_store}`, Number(oi.f_value))
  }

  const eligible: DriverEligibleTask[] = []
  for (const t of tasks) {
    if (!t.promoter?.id_driver_activator) continue
    const baseValue = valueMap.get(`${t.id_order}:${t.id_request}:${t.id_store}`)
    if (baseValue === undefined) continue
    const promoterEarning = baseValue * (promoterPct / 100)
    const f_amount = Math.round(promoterEarning * (activatorPct / 100) * 100) / 100
    eligible.push({
      id_task: t.id_task,
      id_promoter: t.promoter.id,
      id_driver: t.promoter.id_driver_activator,
      f_amount,
    })
  }
  return eligible
}

/**
 * Cuando el panel pide "todo lo pendiente hasta ayer" manda un inicio muy antiguo (2000-01-01).
 * Para que el periodo del corte no diga "desde el ano 2000", se guarda como inicio la fecha de la
 * primera visita que realmente entra en el corte.
 */
export async function effectiveStart(db: any, taskIds: number[], requested: Date): Promise<Date> {
    if (requested.getUTCFullYear() > 2000 || taskIds.length === 0) return requested
    const r = await db.tasks.aggregate({ where: { id_task: { in: taskIds } }, _min: { dt_update: true } })
    return r._min.dt_update ?? requested
}

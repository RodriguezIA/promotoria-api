import { Worker, Job } from 'bullmq'
import { connectionWorker } from './conection'
import { RouteScheduleService } from '../../modules/route-schedules/route-schedules.service'

const routeScheduleService = new RouteScheduleService()

export const routeScheduleWorker = new Worker('route_schedule_queue', async (job: Job) => {
    const { checked, created } = await routeScheduleService.runDailyCheck()
    if (checked === 0) {
        console.log('[RouteSchedule] Sin asignaciones automaticas para el dia de hoy.')
        return
    }
    console.log(`[RouteSchedule] ${checked} asignacion(es) revisada(s) para hoy, ${created} ruta(s) nueva(s) creada(s) automaticamente.`)
}, { connection: connectionWorker })

routeScheduleWorker.on('failed', (job, err) => {
    console.error(`[RouteSchedule] Job ${job?.id} falló:`, err.message)
})

import { Worker, Job } from 'bullmq'
import { connectionWorker } from './conection'
import { Finance } from '../../modules/finance/finance.service'

const finance = new Finance()

/**
 * Worker de facturación semanal: genera los cobros a clientes y los pagos a
 * promotores por las tareas completadas que aún no han sido procesadas, y
 * marca como atrasadas las facturas vencidas. Idempotente.
 */
export const billingWorker = new Worker('billing_queue', async (_job: Job) => {
    console.log('[Billing] Ejecutando ciclo de cobros y pagos...')
    const result = await finance.runBillingCycle()
    console.log('[Billing] Resultado:', result)
    return result
}, { connection: connectionWorker })

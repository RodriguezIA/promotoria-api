import { prisma } from '../../core/prisma'
import { Task } from './tasks.service'
import { CreateTaskDTO } from './tasks.dtos'


export async function createTasksInSystem(id_order: number){
    const taskService = new Task()

    const order = await prisma.orders.findUnique({
        where: { id_order },
        include: {
            order_items: {
                include: {
                    request: {
                        select: { id_request: true, vc_name: true, f_value: true }
                    },
                    store: {
                        select: { id_store: true, name: true }
                    }
                }
            }
        }
    })

    if (!order?.order_items) return

    for (const item of order.order_items) {
        const newTask: CreateTaskDTO = {
            id_client: order.id_client,
            id_order: item.id_order,
            id_store: item.store.id_store,
            id_request: item.request.id_request
        }

        await taskService.create(newTask)
    }
}
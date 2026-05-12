import { prisma } from '../../core/prisma'
import { Task } from './tasks.service'
import { CreateTaskDTO } from './tasks.dtos'
import { orderNotificationsQueue, startTaskNotifWorker } from '../../core/bullmq'


export async function createTasksInSystem(id_order: number){
    try {
        const taskService = new Task()

        const order =  await prisma.orders.findUnique({
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

        if (order?.order_items) {
            for (const item of order.order_items) {
                console.log("tarea a crear en el sistema: ", item);

                const newTask: CreateTaskDTO = {
                    id_client: order.id_client,
                    id_order: item.id_order,
                    id_store: item.store.id_store,
                    id_request: item.request.id_request
                }

                const task = await taskService.create(newTask)
                console.log("tarea creada en el sistema: ", task);
            }
        }

        startTaskNotifWorker(id_order, 1);
        await orderNotificationsQueue.add(
            `order_${id_order}_ciclo_1`,
            { id_order, ciclo: 1 },
            { jobId: `order_${id_order}_ciclo_1` }
        );

    } catch (error) {
        return error
    }
}
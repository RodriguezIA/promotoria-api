import { prisma } from '../../core/prisma'

export class Task {

    async create(data: any){
        return await prisma.$transaction((prisma) => {
            const task = prisma.tasks.create({
                data: {
                    id_client: data.id_client,
                    id_order: data.id_order,
                    id_store: data.id_store,
                    id_request: data.id_request,
                }
            });

            return task;
        }); 
    }

}
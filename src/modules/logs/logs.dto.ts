import { prisma } from "../../core/prisma"

export class LogsDTO {

    
    // id_user es la persona que creo el log
    async createUserLog(log: string, id_user: number) {
        try {
            return await prisma.user_logs.create({
                data: {
                    log,
                    id_user
                }
            });
        } catch (error) {
            throw error;
        }
    }
}
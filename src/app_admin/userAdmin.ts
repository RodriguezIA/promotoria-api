import { User } from "../app_superadmin/user";
import { prisma } from '../core/prisma';

export class UserAdmin extends User {

    async getAllUsersByClientId(id_client: number) {
        try {
            return await prisma.users.findMany({
                where: {
                    id_client: id_client,
                    i_status: 1
                }
            });
        } catch (error) {
            throw error;
        }
    }

}

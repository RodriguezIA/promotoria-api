import { User } from "../../app_superadmin/user"
import { prisma } from "../../core/prisma" 

export class UserAdminDTO extends User {

    async createUser(userData: { email: string, name: string, lastname: string, password: string, i_rol: number, i_status: number, id_client: number, id_user_creator: number }) {
        try {
            return await prisma.users.create({
                data: {
                    email: userData.email,
                    name: userData.name,
                    lastname: userData.lastname,
                    password: userData.password,
                    i_rol: userData.i_rol,
                    i_status: userData.i_status,
                    id_client: userData.id_client,
                    id_user_creator: userData.id_user_creator,
                }
            })
        } catch (error) {
            throw error;
        }
    }

    async getUserByEmailByClientId(id_client: number, email: string) {
        try {
            return await prisma.users.findUnique({
                where: {
                    email: email,
                    id_client: id_client
                }
            });
        } catch (error) {
            throw error;
        }
    }

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
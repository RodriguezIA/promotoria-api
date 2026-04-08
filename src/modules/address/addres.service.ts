import { prisma } from '../../core/prisma'

export class Address {

    async getAddressByClientId(id_client: number) {
        try {
            return await prisma.addresses.findMany({
                where: {
                },
            });
        } catch (error) {
            throw error;
        }
    }

}
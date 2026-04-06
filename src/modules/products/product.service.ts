import { prisma } from '../../core/prisma';

export class Product {


 async getProductsByClientId(id_client: number) {
  try {
   return await prisma.products.findMany({
    where: {
        id_client: id_client,
        i_status: 1
    },
   });
  } catch (error) {
   throw error;
  }
 }

}
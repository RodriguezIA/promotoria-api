import { prisma } from '../../core/prisma';
import { createProductPayload } from './product.dto';

export class Product {

    async createProduct(newProductPayload: createProductPayload){
        return await prisma.$transaction(async (prisma) => {
            const product = await prisma.products.create({
                data: {
                    id_user: newProductPayload.id_user,
                    id_client: newProductPayload.id_client,
                    name: newProductPayload.name,
                    description: newProductPayload.description || '',
                    vc_image: newProductPayload.vc_image || '',
                }
            })

            await prisma.product_logs.create({
                data: {
                    id_product: product.id_product,
                    id_usuario: newProductPayload.id_user,
                    id_negocio: newProductPayload.id_client,
                    id_pais: 1,
                    vc_log: `Producto creado: ${product.name}`,
                }
            })

            return product;
        });
    }

    async getProductsByClientId(id_client: number) {
        return await prisma.products.findMany({
            where: {
                id_client: id_client,
                i_status: 1
            },
        });
    }

    async getProductById(id_product: number){
        return await prisma.products.findUnique({
            where: {
                id_product: id_product
            }
        })
    }

    async updateProductImage(id_product: number, image_url: string) {
        return await prisma.products.update({
            data: {
                vc_image: image_url
            },
            where: { id_product }
        })
    }

    async updateProduct(id_product: number, id_client: number, newProductPayload: createProductPayload){
        return await prisma.$transaction(async (prisma) => {
            const product = await prisma.products.update({
                data: {
                    name: newProductPayload.name,
                    description: newProductPayload.description || '',
                },
                where: {
                    id_product: id_product
                }
            });
            
            await prisma.product_logs.create({
                data: {
                    id_product: product.id_product,
                    id_usuario: newProductPayload.id_user,
                    id_negocio: id_client,
                    id_pais: 1,
                    vc_log: `Producto actualizado: ${product.name}`, 
                }
            })

            return product;
        });
    }

    async deleteProduct(id_product: number){
        return await prisma.products.update({
            data: {
                i_status: 0
            },
            where: { id_product }
        })
    }

}
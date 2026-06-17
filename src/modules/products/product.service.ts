import { prisma } from '../../core/prisma';
import { createProductPayload } from './product.dto';
import { generateFolio } from '../../services/folio.service';

export class Product {

    async createProduct(newProductPayload: createProductPayload){
        return await prisma.$transaction(async (prisma) => {
            const vc_folio = await generateFolio(prisma, newProductPayload.id_client, 'products');

            const product = await prisma.products.create({
                data: {
                    id_user: newProductPayload.id_user,
                    id_client: newProductPayload.id_client,
                    vc_folio,
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

    async getProductsPaginated(
        id_client: number,
        opts: { page?: number; limit?: number; search?: string }
    ) {
        const page = opts.page && opts.page > 0 ? opts.page : 1;
        const limit = opts.limit && opts.limit > 0 ? opts.limit : 12;
        const skip = (page - 1) * limit;

        const where: any = {
            id_client,
            i_status: 1,
        };

        // MySQL compara case-insensitive por la collation (_ci), no se usa `mode`.
        const search = opts.search?.trim();
        if (search) {
            where.name = { contains: search };
        }

        const [products, total] = await Promise.all([
            prisma.products.findMany({
                where,
                skip,
                take: limit,
                orderBy: { name: 'asc' },
            }),
            prisma.products.count({ where }),
        ]);

        return {
            data: products,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
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
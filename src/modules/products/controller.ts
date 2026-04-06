import { Request, Response, Router } from 'express'
import { Product } from "./product.service"

const productService = new Product();

export const getProductsByClientId = async (req: Request, res: Response) => {
    const { id_client } = req.params;

    try {
        const products = await productService.getProductsByClientId(Number(id_client));
        res.json({
            ok: true,
            error: 0,
            data: products,
            message: 'Productos obtenidos exitosamente'
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            ok: false,
            error: 1,
            data: null,
            message: 'Error al obtener los productos'
        });
    }
}
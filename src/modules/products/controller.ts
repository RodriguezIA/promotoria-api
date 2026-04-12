import { Request, Response } from 'express'


import { Product } from "./product.service"
import { createProductPayload } from './product.dto'
import { UploadService } from '../../services/upload.service'


const productService = new Product();


export const createProduct = async (req: Request, res: Response) => {
    const body: createProductPayload = req.body;

    try {
        const product = await productService.createProduct(body);
        res.json({
            ok: true,
            error: 0,
            data: product,
            message: 'Producto creado exitosamente'
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            ok: false,
            error: 1,
            data: null,
            message: 'Error al crear el producto'
        });
    }
}

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

export const getProductById = async (req: Request, res: Response) => {
    const { id_product } = req.params;
    try {
        const product = await productService.getProductById(Number(id_product));
        res.json({
            ok: true,
            error: 0,
            data: product,
            message: 'Producto obtenido exitosamente'
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            ok: false,
            error: 1,
            data: null,
            message: 'Error al obtener el producto'
        });
    }
}

export const updateProduct = async (req: Request, res: Response) => {
    const { id_product } = req.params;
    const body: createProductPayload = req.body;
    try {

        const productDb = await productService.getProductById(Number(id_product));

        console.log(" proccuto: ", productDb)

        const product = await productService.updateProduct(productDb?.id_product || 0, productDb?.id_client || 0, body);
        res.json({
            ok: true,
            error: 0,
            data: product,
            message: 'Producto actualizado exitosamente'
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            ok: false,
            error: 1,
            data: null,
            message: 'Error al actualizar el producto'
        });
    }
}

export const updateProductImage = async (req: Request, res: Response) => {
    const { id_product, id_client } = req.params;

    if (!req.file) {
        res.status(400).json({ ok: false, error: 1, data: null, message: 'No se recibió archivo' });
        return;
    }

    try {
        const url = await UploadService.uploadProductImage(Number(id_client), Number(id_product), req.file.buffer);

        const product = await productService.updateProductImage(Number(id_product), url);

        res.json({
            ok: true,
            error: 0,
            data: product,
            message: 'Imagen del producto actualizada exitosamente  '
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            ok: false,
            error: 1,
            data: null,
            message: 'Error al actualizar la imagen del producto'
        });
    }
}

export const deleteProduct = async (req: Request, res: Response) => {
    const { id_product } = req.params;
    try {
        const product = await productService.deleteProduct(Number(id_product));
        res.json({
            ok: true,
            error: 0,
            data: product,
            message: 'Producto eliminado exitosamente'
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            ok: false,
            error: 1,
            data: null,
            message: 'Error al eliminar el producto'
        });
    }
}
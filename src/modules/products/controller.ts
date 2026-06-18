import { Request, Response } from 'express'


import { Product } from "./product.service"
import { createProductPayload } from './product.dto'
import { StorageService } from '../../services/storage.service'


const productService = new Product();

function parseNumber(value: any): number | undefined {
    if (value === undefined || value === null || value === '') return undefined;
    const num = Number(value);
    return isNaN(num) ? undefined : num;
}

// Crea el producto y (si viene archivo) sube su imagen en el MISMO request multipart.
export const createProduct = async (req: Request, res: Response) => {
    const body = req.body;

    const id_user = parseNumber(body.id_user);
    const id_client = parseNumber(body.id_client);
    const name = typeof body.name === 'string' ? body.name.trim() : '';

    if (!name || !id_user || !id_client) {
        res.status(400).json({
            ok: false,
            error: 1,
            data: null,
            message: 'name, id_user e id_client son requeridos'
        });
        return;
    }

    try {
        const payload: createProductPayload = {
            id_user,
            id_client,
            name,
            description: body.description,
        };

        const product = await productService.createProduct(payload);

        if (req.file && product.id_product) {
            const { url } = await StorageService.uploadAsset({
                entity: 'product',
                entity_id: product.id_product,
                buffer: req.file.buffer,
                mime: req.file.mimetype,
                id_client: payload.id_client,
                id_user: payload.id_user,
                optimize: { maxW: 800, maxH: 800, quality: 80 },
            });
            await productService.updateProductImage(product.id_product, url);
            product.vc_image = url;
        }

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

export const getProductsPaginated = async (req: Request, res: Response) => {
    const { id_client } = req.params;

    const parseNumber = (value: any): number | undefined => {
        if (value === undefined || value === null || value === '') return undefined;
        const num = Number(value);
        return isNaN(num) ? undefined : num;
    };

    try {
        const result = await productService.getProductsPaginated(Number(id_client), {
            page: parseNumber(req.query.page),
            limit: parseNumber(req.query.limit),
            search: typeof req.query.search === 'string' ? req.query.search : undefined,
        });

        res.json({
            ok: true,
            error: 0,
            data: result,
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
        const { url } = await StorageService.uploadAsset({
            entity: 'product',
            entity_id: Number(id_product),
            buffer: req.file.buffer,
            mime: req.file.mimetype,
            id_client: Number(id_client),
            optimize: { maxW: 800, maxH: 800, quality: 80 },
        });

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
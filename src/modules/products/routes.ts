import { Router } from 'express'
import { createProduct, getProductsByClientId, getProductById, updateProduct, updateProductImage, deleteProduct } from './controller'
import { authMiddleware } from "../../core/middleware/auth.middleware"
import { uploadAny } from "../../core/middleware/upload.middleware"


const productRouter = Router()


productRouter.post('/', authMiddleware, createProduct);
productRouter.get('/product/:id_product', authMiddleware, getProductById);
productRouter.get('/:id_client', authMiddleware, getProductsByClientId);
productRouter.post('/upload-image/:id_client/:id_product', authMiddleware, uploadAny.single('file'), updateProductImage);
productRouter.put('/:id_product', authMiddleware, updateProduct);
productRouter.delete('/:id_product', authMiddleware, deleteProduct);


export default productRouter
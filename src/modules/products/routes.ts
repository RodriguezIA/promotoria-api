import { Router } from 'express'
import { createProduct, getProductsByClientId, getProductsPaginated, getProductById, updateProduct, updateProductImage, deleteProduct } from './controller'
import { authMiddleware, validateBody } from "../../core/middleware"
import { uploadAny } from "../../core/middleware/upload.middleware"
import { createProductSchema, updateProductSchema } from './product.schema'

const productRouter = Router()

productRouter.post('/', authMiddleware, validateBody(createProductSchema), createProduct);
productRouter.get('/product/:id_product', authMiddleware, getProductById);
productRouter.get('/paginated/:id_client', authMiddleware, getProductsPaginated);
productRouter.get('/:id_client', authMiddleware, getProductsByClientId);
productRouter.post('/upload-image/:id_client/:id_product', authMiddleware, uploadAny.single('file'), updateProductImage);
productRouter.put('/:id_product', authMiddleware, validateBody(updateProductSchema), updateProduct);
productRouter.delete('/:id_product', authMiddleware, deleteProduct);

export default productRouter
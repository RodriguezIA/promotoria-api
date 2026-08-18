import { Router } from 'express'

import { authMiddleware, validateBody, validateParams } from '../../core/middleware'
import { setStockMinimum, getStockMinimumsByStore, getStockMapData } from './stock.controller'
import { setStockMinimumSchema, storeIdParamSchema } from './stock.schema'

const stockRouter = Router()

// Datos para el mapa: tiendas con ubicacion, canal/logo, semaforo de
// inventario, y promotores activos. Filtrable por ?id_channel=&id_state=&id_municipio=
stockRouter.get('/map', authMiddleware, getStockMapData)

// Minimos de piezas por tienda (el cliente los define; es por tienda, no
// un minimo general del producto, porque cada tienda se comporta distinto).
stockRouter.put('/minimums', authMiddleware, validateBody(setStockMinimumSchema), setStockMinimum)
stockRouter.get('/minimums/:id_store', authMiddleware, validateParams(storeIdParamSchema), getStockMinimumsByStore)

export default stockRouter

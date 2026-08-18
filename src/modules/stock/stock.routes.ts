import { Router } from 'express'

import { authMiddleware, validateBody, validateParams } from '../../core/middleware'
import { setStockMinimum, getStockMinimumsByStore, getStockMapData, bulkAssignStockMinimum, countStockMatchingStores } from './stock.controller'
import { setStockMinimumSchema, storeIdParamSchema, bulkAssignStockMinimumSchema } from './stock.schema'

const stockRouter = Router()

// Datos para el mapa: tiendas con ubicacion, canal/logo, semaforo de
// inventario, y promotores activos. Filtrable por ?id_channel=&id_state=&id_municipio=
stockRouter.get('/map', authMiddleware, getStockMapData)

// Minimos de piezas por tienda (el cliente los define; es por tienda, no
// un minimo general del producto, porque cada tienda se comporta distinto).
stockRouter.put('/minimums', authMiddleware, validateBody(setStockMinimumSchema), setStockMinimum)
stockRouter.get('/minimums/:id_store', authMiddleware, validateParams(storeIdParamSchema), getStockMinimumsByStore)

// Asignacion masiva: mismo minimo a varios productos, en todas las tiendas
// que cumplan un filtro de cadena/estado/municipios (sin tener que entrar
// tienda por tienda desde el mapa).
stockRouter.get('/minimums/matching-stores/count', authMiddleware, countStockMatchingStores)
stockRouter.post('/minimums/bulk-assign', authMiddleware, validateBody(bulkAssignStockMinimumSchema), bulkAssignStockMinimum)

export default stockRouter

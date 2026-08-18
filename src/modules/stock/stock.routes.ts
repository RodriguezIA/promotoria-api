import { Router } from 'express'

import { authMiddleware, validateBody, validateParams } from '../../core/middleware'
import { setStockMinimum, getStockMinimumsByStore, getStockMapData, bulkAssignStockMinimum, countStockMatchingStores, getStockMatchingStores } from './stock.controller'
import { setStockMinimumSchema, storeIdParamSchema, bulkAssignStockMinimumSchema } from './stock.schema'

const stockRouter = Router()

// Datos para el mapa: tiendas con ubicacion, canal/logo, semaforo de
// inventario, y promotores activos. Filtrable por ?id_channel=&id_state=&id_municipio=
stockRouter.get('/map', authMiddleware, getStockMapData)

// Minimos de piezas por tienda (el cliente los define; es por tienda, no
// un minimo general del producto, porque cada tienda se comporta distinto).
stockRouter.put('/minimums', authMiddleware, validateBody(setStockMinimumSchema), setStockMinimum)

// Asignacion masiva: mismo minimo a varios productos, en todas las tiendas
// que cumplan un filtro de cadena/estado/municipios (sin tener que entrar
// tienda por tienda desde el mapa). Estas rutas van ANTES de
// '/minimums/:id_store' a proposito: si no, Express hace match de
// "matching-stores" como si fuera un id_store (por ser el mismo patron de
// ruta /minimums/:algo) y nunca llega aqui.
stockRouter.get('/minimums/matching-stores/count', authMiddleware, countStockMatchingStores)
stockRouter.get('/minimums/matching-stores', authMiddleware, getStockMatchingStores)
stockRouter.post('/minimums/bulk-assign', authMiddleware, validateBody(bulkAssignStockMinimumSchema), bulkAssignStockMinimum)

stockRouter.get('/minimums/:id_store', authMiddleware, validateParams(storeIdParamSchema), getStockMinimumsByStore)

export default stockRouter

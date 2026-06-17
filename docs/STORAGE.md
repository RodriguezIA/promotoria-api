# Almacenamiento de recursos (assets)

Sistema único para subir imágenes/documentos al bucket de GCS, **no-destructivo**
y segmentado por entidad. Fuente de verdad en código:
[`src/services/storage.service.ts`](../src/services/storage.service.ts).

## Principios

1. **Todo se sube como `multipart/form-data`** (back y front). El front usa
   `api.upload(endpoint, formData)`; el back recibe el archivo con `multer`
   (`req.file` / `req.files`).
2. **Nunca se sobreescribe ni se borra.** Cada subida genera una key **única**
   (incluye `timestamp` + random), así que jamás colisiona con un archivo previo.
   No existe ninguna operación `delete` sobre el bucket.
3. **Historial en la tabla `assets`.** Cada archivo subido inserta un row. La
   versión vigente de una entidad es `is_active = true`; al subir una nueva, las
   anteriores pasan a `is_active = false` (siguen en el bucket y en la tabla).
4. La columna de URL de cada entidad (`products.vc_image`,
   `requests.url_rack_image`, `sales_channels.url_image`,
   `task_answers.vc_image_url`, `clients.vc_url_situacion_fiscal`) se actualiza a
   la URL nueva para lecturas rápidas; el detalle/historial vive en `assets`.

## Convención de paths en el bucket

```
clients/{id_client}/{entidad}/{entity_id}/{[folio_][extraRef_][nombreDoc_]}{timestamp}-{rand}.{ext}
```

- Si la entidad no tiene `id_client` (p. ej. `task_answer`), se omite el prefijo
  `clients/{id_client}` y queda `{entidad}/{entity_id}/...`.
- `folio` se incluye en el nombre **cuando la entidad lo tiene** (hoy ninguna
  entidad de imagen guarda folio en su row; el parámetro queda listo para cuando
  aplique, p. ej. assets de orders/services vía `Utils.getCurrentFolio`).
- Las imágenes se optimizan a `.webp` con `sharp`; los documentos
  (`optimize: false`) conservan su extensión original.

Segmentos por entidad (`entity_type` → carpeta):

| entity_type    | carpeta         | optimiza | ejemplo de path |
| -------------- | --------------- | -------- | --------------- |
| `product`      | `products`      | sí (800) | `clients/2/products/77/1718580000000-a1b2c3.webp` |
| `request`      | `requests`      | sí (1200)| `clients/2/requests/14/1718580000000-a1b2c3.webp` |
| `sale_channel` | `sale_channels` | sí (1200)| `sale_channels/5/1718580000000-a1b2c3.webp` |
| `task_answer`  | `task_answers`  | sí (1200)| `task_answers/30/991_1718580000000-a1b2c3.webp` (extraRef = id_rpq) |
| `client_doc`   | `docs`          | no       | `clients/2/docs/2/situacion-fiscal_1718580000000-a1b2c3.pdf` |

## Tabla `assets`

Modelo Prisma en `prisma/schema.prisma` (creada con SQL crudo — ver más abajo).

| columna       | tipo            | notas |
| ------------- | --------------- | ----- |
| `id_asset`    | INT UNSIGNED PK | autoincrement |
| `id_client`   | INT UNSIGNED ?  | NULL si no aplica (task_answer) |
| `entity_type` | VARCHAR(50)     | `product`/`request`/`sale_channel`/`task_answer`/`client_doc` |
| `entity_id`   | INT UNSIGNED    | id de la entidad (id_product, id_request, ...) |
| `vc_folio`    | VARCHAR(50) ?   | folio de negocio si aplica |
| `bucket_path` | VARCHAR(500)    | key dentro del bucket |
| `vc_url`      | VARCHAR(500)    | URL pública |
| `vc_mime`     | VARCHAR(100) ?  | content-type guardado |
| `i_size`      | INT ?           | bytes del archivo final |
| `id_user`     | INT UNSIGNED ?  | quién lo subió |
| `is_active`   | TINYINT(1)      | versión vigente (1) / histórica (0) |
| `created_at`  | TIMESTAMP       | default now |

Índice: `idx_assets_entity (id_client, entity_type, entity_id, is_active)`.

### Crear la tabla

El workflow del repo es `db pull`/`push` (no hay `prisma/migrations`; tablas como
`folios` viven como SQL crudo). Para crear `assets`:

```bash
# 1) Crear la tabla en la BD (idempotente)
npx tsx scripts/create_assets_table.ts
# 2) El modelo ya está en schema.prisma; regenerar el client si hace falta
npx prisma generate
```

(`scripts/create_assets_table.ts` contiene el `CREATE TABLE IF NOT EXISTS`.)

## Uso desde un controller

```ts
import { StorageService } from '../../services/storage.service'

const { url, path, id_asset } = await StorageService.uploadAsset({
  entity: 'product',
  entity_id: product.id_product,
  buffer: req.file.buffer,
  mime: req.file.mimetype,
  id_client: payload.id_client,
  id_user: payload.id_user,
  optimize: { maxW: 800, maxH: 800, quality: 80 }, // o false para documentos
  // folio, originalName, extraRef son opcionales
})
// luego guardar `url` en la columna de la entidad
```

## Cómo agregar una nueva `entity_type`

1. Agregar el valor al union `AssetEntity` y a `ENTITY_SEGMENT` en
   `storage.service.ts`.
2. En el controller correspondiente, recibir el archivo con `multer`
   (`upload.single('file')` o `uploadAny`) y llamar `StorageService.uploadAsset`.
3. Guardar `url` en la columna de URL de esa entidad.

## Contrato FormData por endpoint

| Endpoint | Campos FormData |
| -------- | --------------- |
| `POST /products` | `id_user`, `id_client`, `name`, `description?`, `file?` (imagen) |
| `POST /products/upload-image/:id_client/:id_product` | `file` |
| `POST /requests` / `PUT /requests/:id` | `id_user`, `id_client`, `vc_name`, `f_value`, `products` (JSON string), `rackImage?` |
| `POST /channels-sales` / `PUT /channels-sales/:id` | `name`, `description`, `file?` |
| `POST /clients/:id_client/docs` | `file` |
| `POST /tasks/:id_task/answers` | `answers` (JSON string), `image_{id_rpq}` (uno por respuesta con foto) |

## Legacy

`src/services/upload.service.ts` se mantiene **solo** porque `src/app_superadmin`
aún lo referencia. El código nuevo debe usar `StorageService`.

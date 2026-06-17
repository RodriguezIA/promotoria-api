# Documentación de la API (Swagger / OpenAPI)

La API se documenta con **`swagger-jsdoc`** (lee bloques JSDoc `@openapi` en los
archivos de rutas) y se sirve con **`swagger-ui-express`**.

Config central: [`src/config/swagger.ts`](../src/config/swagger.ts). Se monta en
[`src/index.ts`](../src/index.ts) con `setupSwagger(app)` (antes de `helmet` para
que la UI no la bloquee el CSP).

## Cómo verla

```bash
nvm use 24
pnpm dev
```

- **UI:**  http://localhost:3000/retailink-api/docs
- **JSON:** http://localhost:3000/retailink-api/docs.json

Para probar endpoints protegidos: clic en **Authorize** (arriba a la derecha) y
pega el token JWT (sin `Bearer `, swagger lo agrega). Todos los endpoints
requieren Bearer por defecto.

## Cómo documentar un endpoint nuevo

Pon un bloque `@openapi` **arriba** de la ruta, en su archivo de rutas
(`src/modules/<modulo>/...routes.ts`). Las paths se escriben **relativas** al
base `/retailink-api` (p. ej. `/products`). Ejemplo mínimo:

```ts
/**
 * @openapi
 * /clients/{id_client}:
 *   get:
 *     tags: [Clients]
 *     summary: Obtener un cliente
 *     parameters:
 *       - in: path
 *         name: id_client
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Cliente encontrado.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ApiResponse' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
clientRouter.get('/:id_client', authMiddleware, getClient);
```

Todos los módulos de `src/modules` están documentados (≈60 operaciones):
Users, Clients, Products, Stores, Sales Channels, Promoters, Questions,
Requests, Orders y Tasks. El módulo **products** (`src/modules/products/routes.ts`)
sirve de referencia más detallada: GET/POST/PUT/DELETE, params de path y query,
multipart (subida de imagen) y respuestas con `$ref`.

> Solo se documentan los módulos de `src/modules`. Las apps `app_superadmin`,
> `app_admin` y `app_mobile` se dejaron **fuera** a propósito.

### Piezas reutilizables (en `src/config/swagger.ts`)

- `components.securitySchemes.bearerAuth` — auth JWT (ya global por defecto).
- `components.schemas.ApiResponse` — envoltorio `{ ok, error, data, message }`.
- `components.schemas.Pagination` — `{ total, page, limit, totalPages }`.
- `components.schemas.Product` — ejemplo de schema de entidad.
- `components.responses.Unauthorized` / `ServerError` — respuestas comunes.

Para un endpoint **público** (sin token), agrega `security: []` en ese endpoint.

### Agregar un schema de entidad

Define el schema una vez en `components.schemas` de `src/config/swagger.ts` y
referencíalo con `$ref: '#/components/schemas/MiEntidad'` desde los endpoints.
Agrega también su `tag` en el arreglo `tags` para agrupar en la UI.

## Mantenimiento

Al agregar una ruta nueva en cualquier módulo de `src/modules`, pon su bloque
`@openapi` arriba (mismo patrón) y listo: la config central no se toca. Para
verificar que el spec compila sin levantar el server completo:

```bash
# imprime cantidad de paths/operaciones del spec generado
node ./node_modules/tsx/dist/cli.mjs -e "import('./src/config/swagger.ts').then(m => console.log(Object.keys((m.swaggerSpec as any).paths).length, 'paths'))"
```

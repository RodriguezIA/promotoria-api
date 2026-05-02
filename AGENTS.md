# Guía para Agentes de Código — RetaiLink API

Este documento describe las convenciones, patrones y reglas para trabajar en el codebase de RetaiLink API. Léelo antes de crear o modificar archivos.

## 1. Contexto y arquitectura

Estamos migrando de una arquitectura monolítica por rol (`app_superadmin/`, `app_admin/`, `app_mobile/`) a una **arquitectura modular por dominio de negocio** bajo `src/modules/`.

- **Legacy:** clases grandes que mezclan rutas, lógica de negocio y acceso a datos.
- **Objetivo:** cada dominio (stores, clients, products, etc.) es un módulo autocontenido con responsabilidades separadas.

## 2. Estructura de un módulo (patrón obligatorio)

Todo nuevo módulo debe vivir en `src/modules/<dominio>/` y contener exactamente estos archivos:

```
src/modules/<dominio>/
├── <dominio>.routes.ts      # Router de Express. Solo define rutas y middlewares.
├── <dominio>.controller.ts  # Maneja req/res. No lógica de negocio compleja.
├── <dominio>.service.ts     # Clase que orquesta lógica y acceso a datos vía Prisma.
└── <dominio>.dto.ts         # Tipos/Interfaces de entrada/salida.
```

Ejemplo real: `src/modules/stores/`.

### 2.1. Responsabilidades por capa

| Capa | Qué hace | Qué NO hace |
|------|----------|-------------|
| **Routes** | Define métodos HTTP, paths, parámetros y aplica middlewares (`authMiddleware`). | No contiene lógica. No llama a Prisma. |
| **Controller** | Extrae datos de `req`, llama al Service, y devuelve `res.json()`. Maneja try/catch básico. | No contiene lógica de negocio ni queries a BD. |
| **Service** | Contiene toda la lógica de negocio y las transacciones de Prisma. | No recibe `req` ni `res`. No formatea respuestas HTTP. |
| **DTO** | Define contratos de datos (tipos TypeScript). | No tiene comportamiento. |

### 2.2. Ejemplo de flujo

```typescript
// stores.routes.ts
storeRouter.post('/', authMiddleware, createStore);

// stores.controller.ts
export const createStore = async (req: Request, res: Response) => {
    const body: CreateStoreDTO = req.body;
    try {
        const store = await storeService.createStore(body);
        res.status(200).json({ ok: true, error: 0, data: store, message: '...' });
    } catch(error) {
        res.status(500).json({ ok: false, error: 1, data: null, message: '...', error_backend: error });
    }
};

// stores.service.ts
export class Store {
    async createStore(payload: CreateStoreDTO) {
        return await prisma.$transaction(async () => {
            // ... lógica y queries Prisma
        });
    }
}
```

## 3. Convenciones de código

### 3.1. Nomenclatura de archivos

- **Kebab-case** para nombres de archivo: `store.routes.ts`, `question-admin.service.ts`.
- El nombre del dominio en singular: `store`, `client`, `product`.
- Sufijos obligatorios: `.routes.ts`, `.controller.ts`, `.service.ts`, `.dto.ts`.

### 3.2. Nomenclatura de clases y funciones

- **Clases de servicio:** nombre del dominio en singular, capitalizado. Ej: `Store`, `Client`, `ProductService` (si hay ambigüedad).
- **Funciones de controller:** verbo + dominio. Ej: `createStore`, `getStoreById`, `updateClient`.
- **DTOs:** interfaz con sufijo `DTO`. Ej: `CreateStoreDTO`, `UpdateUserDTO`.

### 3.3. Formato de respuesta JSON (estándar)

Todas las respuestas deben seguir este contrato:

**Éxito (2xx):**
```json
{
  "ok": true,
  "error": 0,
  "data": { ... },
  "message": "Descripción corta en español"
}
```

**Error (4xx / 5xx):**
```json
{
  "ok": false,
  "error": 1,
  "data": null,
  "message": "Descripción legible para el frontend",
  "error_backend": "..."
}
```

- `error_backend` puede contener el error original en desarrollo, pero debe evitarse exponer stacks en producción.
- Los mensajes deben estar en **español** para mantener consistencia con el frontend actual.

## 4. Reglas de acceso a datos

### 4.1. Prisma es la capa de acceso por defecto

- Todo nuevo módulo debe usar `prisma` importado desde `src/core/prisma.ts`.
- Usa transacciones (`prisma.$transaction`) cuando una operación modifique más de una tabla.
- Usa `include` y `select` de Prisma en lugar de joins manuales siempre que sea posible.

### 4.2. Prohibido en nuevos módulos

- **No usar** `src/config/database.ts` (mysql2 crudo) en módulos nuevos.
- **No escribir** SQL strings a mano (`db.select(...)`, `db.execute(...)`).
- **No usar** la clase `Database` de `src/core/database.ts` en nuevos features.

> **Excepción:** los archivos legacy en `app_mobile/`, `app_admin/` y `app_superadmin/` aún usan mysql2. No los reescribas completos a menos que sea parte de una tarea de migración planificada.

### 4.3. Soft deletes

La convención de la base de datos es el **borrado lógico** (`i_status = 0` o `is_active = false`).

- Nunca uses `.delete()` de Prisma sobre registros de negocio.
- Usa `.update({ where: { id }, data: { i_status: 0 } })`.
- Si el modelo usa `is_active`, actualiza ese campo a `false`.

## 5. Autenticación y autorización

- Usa `authMiddleware` en todas las rutas que modifiquen datos o expongan información sensible.
- Aplica `authMiddleware` a nivel de ruta en el router, no dentro del controller.
- El token JWT se envía en el header: `Authorization: Bearer <token>`.
- El payload del token está tipado en `src/core/utils.ts` (`TokenPayload`) y se accede vía `req.user`.

## 6. Migración legacy → modular

Estamos en transición. Sigue estas reglas para no romper lo existente:

1. **No modifiques** la lógica interna de `app_superadmin/`, `app_admin/` o `app_mobile/` a menos que sea un bug crítico o estés migrando ese dominio explícitamente.
2. **Si un endpoint legacy necesita un fix pequeño**, haz el mínimo cambio posible y documenta con un comentario `// TODO: migrar a modules/`.
3. **Si creas un nuevo dominio** (ej. "invoices", "payments"), va directamente a `src/modules/` siguiendo el patrón completo.
4. **Si migras un dominio existente**, mantén la URL del endpoint idéntica (o crea un redirect) para no romper el frontend.

## 7. Middlewares transversales

| Middleware | Uso |
|------------|-----|
| `authMiddleware` | Proteger rutas con JWT. |
| `roleMiddleware` | Verificar roles (usar con cuidado, aún no está extendido en todos los módulos). |
| `upload.single('image')` | Recibir archivos en memoria (usado para imágenes de productos y Excel). |
| `errorHandler` | Captura de errores global (actualmente en `core/middleware/error.middleware.ts` pero **no está registrado en `index.ts`**; esto es una deuda técnica conocida). |

## 8. Checklist antes de entregar código

- [ ] El nuevo código sigue la estructura `routes → controller → service → dto`.
- [ ] No hay SQL crudo ni uso de `mysql2` en módulos nuevos.
- [ ] Las rutas sensibles tienen `authMiddleware`.
- [ ] El formato de respuesta JSON sigue el estándar `{ ok, error, data, message }`.
- [ ] Se usan transacciones de Prisma para operaciones multi-tabla.
- [ ] Los deletes son soft deletes (`i_status = 0` / `is_active = false`).
- [ ] No hay `console.log` de debugging sueltos (usa el logger del proyecto si es necesario).
- [ ] Los tipos están definidos en el DTO correspondiente.

## 9. Notas sobre Prisma

- El schema está en `prisma/schema.prisma`.
- El cliente generado va a `src/generated/prisma/`.
- Si agregas un campo a la base de datos, **debe reflejarse en `schema.prisma`**.
- Si el campo existe en la BD pero no en Prisma, usa `$executeRaw` o `$queryRaw` solo como parche temporal, y crea una tarea para actualizar el schema.

## 10. Contacto y contexto del negocio

- **SuperAdmin:** gestiona el catálogo global (preguntas, tiendas, clientes).
- **Admin (por cliente):** gestiona cotizaciones, órdenes de servicio, tickets, promotores y establecimientos de su cliente.
- **Mobile (promotor):** recibe tareas, llena checklists con fotos, actualiza su ubicación GPS y cambia estados de tarea.

Cualquier duda sobre flujo de negocio, revisar `API_DOCS.md`.

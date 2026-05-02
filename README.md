# RetaiLink API

Backend API para la plataforma RetaiLink, un sistema de gestión de promotores de retail, clientes, tiendas, cotizaciones, órdenes de servicio y operación móvil.

## Stack Tecnológico

- **Runtime:** Node.js (ES Modules)
- **Framework:** Express 5 + TypeScript
- **ORM:** Prisma 7 (con adapter MariaDB)
- **Base de datos:** MySQL / MariaDB
- **Colas / Cache:** Redis + BullMQ
- **Notificaciones push:** Firebase Admin SDK
- **Almacenamiento de archivos:** Google Cloud Storage
- **Testing:** Jest + ts-jest
- **Procesos en segundo plano:** node-cron + BullMQ workers

## Requisitos previos

- Node.js >= 20
- MySQL o MariaDB >= 10.6
- Redis >= 6
- Cuenta de Firebase con archivo de credenciales
- Bucket de Google Cloud Storage (para imágenes de productos)

## Instalación

```bash
# 1. Clonar e instalar dependencias
npm install

# 2. Configurar variables de entorno
# Copiar .env.example a .env y completar los valores

# 3. Generar cliente de Prisma
npm run postinstall
# o
npx prisma generate

# 4. Ejecutar migraciones (si aplica)
npx prisma migrate dev

# 5. Iniciar en modo desarrollo
npm run dev
```

## Scripts disponibles

| Script | Descripción |
|--------|-------------|
| `npm run dev` | Servidor con hot-reload (nodemon + tsx) |
| `npm run build` | Compila TypeScript a `dist/` |
| `npm start` | Ejecuta la versión compilada |
| `npm run prod` | Build + start en secuencia |
| `npm test` | Ejecuta la suite de Jest |
| `npm run test:watch` | Jest en modo watch |

## Variables de entorno

Crear un archivo `.env` en la raíz con al menos estas variables:

```env
# Servidor
PORT=3000
NODE_ENV=development

# Base de datos (formato URL o campos separados)
DATABASE_URL=mysql://user:pass@host:3306/dbname
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=retailink

# Redis
REDIS_URL=redis://localhost:6379

# Firebase (ruta al JSON de credenciales o config inline)
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=

# Google Cloud Storage
GCS_BUCKET_NAME=
GCS_PROJECT_ID=

# JWT
JWT_SECRET=
JWT_EXPIRES_IN=24h

# Email (Resend / SMTP)
RESEND_API_KEY=
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
```

## Estructura del proyecto

```
src/
├── index.ts                    # Entry point de Express
├── core/                       # Infraestructura transversal
│   ├── prisma.ts               # Cliente de Prisma
│   ├── database.ts             # Wrapper de mysql2 (legacy)
│   ├── middleware/             # Auth, errores, upload
│   ├── services/               # Email, logger
│   └── providers/              # Firebase, geolocalización
├── config/                     # Configuración de servicios externos
│   ├── database.ts             # Pool de mysql2
│   ├── redis.ts
│   ├── firebase.ts
│   └── cloud_store.ts
├── modules/                    # 🏗️ Arquitectura modular objetivo
│   ├── stores/
│   │   ├── store.routes.ts
│   │   ├── store.controller.ts
│   │   ├── store.service.ts
│   │   └── store.dto.ts
│   ├── clients/
│   ├── users/
│   ├── products/
│   ├── questions/
│   ├── promoter/
│   └── channel_sales/
├── app_superadmin/             # Legacy: SuperAdmin (en migración)
├── app_admin/                  # Legacy: Admin (en migración)
├── app_mobile/                 # Legacy: Mobile (en migración)
├── services/                   # Servicios transversales (upload, notificaciones)
├── queues/                     # Definición de colas BullMQ
├── jobs/                       # Tareas programadas (cron)
└── generated/prisma/           # Cliente generado por Prisma (no editar)
```

> **Nota de arquitectura:** El proyecto está migrando de una estructura monolítica por rol (`app_superadmin/`, `app_admin/`, `app_mobile/`) a una **arquitectura modular por dominio** dentro de `modules/`. Cada módulo nuevo debe seguir el patrón: `routes → controller → service → dto`.

## Convención de rutas

La API se divide en tres módulos funcionales:

| Prefijo | Responsabilidad |
|---------|-----------------|
| `/retailink-api/superadmin` | Gestión global (clientes, catálogo de preguntas, tiendas globales) |
| `/retailink-api/admin` | Gestión por cliente (cotizaciones, órdenes, tickets, promotores) |
| `/retailink-api/mobile` | Operación del promotor (tareas, checklists, ubicación GPS) |

Además, los módulos modernos exponen routers independientes bajo sus propios prefijos (ej. `/retailink-api/stores`, `/retailink-api/products`).

## Formato de respuesta

Se busca estandarizar todas las respuestas en este formato:

```json
{
  "ok": true,
  "error": 0,
  "data": {},
  "message": "Operación exitosa"
}
```

En caso de error:

```json
{
  "ok": false,
  "error": 1,
  "data": null,
  "message": "Descripción del error",
  "error_backend": "..."
}
```

## Base de datos y Prisma

- El schema principal está en `prisma/schema.prisma`.
- El cliente se genera en `src/generated/prisma/`.
- Para cualquier cambio en el schema, ejecutar:
  ```bash
  npx prisma migrate dev --name descripcion_del_cambio
  npx prisma generate
  ```
- **Regla importante:** los nuevos módulos deben usar el cliente de Prisma (`src/core/prisma.ts`). El acceso vía `mysql2/promise` y queries crudos está limitado al legacy (`app_mobile/`).

## Testing

El proyecto tiene Jest configurado pero aún no cuenta con tests escritos. Para ejecutar:

```bash
npm test
```

## Documentación de endpoints

Ver `API_DOCS.md` para el detalle completo de endpoints, payloads y autenticación.

## Notas para desarrolladores

- El proyecto usa **ES Modules** (`"type": "module"` en `package.json`).
- Los path aliases (`@/*`) apuntan a `src/*` en desarrollo y `dist/*` en producción.
- Asegúrate de que los campos agregados a la base de datos existan también en `schema.prisma` para mantener la consistencia con el ORM.

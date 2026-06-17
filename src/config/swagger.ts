import path from "path";
import { fileURLToPath } from "url";
import type { Express, Request, Response } from "express";
import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

/**
 * Documentación de la API con Swagger / OpenAPI 3.
 *
 * La UI queda en  GET /retailink-api/docs
 * El JSON crudo en GET /retailink-api/docs.json
 *
 * Los endpoints se documentan con bloques JSDoc `@openapi` ARRIBA de cada ruta
 * en los archivos de rutas dentro de `src/modules` (p. ej. `routes.ts`).
 * Las paths se escriben relativas al server base (`/retailink-api`), p. ej. `/products`.
 */

// En dev corremos .ts (tsx); en prod .js (dist). Globeamos la extensión correcta
// para no duplicar paths ni perderlos. (ESM: derivamos __dirname de import.meta)
const currentFile = fileURLToPath(import.meta.url);
const currentDir = path.dirname(currentFile);
const ext = currentFile.endsWith(".ts") ? "ts" : "js";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.3",
    info: {
      title: "Promotoria API",
      version: "1.0.0",
      description:
        "Documentación de la API de Promotoria. Todos los endpoints cuelgan de `/retailink-api`. La mayoría requiere `Authorization: Bearer {token}`.",
    },
    servers: [{ url: "/retailink-api", description: "Base path de la API" }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Token JWT obtenido al iniciar sesión.",
        },
      },
      schemas: {
        ApiResponse: {
          type: "object",
          description: "Envoltorio estándar de todas las respuestas.",
          properties: {
            ok: { type: "boolean", example: true },
            error: { type: "integer", example: 0 },
            data: { description: "Carga útil (varía por endpoint)." },
            message: { type: "string", example: "Operación exitosa" },
          },
        },
        Pagination: {
          type: "object",
          properties: {
            total: { type: "integer", example: 42 },
            page: { type: "integer", example: 1 },
            limit: { type: "integer", example: 12 },
            totalPages: { type: "integer", example: 4 },
          },
        },
        Product: {
          type: "object",
          properties: {
            id_product: { type: "integer", example: 77 },
            id_client: { type: "integer", example: 2 },
            name: { type: "string", example: "Coca-Cola 600ml" },
            description: { type: "string", nullable: true, example: "Refresco" },
            vc_image: {
              type: "string",
              nullable: true,
              example:
                "https://storage.googleapis.com/bucket/clients/2/products/77/1718580000000-a1b2c3.webp",
            },
            i_status: { type: "integer", example: 1 },
            dt_created: { type: "string", format: "date-time" },
            dt_updated: { type: "string", format: "date-time" },
          },
        },
      },
      responses: {
        Unauthorized: {
          description: "Token ausente o inválido.",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ApiResponse" },
              example: { ok: false, data: null, message: "Acceso denegado. Token no proporcionado." },
            },
          },
        },
        ServerError: {
          description: "Error interno del servidor.",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ApiResponse" },
              example: { ok: false, error: 1, data: null, message: "Error interno" },
            },
          },
        },
      },
    },
    // Por defecto todos los endpoints requieren Bearer; se puede sobreescribir
    // con `security: []` en un endpoint público.
    security: [{ bearerAuth: [] }],
    tags: [
      { name: "Users", description: "Usuarios administradores" },
      { name: "Clients", description: "Clientes y catálogos geográficos" },
      { name: "Products", description: "Catálogo de productos por cliente" },
      { name: "Stores", description: "Tiendas / establecimientos" },
      { name: "Sales Channels", description: "Canales de venta" },
      { name: "Promoters", description: "Promotores (app móvil)" },
      { name: "Questions", description: "Preguntas de auditoría" },
      { name: "Requests", description: "Solicitudes de auditoría" },
      { name: "Orders", description: "Pedidos generados desde solicitudes" },
      { name: "Tasks", description: "Tareas de los promotores" },
    ],
  },
  apis: [path.join(currentDir, `../modules/**/*.${ext}`)],
};

export const swaggerSpec = swaggerJsdoc(options) as Record<string, unknown>;

export function setupSwagger(app: Express): void {
  app.use(
    "/retailink-api/docs",
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, { customSiteTitle: "Promotoria API Docs" }),
  );

  app.get("/retailink-api/docs.json", (_req: Request, res: Response) => {
    res.json(swaggerSpec);
  });
}

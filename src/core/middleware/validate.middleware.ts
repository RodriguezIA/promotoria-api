import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

/**
 * Middleware genérico para validar el body de una request con Zod.
 * Si la validación falla, responde con 400 y los detalles del error.
 */
export const validateBody = (schema: ZodSchema<any>) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const issues = error.issues.map((issue) => ({
          path: issue.path.join('.'),
          message: issue.message,
        }));

        res.status(400).json({
          ok: false,
          error: 1,
          data: null,
          message: 'Datos de entrada inválidos',
          error_backend: issues,
        });
        return;
      }

      res.status(400).json({
        ok: false,
        error: 1,
        data: null,
        message: 'Error de validación desconocido',
        error_backend: error instanceof Error ? error.message : String(error),
      });
    }
  };
};

/**
 * Middleware genérico para validar los params de una request con Zod.
 */
export const validateParams = (schema: ZodSchema<any>) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      schema.parse(req.params);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const issues = error.issues.map((issue) => ({
          path: issue.path.join('.'),
          message: issue.message,
        }));

        res.status(400).json({
          ok: false,
          error: 1,
          data: null,
          message: 'Parámetros de URL inválidos',
          error_backend: issues,
        });
        return;
      }

      res.status(400).json({
        ok: false,
        error: 1,
        data: null,
        message: 'Error de validación desconocido',
        error_backend: error instanceof Error ? error.message : String(error),
      });
    }
  };
};

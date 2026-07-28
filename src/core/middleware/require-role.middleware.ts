import { Request, Response, NextFunction } from "express";

/**
 * Verifica el rol numérico (`i_rol`) del token contra una lista de roles permitidos.
 * `roleMiddleware` (auth.middleware.ts) queda sin usar porque lee un campo `role`
 * que el JWT nunca trae; el token real trae `i_rol` numérico.
 */
export const requireRole = (...roles: number[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const i_rol = (req.user as any)?.i_rol
    if (!i_rol || !roles.includes(i_rol)) {
      res.status(403).json({
        ok: false,
        error: 1,
        data: null,
        message: 'No tienes permiso para esta acción'
      })
      return
    }
    next()
  }
}

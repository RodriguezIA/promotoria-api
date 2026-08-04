import { Request, Response, NextFunction } from 'express'
import { createHash, timingSafeEqual } from 'crypto'

/**
 * Basic Auth aparte del JWT normal, para endpoints de debug/pruebas que no
 * deben depender de una sesión de usuario real (ej. forzar el envío de
 * notificaciones de una tarea). Credenciales en DEBUG_BASIC_AUTH_USER /
 * DEBUG_BASIC_AUTH_PASS — no usar credenciales de un usuario real aquí.
 */
function safeCompare(a: string, b: string): boolean {
    const hashA = createHash('sha256').update(a).digest()
    const hashB = createHash('sha256').update(b).digest()
    return timingSafeEqual(hashA, hashB)
}

export const debugBasicAuthMiddleware = (req: Request, res: Response, next: NextFunction): void => {
    const expectedUser = process.env.DEBUG_BASIC_AUTH_USER
    const expectedPassword = process.env.DEBUG_BASIC_AUTH_PASS

    if (!expectedUser || !expectedPassword) {
        console.error('[DebugAuth] DEBUG_BASIC_AUTH_USER/DEBUG_BASIC_AUTH_PASS no configurados en el entorno.')
        res.status(500).json({ ok: false, error: 1, data: null, message: 'Autenticación de debug no configurada en el servidor.' })
        return
    }

    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Basic ')) {
        res.setHeader('WWW-Authenticate', 'Basic realm="debug"')
        res.status(401).json({ ok: false, error: 1, data: null, message: 'Autenticación básica requerida.' })
        return
    }

    const decoded = Buffer.from(authHeader.slice('Basic '.length), 'base64').toString('utf-8')
    const separatorIndex = decoded.indexOf(':')
    const user = separatorIndex === -1 ? decoded : decoded.slice(0, separatorIndex)
    const password = separatorIndex === -1 ? '' : decoded.slice(separatorIndex + 1)

    if (!safeCompare(user, expectedUser) || !safeCompare(password, expectedPassword)) {
        res.setHeader('WWW-Authenticate', 'Basic realm="debug"')
        res.status(401).json({ ok: false, error: 1, data: null, message: 'Credenciales inválidas.' })
        return
    }

    next()
}

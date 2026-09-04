import { createCipheriv, createDecipheriv, randomBytes, createHash } from 'crypto'

/**
 * Cifrado reversible para datos financieros (CLABE, número de tarjeta).
 *
 * Usamos AES-256-GCM: además de cifrar, GCM agrega un "tag" de autenticación
 * que detecta si el texto cifrado fue alterado o corrompido (a diferencia de
 * modos como CBC, que descifrarían basura sin avisar).
 *
 * La llave (ENCRYPTION_KEY) vive SOLO en el .env del servidor. Nunca se
 * guarda en la base de datos ni en el repositorio. Si se pierde o cambia,
 * los datos cifrados con la llave anterior dejan de poder leerse — por eso
 * es crítico respaldarla en un lugar seguro (gestor de contraseñas del
 * negocio), no solo en el servidor.
 *
 * Formato guardado en BD: "iv:authTag:cipherText" (todo en hex), en un solo
 * string, para poder guardarlo en una sola columna TEXT.
 */

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 16 // bytes

function getKey(): Buffer {
    const secret = process.env.ENCRYPTION_KEY
    if (!secret) {
        throw new Error(
            'ENCRYPTION_KEY no está configurada en las variables de entorno. ' +
            'Sin esta llave no es posible cifrar ni descifrar datos bancarios.'
        )
    }
    // Se admite cualquier longitud de texto en ENCRYPTION_KEY: se deriva una
    // llave de exactamente 32 bytes (256 bits) via SHA-256, para no obligar
    // a que el .env tenga un formato hexadecimal exacto de 64 caracteres.
    return createHash('sha256').update(secret).digest()
}

export class EncryptionService {
    /**
     * Cifra un texto plano. Devuelve null si el valor de entrada es null o
     * vacío (para no cifrar "nada" y llenar la BD de basura innecesaria).
     */
    static encrypt(plainText: string | null | undefined): string | null {
        if (plainText === null || plainText === undefined || plainText === '') return null

        const key = getKey()
        const iv = randomBytes(IV_LENGTH)
        const cipher = createCipheriv(ALGORITHM, key, iv)

        const encrypted = Buffer.concat([cipher.update(plainText, 'utf8'), cipher.final()])
        const authTag = cipher.getAuthTag()

        return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`
    }

    /**
     * Descifra un texto previamente cifrado con encrypt(). Devuelve null si
     * el valor es null/vacío. Lanza error si el formato es inválido o si el
     * dato fue alterado (falla la verificación del authTag de GCM).
     */
    static decrypt(cipherPayload: string | null | undefined): string | null {
        if (cipherPayload === null || cipherPayload === undefined || cipherPayload === '') return null

        const parts = cipherPayload.split(':')
        if (parts.length !== 3) {
            throw new Error('Formato de dato cifrado inválido (¿este dato no fue cifrado con este servicio?)')
        }
        const [ivHex, authTagHex, encryptedHex] = parts

        const key = getKey()
        const decipher = createDecipheriv(ALGORITHM, key, Buffer.from(ivHex, 'hex'))
        decipher.setAuthTag(Buffer.from(authTagHex, 'hex'))

        const decrypted = Buffer.concat([
            decipher.update(Buffer.from(encryptedHex, 'hex')),
            decipher.final(),
        ])

        return decrypted.toString('utf8')
    }

    /**
     * Devuelve solo los últimos 4 dígitos de un número (CLABE o tarjeta),
     * para mostrar en la app/panel sin exponer el dato completo.
     * Ej: maskLast4("012180012345678901") -> "•••• 8901"
     */
    static maskLast4(plainNumber: string | null | undefined): string | null {
        if (!plainNumber) return null
        const clean = plainNumber.replace(/\s/g, '')
        if (clean.length <= 4) return `•••• ${clean}`
        return `•••• ${clean.slice(-4)}`
    }

    /**
     * Conveniencia: descifra un valor y de una vez regresa solo los últimos
     * 4 dígitos, sin exponer el número completo en ningún punto intermedio
     * del código que no lo necesite.
     */
    static decryptToMasked(cipherPayload: string | null | undefined): string | null {
        const plain = EncryptionService.decrypt(cipherPayload)
        return EncryptionService.maskLast4(plain)
    }
}

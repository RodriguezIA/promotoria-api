/** IVA en Mexico. Un solo lugar para cambiarlo si algun dia cambia. */
export const IVA_RATE = 0.16

const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100

/** Recibe el subtotal (sin IVA) y devuelve el desglose: subtotal, IVA y total. */
export function addIva(subtotal: number): { subtotal: number; tax: number; total: number } {
    const sub = round2(subtotal)
    const tax = round2(sub * IVA_RATE)
    return { subtotal: sub, tax, total: round2(sub + tax) }
}

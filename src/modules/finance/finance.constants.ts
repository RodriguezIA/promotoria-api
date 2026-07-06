/**
 * Estatus y constantes del módulo financiero.
 * Centralizados aquí para que el backend, los jobs y la documentación
 * usen siempre los mismos valores enteros.
 */

/** Estatus de una factura/cobro al cliente (client_invoices.i_status). */
export const INVOICE_STATUS = {
    PENDIENTE: 1,
    EN_REVISION: 2,
    ACEPTADO: 3, // pagado
    RECHAZADO: 4,
    ATRASADO: 5,
} as const;

export const INVOICE_STATUS_LABEL: Record<number, string> = {
    [INVOICE_STATUS.PENDIENTE]: 'pendiente',
    [INVOICE_STATUS.EN_REVISION]: 'en_revision',
    [INVOICE_STATUS.ACEPTADO]: 'aceptado',
    [INVOICE_STATUS.RECHAZADO]: 'rechazado',
    [INVOICE_STATUS.ATRASADO]: 'atrasado',
};

/** Estatus de un comprobante de pago enviado por el cliente (invoice_payments.i_status). */
export const PAYMENT_REVIEW_STATUS = {
    EN_REVISION: 1,
    ACEPTADO: 2,
    RECHAZADO: 3,
} as const;

/** Estatus de un pago a promotor (promoter_payments.i_status). */
export const PROMOTER_PAYMENT_STATUS = {
    PENDIENTE: 1,
    PAGADO: 2,
} as const;

export const PROMOTER_PAYMENT_STATUS_LABEL: Record<number, string> = {
    [PROMOTER_PAYMENT_STATUS.PENDIENTE]: 'pendiente',
    [PROMOTER_PAYMENT_STATUS.PAGADO]: 'pagado',
};

/** Estatus de tarea que se considera "completada correctamente" y por tanto facturable/pagable. */
export const TASK_STATUS_COMPLETED = 3;

/** Métodos de pago aceptados (deben coincidir con el frontend). */
export const PAYMENT_METHODS = ['efectivo', 'transferencia', 'tarjeta', 'oxxo'] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

/** Valores por defecto si no existe finance_settings todavía. */
export const FINANCE_DEFAULTS = {
    PROMOTER_PCT: 50,
    PERIOD_DAYS: 7,
    BILLING_WEEKDAY: 1, // lunes
    PAYMENT_DUE_DAYS: 7,
} as const;

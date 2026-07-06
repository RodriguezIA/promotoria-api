import { PaymentMethod } from './finance.constants'

/** Filtros para listar facturas (cobros) en el panel super admin. */
export interface InvoiceFiltersDTO {
    id_client?: number
    i_status?: number
}

/** Período opcional para la generación de cobros/pagos. Si no se manda, se calcula con la config. */
export interface GeneratePeriodDTO {
    id_client?: number
    dt_period_start?: string
    dt_period_end?: string
}

/** Payload que el cliente envía al subir un comprobante de pago. */
export interface SubmitClientPaymentDTO {
    id_user: number
    f_amount: number
    vc_method: PaymentMethod
    vc_reference?: string
    vc_notes?: string
}

/** Revisión de un comprobante por el super admin. */
export interface ReviewInvoicePaymentDTO {
    decision: 'aceptado' | 'rechazado'
    vc_review_notes?: string
    id_reviewed_by: number
}

/** Registro del pago a un promotor por el super admin. */
export interface RegisterPromoterPaymentDTO {
    vc_method?: PaymentMethod
    vc_reference?: string
    vc_notes?: string
    id_paid_by: number
}

/** Configuración global editable. */
export interface GlobalConfigDTO {
    f_promoter_pct?: number
    i_default_period_days?: number
    i_default_billing_weekday?: number
    i_default_payment_due_days?: number
}

/** Override de configuración por cliente. */
export interface ClientConfigDTO {
    i_period_days?: number
    i_billing_weekday?: number
    i_payment_due_days?: number
    b_active?: boolean
}

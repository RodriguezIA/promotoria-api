export interface GenerateChargesDTO {
  dt_start: Date
  dt_end: Date
  dt_due: Date
  id_client?: number
  id_user_creator: number
}

export interface ChargeFiltersDTO {
  id_client?: number
  dt_start?: Date
  dt_end?: Date
  vc_folio?: string
  page?: number
  limit?: number
}

// Filtros para listar FACTURAS individuales (pantalla "Gestión de pagos" del cliente)
export interface InvoiceFiltersDTO {
  id_client?: number
  id_status?: number
  dt_start?: Date
  dt_end?: Date
  vc_folio?: string
  b_overdue?: boolean // true = solo facturas vencidas (pasó dt_due y sigue sin pagar)
  page?: number
  limit?: number
}

export interface UpdateInvoicePaymentDTO {
  dt_payment: Date
  vc_payment_method: string
}

export type InvoiceStatusAction = 'approve' | 'reject' | 'cancel'

export interface UpdateInvoiceStatusDTO {
  action: InvoiceStatusAction
  vc_rejection_reason?: string
}

export interface UpdateInvoiceDueDateDTO {
  dt_due: Date
}

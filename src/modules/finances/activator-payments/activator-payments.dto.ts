export interface GenerateActivatorPaymentsDTO {
  dt_start: Date
  dt_end: Date
  id_activator?: number
  id_user_creator: number
}

export interface ActivatorPaymentFiltersDTO {
  id_activator?: number
  id_status?: number
  dt_start?: Date
  dt_end?: Date
  vc_folio?: string
  page?: number
  limit?: number
}

export interface UpdateActivatorPaymentPaymentDTO {
  dt_payment: Date
  id_bank_account?: number
  vc_notes?: string
}

export type ActivatorPaymentStatusAction = 'cancel'

export interface UpdateActivatorPaymentStatusDTO {
  action: ActivatorPaymentStatusAction
}

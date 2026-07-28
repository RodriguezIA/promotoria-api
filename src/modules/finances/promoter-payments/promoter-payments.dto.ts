export interface GeneratePaymentsDTO {
  dt_start: Date
  dt_end: Date
  id_promoter?: number
  id_user_creator: number
}

export interface PaymentFiltersDTO {
  id_promoter?: number
  id_status?: number
  dt_start?: Date
  dt_end?: Date
  vc_folio?: string
  page?: number
  limit?: number
}

export interface UpdatePaymentPaymentDTO {
  dt_payment: Date
  id_bank_account: number
  vc_notes?: string
}

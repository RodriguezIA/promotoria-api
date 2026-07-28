export interface GenerateChargesDTO {
  dt_start: Date
  dt_end: Date
  id_client?: number
  id_user_creator: number
}

export interface ChargeFiltersDTO {
  id_client?: number
  id_status?: number
  dt_start?: Date
  dt_end?: Date
  vc_folio?: string
  page?: number
  limit?: number
}

export interface UpdateChargePaymentDTO {
  dt_payment: Date
  vc_payment_method: string
}

export type ChargeStatusAction = 'approve' | 'reject' | 'cancel'

export interface UpdateChargeStatusDTO {
  action: ChargeStatusAction
  vc_rejection_reason?: string
}

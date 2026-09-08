export interface createProductPayload {
    id_user: number
    id_client: number
    name: string
    description?: string
    vc_image?: string
    i_stock?: number | null
    b_allow_backorder?: boolean
    i_backorder_days?: number | null
    f_store_price?: number | null
}
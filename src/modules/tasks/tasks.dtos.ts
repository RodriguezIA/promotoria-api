export interface CreateTaskDTO {
    id_client: number
    id_order: number
    id_store: number
    id_request: number
}

export interface UpdateTaskDTO {
    id_status?: number
}

export interface AssignPromoterDTO {
    id_promoter: number
}

export interface AnswerTaskQuestionDTO {
    id_request_product_question: number
    vc_answer?: string
}

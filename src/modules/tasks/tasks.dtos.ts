export interface CreateTaskDTO {
    id_client: number
    id_order: number
    id_store: number
    id_request: number
}

export interface UpdateTaskDTO {
    id_status?: number
}

export interface AnswerItemDTO {
    id_request_product_question: number
    vc_answer?: string | null
}

export interface BatchAnswersDTO {
    answers: AnswerItemDTO[]
}

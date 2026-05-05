export interface CreateRequestDTO {
    id_user: number;
    id_client: number;
    vc_name: string;
    f_value: number;
    url_rack_image?: string;
    products?: CreateRequestProductDTO[];
}

export interface UpdateRequestDTO {
    id_user?: number;
    id_client?: number;
    vc_name?: string;
    f_value?: number;
    url_rack_image?: string;
    id_status?: number;
    products?: UpdateRequestProductDTO[];
}

export interface RequestDTO {
    id_request: number;
    id_user: number;
    id_client: number;
    vc_name: string;
    f_value: number;
    url_rack_image?: string;
    id_status: number;
    b_active: boolean;
    dt_register: Date;
    dt_update: Date;
}

export interface CreateRequestProductDTO {
    id_product: number;
    questions?: CreateRequestProductQuestionDTO[];
}

export interface UpdateRequestProductDTO {
    id_request_product?: number;
    id_product: number;
    questions?: UpdateRequestProductQuestionDTO[];
}

export interface RequestProductDTO {
    id_request_product: number;
    id_request: number;
    id_product: number;
    dt_register: Date;
    dt_update: Date;
    b_active: boolean;
}

export interface CreateRequestProductQuestionDTO {
    id_question: number;
}

export interface UpdateRequestProductQuestionDTO {
    id_request_product_question?: number;
    id_question: number;
}

export interface RequestProductQuestionDTO {
    id_request_product_question: number;
    id_request_product: number;
    id_question: number;
    dt_register: Date;
    dt_update: Date;
    b_active: boolean;
}

export interface RequestFiltersDTO {
    id_client?: number;
    id_user?: number;
    id_status?: number;
    b_active?: boolean;
    page?: number;
    limit?: number;
}

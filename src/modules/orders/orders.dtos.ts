export interface OrderItemInputDTO {
    id_request: number;
    stores: number[];
}

export interface CreateOrderDTO {
    id_user: number;
    id_client: number;
    items: OrderItemInputDTO[];
}

export interface UpdateOrderDTO {
    id_status?: number;
    f_total?: number;
}

export interface OrderFiltersDTO {
    id_client?: number;
    id_user?: number;
    id_status?: number;
    page?: number;
    limit?: number;
}

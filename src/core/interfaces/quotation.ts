export type QuotationStatus = 1 | 2 | 0; // 1=borrador, 2=confirmado, 0=eliminado
export type LogType = 1 | 2; // 1=bitácora (visible), 2=transaccional (oculto)
export type PaymentStatus = 0 | 1 | 2; // 0=pendiente, 1=pagado, 2=fallido
export type TicketStatus = 0 | 1 | 2 | 3; // 0=pendiente, 1=asignado, 2=en_progreso, 3=completado

export interface IQuotation {
    id_quotation: number;
    id_client: number;
    quotation_name: string;
    total_price: number;
    total_establishments: number;
    total_tickets: number;
    i_status: QuotationStatus;
    dt_register: string;
    dt_updated: string;
}

export interface ICreateQuotationPayload {
    id_client: number;
    quotation_name: string;
    products?: IQuotationProductPayload[];
    questions?: IQuotationQuestionPayload[];
    stores?: number[]; // Array de id_store
}

export interface IUpdateQuotationPayload {
    quotation_name?: string;
    products?: IQuotationProductPayload[];
    questions?: IQuotationQuestionPayload[];
    stores?: number[];
    i_status?: QuotationStatus;
}

// Productos en cotización
export interface IQuotationProduct {
    id_quotation_product: number;
    id_quotation: number;
    id_product: number;
    quantity?: number;          // Opcional: cantidad de productos por servicio
    product_price?: number;     // Opcional: precio del producto si aplica
    i_status: boolean;
    dt_register: string;
}

export interface IQuotationProductPayload {
    id_product: number;
    quantity?: number;
    product_price?: number;
}

// Preguntas en cotización
export interface IQuotationQuestion {
    id_quotation_question: number;
    id_quotation: number;
    id_question_client: number;
    question_price: number;
    i_status: boolean;
    dt_register: string;
}

export interface IQuotationQuestionPayload {
    id_question_client: number;
    question_price: number;
}

// Establecimientos en cotización
export interface IQuotationStore {
    id_quotation_store: number;
    id_quotation: number;
    id_store: number;
    i_status: boolean;
    dt_register: string;
}

// Logs de cotización
export interface IQuotationLog {
    id_quotation_log: number;
    id_quotation: number;
    id_user: number;
    log: string;
    i_type: LogType;
    i_status: boolean;
    dt_register: string;
}

// ============================================
// ÓRDENES DE SERVICIO
// ============================================

export interface IServiceOrder {
    id_service_order: number;
    id_quotation: number;
    id_client: number;
    order_number: string;
    total_amount: number;
    payment_status: PaymentStatus;
    i_status: boolean;
    dt_register: string;
    dt_paid?: string;
}

export interface ICreateServiceOrderPayload {
    id_quotation: number;
    id_client: number;
}

// Logs de orden de servicio
export interface IServiceOrderLog {
    id_service_order_log: number;
    id_service_order: number;
    id_user: number;
    log: string;
    i_type: LogType;
    i_status: boolean;
    dt_register: string;
}

// ============================================
// TICKETS DE SERVICIO
// ============================================

export interface IServiceTicket {
    id_ticket: number;
    id_service_order: number;
    id_store: number;
    id_promoter?: number;
    ticket_number: string;
    ticket_price: number;
    ticket_status: TicketStatus;
    dt_assigned?: string;
    dt_started?: string;
    dt_completed?: string;
    i_status: boolean;
    dt_register: string;
    dt_updated: string;
}

// Productos del ticket
export interface ITicketProduct {
    id_ticket_product: number;
    id_ticket: number;
    id_product: number;
    quantity?: number;
    i_status: boolean;
    dt_register: string;
}

// Preguntas del checklist del ticket
export interface ITicketQuestion {
    id_ticket_question: number;
    id_ticket: number;
    id_question: number;
    question_price: number;
    i_status: boolean;
    dt_register: string;
}

// Logs de ticket
export interface ITicketLog {
    id_ticket_log: number;
    id_ticket: number;
    id_user: number;
    log: string;
    i_type: LogType;
    i_status: boolean;
    dt_register: string;
}

// ============================================
// RESPUESTAS (Futuro: cuando promotor conteste)
// ============================================

export interface ITicketAnswer {
    id_ticket_answer: number;
    id_ticket_question: number;
    id_ticket: number;
    id_promoter?: number;
    answer_text?: string;           // Para tipo 'open'
    answer_option?: number;         // Para tipo 'options' (id_option)
    answer_boolean?: boolean;       // Para tipo 'yes_no'
    answer_numeric?: number;        // Para tipo 'numeric'
    answer_date?: string;           // Para tipo 'date'
    answer_photos?: string[];       // Para tipo 'photo' (array de URLs)
    i_status: boolean;
    dt_register: string;
    dt_updated: string;
}

// ============================================
// VISTAS COMBINADAS (para consultas)
// ============================================

export interface IQuotationDetail extends IQuotation {
    products?: IQuotationProduct[];
    questions?: (IQuotationQuestion & { question_text?: string; question_type?: string })[];
    stores?: (IQuotationStore & { store_name?: string })[];
    client_name?: string;
}

export interface IServiceTicketDetail extends IServiceTicket {
    store_name?: string;
    products?: ITicketProduct[];
    questions?: (ITicketQuestion & { question_text?: string; question_type?: string })[];
    order_number?: string;
}

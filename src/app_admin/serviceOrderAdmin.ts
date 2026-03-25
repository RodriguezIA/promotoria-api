import db from '../config/database';
import { Database } from '../core/database';
import { Utils } from '../core/utils';
import {
    IServiceOrder,
    IServiceTicket,
    PaymentStatus,
    TicketStatus,
    LogType
} from '../core/interfaces/quotation';

export class ServiceOrderAdmin {
    protected db: Database = db;

    constructor() {}

    // ==================== GENERADORES ====================

    /**
     * Genera número de orden único: ORD-YYYYMMDD-XXXX
     */
    private async generateOrderNumber(): Promise<string> {
        const today = new Date();
        const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');

        // Contar órdenes de hoy
        const result = await this.db.select(`
            SELECT COUNT(*) as count
            FROM service_orders
            WHERE DATE(dt_register) = CURDATE()
        `);

        const sequence = (result[0]?.count || 0) + 1;
        return `ORD-${dateStr}-${sequence.toString().padStart(4, '0')}`;
    }

    /**
     * Genera número de ticket único: TKT-YYYYMMDD-XXXX
     */
    private async generateTicketNumber(): Promise<string> {
        const today = new Date();
        const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');

        // Contar tickets de hoy
        const result = await this.db.select(`
            SELECT COUNT(*) as count
            FROM service_tickets
            WHERE DATE(dt_register) = CURDATE()
        `);

        const sequence = (result[0]?.count || 0) + 1;
        return `TKT-${dateStr}-${sequence.toString().padStart(4, '0')}`;
    }

    // ==================== LOGS ====================
    // Los logs de esta entidad usan Utils.registerServiceOrderLog y Utils.registerTicketLog

    // ==================== CREAR ORDEN Y TICKETS ====================

    /**
     * Confirmar cotización y generar orden de servicio + tickets
     * Este es el método principal que:
     * 1. Crea la orden de servicio
     * 2. Genera N tickets (1 por establecimiento)
     * 3. Copia productos y preguntas a cada ticket
     */
    async confirmQuotationAndCreateOrder(
        id_quotation: number,
        id_client: number,
        id_user: number
    ) {
        let commit = false;
        try {
            if (!this.db.inTransaction) {
                await this.db.beginTransaction();
                commit = true;
            }

            // 1. Verificar que la cotización existe y pertenece al cliente
            const quotation = await this.db.select(`
                SELECT
                    q.id_quotation,
                    q.id_client,
                    q.quotation_name,
                    q.total_price,
                    q.total_establishments,
                    q.i_status
                FROM quotations q
                WHERE q.id_quotation = ?
                AND q.id_client = ?
                AND q.i_status != 0
            `, [id_quotation, id_client]);

            if (quotation.length === 0) {
                throw new Error("Cotización no encontrada");
            }

            const quotationData = quotation[0];

            // 2. Verificar que tiene al menos 1 establecimiento y 1 pregunta
            const stores = await this.db.select(`
                SELECT qs.id_store
                FROM quotation_stores qs
                WHERE qs.id_quotation = ? AND qs.i_status = 1
            `, [id_quotation]);

            if (stores.length === 0) {
                throw new Error("La cotización debe tener al menos un establecimiento");
            }

            const questions = await this.db.select(`
                SELECT qq.id_question_client, qq.question_price, qc.id_question
                FROM quotation_questions qq
                INNER JOIN questions_client qc ON qq.id_question_client = qc.id_question_client
                WHERE qq.id_quotation = ? AND qq.i_status = 1
            `, [id_quotation]);

            if (questions.length === 0) {
                throw new Error("La cotización debe tener al menos una pregunta");
            }

            // Obtener productos (opcional)
            const products = await this.db.select(`
                SELECT qp.id_product, qp.quantity
                FROM quotation_products qp
                WHERE qp.id_quotation = ? AND qp.i_status = 1
            `, [id_quotation]);

            // 3. Calcular precio por ticket
            const pricePerTicket = questions.reduce(
                (sum: number, q: any) => sum + parseFloat(q.question_price || 0),
                0
            );

            const totalAmount = pricePerTicket * stores.length;

            // 4. Generar número de orden y crear orden de servicio
            const orderNumber = await this.generateOrderNumber();

            const orderResult = await this.db.execute(`
                INSERT INTO service_orders (id_quotation, id_client, order_number, total_amount, payment_status)
                VALUES (?, ?, ?, ?, 0)
            `, [id_quotation, id_client, orderNumber, totalAmount]);

            const id_service_order = orderResult.insertId;

            // 5. Registrar log de orden (bitácora)
            await Utils.registerServiceOrderLog(this.db, id_service_order, id_user, `Orden creada desde cotización "${quotationData.quotation_name}"`, 1);
            await Utils.registerServiceOrderLog(this.db, id_service_order, id_user, `Orden generada: ${stores.length} tickets, monto total: $${totalAmount}`, 2);

            // 6. Crear tickets (1 por establecimiento)
            const ticketsCreated: number[] = [];

            for (const store of stores) {
                const ticketNumber = await this.generateTicketNumber();

                const ticketResult = await this.db.execute(`
                    INSERT INTO service_tickets (id_service_order, id_store, ticket_number, ticket_price, ticket_status)
                    VALUES (?, ?, ?, ?, 0)
                `, [id_service_order, store.id_store, ticketNumber, pricePerTicket]);

                const id_ticket = ticketResult.insertId;
                ticketsCreated.push(id_ticket);

                // Insertar productos del ticket
                for (const product of products) {
                    await this.db.execute(`
                        INSERT INTO ticket_products (id_ticket, id_product, quantity)
                        VALUES (?, ?, ?)
                    `, [id_ticket, product.id_product, product.quantity]);
                }

                // Insertar preguntas del ticket
                for (const question of questions) {
                    await this.db.execute(`
                        INSERT INTO ticket_questions (id_ticket, id_question, question_price)
                        VALUES (?, ?, ?)
                    `, [id_ticket, question.id_question, question.question_price]);
                }

                // Log del ticket
                await Utils.registerTicketLog(this.db, id_ticket, id_user, 'Ticket creado', 1);
            }

            // 7. Actualizar estado de cotización a "confirmado"
            await this.db.execute(`
                UPDATE quotations SET i_status = 2 WHERE id_quotation = ?
            `, [id_quotation]);

            if (commit) {
                await this.db.commit();
            }

            return {
                ok: true,
                data: {
                    id_service_order,
                    order_number: orderNumber,
                    total_amount: totalAmount,
                    tickets_count: ticketsCreated.length,
                    ticket_ids: ticketsCreated
                },
                message: `Orden creada exitosamente con ${ticketsCreated.length} tickets`
            };

        } catch (error) {
            if (commit) {
                await this.db.rollback();
            }
            throw error;
        }
    }

    // ==================== CONSULTAS DE ÓRDENES ====================

    /**
     * Obtener órdenes de servicio de un cliente
     */
    async getServiceOrdersForClient(id_client: number) {
        try {
            const query = `
                SELECT
                    so.id_service_order,
                    so.id_quotation,
                    so.id_client,
                    so.order_number,
                    so.total_amount,
                    so.payment_status,
                    so.i_status,
                    so.dt_register,
                    so.dt_paid,
                    q.quotation_name,
                    (SELECT COUNT(*) FROM service_tickets st WHERE st.id_service_order = so.id_service_order) as tickets_count,
                    (SELECT COUNT(*) FROM service_tickets st WHERE st.id_service_order = so.id_service_order AND st.ticket_status = 3) as tickets_completed
                FROM service_orders so
                INNER JOIN quotations q ON so.id_quotation = q.id_quotation
                WHERE so.id_client = ?
                AND so.i_status = 1
                ORDER BY so.dt_register DESC
            `;
            return await this.db.select(query, [id_client]);
        } catch (error) {
            throw error;
        }
    }

    /**
     * Obtener detalle de una orden de servicio
     */
    async getServiceOrderById(id_service_order: number, id_client: number) {
        try {
            const query = `
                SELECT
                    so.id_service_order,
                    so.id_quotation,
                    so.id_client,
                    so.order_number,
                    so.total_amount,
                    so.payment_status,
                    so.i_status,
                    so.dt_register,
                    so.dt_paid,
                    q.quotation_name
                FROM service_orders so
                INNER JOIN quotations q ON so.id_quotation = q.id_quotation
                WHERE so.id_service_order = ?
                AND so.id_client = ?
            `;
            const result = await this.db.select(query, [id_service_order, id_client]);

            if (result.length === 0) {
                return {
                    ok: false,
                    data: null,
                    message: "Orden no encontrada"
                };
            }

            const order = result[0];

            // Obtener tickets de esta orden
            order.tickets = await this.getTicketsByOrder(id_service_order);

            return {
                ok: true,
                data: order,
                message: "Orden obtenida exitosamente"
            };
        } catch (error) {
            throw error;
        }
    }

    /**
     * Obtener tickets de una orden
     */
    private async getTicketsByOrder(id_service_order: number) {
        const query = `
            SELECT
                st.id_ticket,
                st.id_service_order,
                st.id_store,
                st.id_promoter,
                st.ticket_number,
                st.ticket_price,
                st.ticket_status,
                st.dt_assigned,
                st.dt_started,
                st.dt_completed,
                st.i_status,
                st.dt_register,
                s.name as store_name,
                s.municipality,
                s.state
            FROM service_tickets st
            INNER JOIN stores s ON st.id_store = s.id_store
            WHERE st.id_service_order = ?
            AND st.i_status = 1
            ORDER BY s.name ASC
        `;
        return await this.db.select(query, [id_service_order]);
    }

    // ==================== CONSULTAS DE TICKETS ====================

    /**
     * Obtener todos los tickets de un cliente
     */
    async getTicketsForClient(id_client: number, filters?: {
        ticket_status?: TicketStatus;
        id_store?: number;
    }) {
        try {
            let query = `
                SELECT
                    st.id_ticket,
                    st.id_service_order,
                    st.id_store,
                    st.id_promoter,
                    st.ticket_number,
                    st.ticket_price,
                    st.ticket_status,
                    st.dt_assigned,
                    st.dt_started,
                    st.dt_completed,
                    st.i_status,
                    st.dt_register,
                    s.name as store_name,
                    s.municipality,
                    s.state,
                    so.order_number,
                    q.quotation_name
                FROM service_tickets st
                INNER JOIN stores s ON st.id_store = s.id_store
                INNER JOIN service_orders so ON st.id_service_order = so.id_service_order
                INNER JOIN quotations q ON so.id_quotation = q.id_quotation
                WHERE so.id_client = ?
                AND st.i_status = 1
            `;

            const params: any[] = [id_client];

            if (filters?.ticket_status !== undefined) {
                query += ` AND st.ticket_status = ?`;
                params.push(filters.ticket_status);
            }

            if (filters?.id_store !== undefined) {
                query += ` AND st.id_store = ?`;
                params.push(filters.id_store);
            }

            query += ` ORDER BY st.dt_register DESC`;

            return await this.db.select(query, params);
        } catch (error) {
            throw error;
        }
    }

    /**
     * Obtener detalle de un ticket
     */
    async getTicketById(id_ticket: number, id_client: number) {
        try {
            const query = `
                SELECT
                    st.id_ticket,
                    st.id_service_order,
                    st.id_store,
                    st.id_promoter,
                    st.ticket_number,
                    st.ticket_price,
                    st.ticket_status,
                    st.dt_assigned,
                    st.dt_started,
                    st.dt_completed,
                    st.i_status,
                    st.dt_register,
                    s.name as store_name,
                    s.street,
                    s.ext_number,
                    s.neighborhood,
                    s.municipality,
                    s.state,
                    s.postal_code,
                    s.latitude,
                    s.longitude,
                    so.order_number,
                    so.id_client,
                    q.quotation_name
                FROM service_tickets st
                INNER JOIN stores s ON st.id_store = s.id_store
                INNER JOIN service_orders so ON st.id_service_order = so.id_service_order
                INNER JOIN quotations q ON so.id_quotation = q.id_quotation
                WHERE st.id_ticket = ?
                AND so.id_client = ?
            `;
            const result = await this.db.select(query, [id_ticket, id_client]);

            if (result.length === 0) {
                return {
                    ok: false,
                    data: null,
                    message: "Ticket no encontrado"
                };
            }

            const ticket = result[0];

            // Obtener productos del ticket
            ticket.products = await this.getTicketProducts(id_ticket);

            // Obtener preguntas del ticket (checklist)
            ticket.questions = await this.getTicketQuestions(id_ticket);

            return {
                ok: true,
                data: ticket,
                message: "Ticket obtenido exitosamente"
            };
        } catch (error) {
            throw error;
        }
    }

    private async getTicketProducts(id_ticket: number) {
        const query = `
            SELECT
                tp.id_ticket_product,
                tp.id_ticket,
                tp.id_product,
                tp.quantity,
                p.name as product_name,
                p.sku,
                p.description
            FROM ticket_products tp
            INNER JOIN products p ON tp.id_product = p.id_product
            WHERE tp.id_ticket = ? AND tp.i_status = 1
        `;
        return await this.db.select(query, [id_ticket]);
    }

    private async getTicketQuestions(id_ticket: number) {
        const query = `
            SELECT
                tq.id_ticket_question,
                tq.id_ticket,
                tq.id_question,
                tq.question_price,
                q.question as question_text,
                q.question_type,
                q.is_multiple,
                q.min_value,
                q.max_value,
                q.max_photos
            FROM ticket_questions tq
            INNER JOIN questions q ON tq.id_question = q.id_question
            WHERE tq.id_ticket = ? AND tq.i_status = 1
        `;
        return await this.db.select(query, [id_ticket]);
    }

    // ==================== ACTUALIZAR ESTADO DE PAGO ====================

    /**
     * Marcar orden como pagada
     */
    async markOrderAsPaid(id_service_order: number, id_client: number, id_user: number) {
        try {
            const result = await this.db.execute(`
                UPDATE service_orders
                SET payment_status = 1, dt_paid = NOW()
                WHERE id_service_order = ? AND id_client = ? AND payment_status = 0
            `, [id_service_order, id_client]);

            if (result.affectedRows === 0) {
                return {
                    ok: false,
                    message: "Orden no encontrada o ya está pagada"
                };
            }

            await Utils.registerServiceOrderLog(this.db, id_service_order, id_user, 'Pago registrado', 1);
            await Utils.registerServiceOrderLog(this.db, id_service_order, id_user, 'payment_status: 0 -> 1', 2);

            return {
                ok: true,
                message: "Pago registrado exitosamente"
            };
        } catch (error) {
            throw error;
        }
    }

    // ==================== ESTADÍSTICAS ====================

    /**
     * Obtener estadísticas de órdenes y tickets del cliente
     */
    async getServiceStatsForClient(id_client: number) {
        try {
            // Estadísticas de órdenes
            const orderStats = await this.db.select(`
                SELECT
                    COUNT(*) as total_orders,
                    SUM(total_amount) as total_revenue,
                    SUM(CASE WHEN payment_status = 0 THEN 1 ELSE 0 END) as orders_pending,
                    SUM(CASE WHEN payment_status = 1 THEN 1 ELSE 0 END) as orders_paid,
                    SUM(CASE WHEN payment_status = 0 THEN total_amount ELSE 0 END) as pending_amount,
                    SUM(CASE WHEN payment_status = 1 THEN total_amount ELSE 0 END) as paid_amount
                FROM service_orders
                WHERE id_client = ? AND i_status = 1
            `, [id_client]);

            // Estadísticas de tickets
            const ticketStats = await this.db.select(`
                SELECT
                    COUNT(*) as total_tickets,
                    SUM(CASE WHEN st.ticket_status = 0 THEN 1 ELSE 0 END) as tickets_pending,
                    SUM(CASE WHEN st.ticket_status = 1 THEN 1 ELSE 0 END) as tickets_assigned,
                    SUM(CASE WHEN st.ticket_status = 2 THEN 1 ELSE 0 END) as tickets_in_progress,
                    SUM(CASE WHEN st.ticket_status = 3 THEN 1 ELSE 0 END) as tickets_completed
                FROM service_tickets st
                INNER JOIN service_orders so ON st.id_service_order = so.id_service_order
                WHERE so.id_client = ? AND st.i_status = 1
            `, [id_client]);

            return {
                orders: orderStats[0] || {},
                tickets: ticketStats[0] || {}
            };
        } catch (error) {
            throw error;
        }
    }

    // ==================== LOGS VISIBLES ====================

    /**
     * Obtener logs visibles de una orden (i_type = 1)
     */
    async getServiceOrderLogs(id_service_order: number, id_client: number) {
        try {
            // Verificar que la orden pertenece al cliente
            const exists = await this.db.select(
                "SELECT id_service_order FROM service_orders WHERE id_service_order = ? AND id_client = ?",
                [id_service_order, id_client]
            );

            if (exists.length === 0) {
                return {
                    ok: false,
                    data: [],
                    message: "Orden no encontrada"
                };
            }

            const query = `
                SELECT
                    sol.id_service_order_log,
                    sol.id_service_order,
                    sol.id_user,
                    sol.log,
                    sol.i_type,
                    sol.dt_register,
                    u.name as user_name
                FROM service_order_logs sol
                INNER JOIN users u ON sol.id_user = u.id_user
                WHERE sol.id_service_order = ?
                AND sol.i_type = 1
                AND sol.i_status = 1
                ORDER BY sol.dt_register DESC
            `;
            const logs = await this.db.select(query, [id_service_order]);

            return {
                ok: true,
                data: logs,
                message: "Logs obtenidos exitosamente"
            };
        } catch (error) {
            throw error;
        }
    }

    /**
     * Obtener logs visibles de un ticket (i_type = 1)
     */
    async getTicketLogs(id_ticket: number, id_client: number) {
        try {
            // Verificar que el ticket pertenece al cliente
            const exists = await this.db.select(`
                SELECT st.id_ticket
                FROM service_tickets st
                INNER JOIN service_orders so ON st.id_service_order = so.id_service_order
                WHERE st.id_ticket = ? AND so.id_client = ?
            `, [id_ticket, id_client]);

            if (exists.length === 0) {
                return {
                    ok: false,
                    data: [],
                    message: "Ticket no encontrado"
                };
            }

            const query = `
                SELECT
                    tl.id_ticket_log,
                    tl.id_ticket,
                    tl.id_user,
                    tl.log,
                    tl.i_type,
                    tl.dt_register,
                    u.name as user_name
                FROM ticket_logs tl
                INNER JOIN users u ON tl.id_user = u.id_user
                WHERE tl.id_ticket = ?
                AND tl.i_type = 1
                AND tl.i_status = 1
                ORDER BY tl.dt_register DESC
            `;
            const logs = await this.db.select(query, [id_ticket]);

            return {
                ok: true,
                data: logs,
                message: "Logs obtenidos exitosamente"
            };
        } catch (error) {
            throw error;
        }
    }
}

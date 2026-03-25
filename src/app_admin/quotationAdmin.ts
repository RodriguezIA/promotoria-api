import db from '../config/database';
import { Database } from '../core/database';
import { Utils } from '../core/utils';
import {
    IQuotation,
    ICreateQuotationPayload,
    IUpdateQuotationPayload,
    IQuotationProductPayload,
    IQuotationQuestionPayload,
    QuotationStatus,
    LogType
} from '../core/interfaces/quotation';

export class QuotationAdmin {
    protected db: Database = db;

    constructor() {}

    // ==================== CRUD COTIZACIONES ====================

    /**
     * Crear una nueva cotización (template)
     */
    async createQuotation(id_user: number, payload: ICreateQuotationPayload) {
        let commit = false;
        try {
            if (!this.db.inTransaction) {
                await this.db.beginTransaction();
                commit = true;
            }

            // Insertar cotización principal
            const query = `
                INSERT INTO quotations (id_client, quotation_name, i_status)
                VALUES (?, ?, 1)
            `;
            const result = await this.db.execute(query, [
                payload.id_client,
                payload.quotation_name
            ]);

            const id_quotation = result.insertId;

            // Insertar productos si los hay
            if (payload.products && payload.products.length > 0) {
                await this.insertQuotationProducts(id_quotation, payload.products);
            }

            // Insertar preguntas si las hay
            if (payload.questions && payload.questions.length > 0) {
                await this.insertQuotationQuestions(id_quotation, payload.questions);
            }

            // Insertar establecimientos si los hay
            if (payload.stores && payload.stores.length > 0) {
                await this.insertQuotationStores(id_quotation, payload.stores);
            }

            // Recalcular totales
            await this.recalculateTotals(id_quotation);

            // Registrar log
            await Utils.registerQuotationLog(this.db, id_quotation, id_user, 'Cotización creada', 1);

            if (commit) {
                await this.db.commit();
            }

            return {
                ok: true,
                id: id_quotation,
                message: "Cotización creada exitosamente"
            };
        } catch (error) {
            if (commit) {
                await this.db.rollback();
            }
            throw error;
        }
    }

    /**
     * Obtener cotizaciones de un cliente
     */
    async getQuotationsForClient(id_client: number) {
        try {
            const query = `
                SELECT
                    q.id_quotation,
                    q.id_client,
                    q.quotation_name,
                    q.total_price,
                    q.total_establishments,
                    q.total_tickets,
                    q.i_status,
                    q.dt_register,
                    q.dt_updated,
                    (SELECT COUNT(*) FROM quotation_products qp WHERE qp.id_quotation = q.id_quotation AND qp.i_status = 1) as products_count,
                    (SELECT COUNT(*) FROM quotation_questions qq WHERE qq.id_quotation = q.id_quotation AND qq.i_status = 1) as questions_count
                FROM quotations q
                WHERE q.id_client = ?
                AND q.i_status != 0
                ORDER BY q.dt_updated DESC
            `;
            return await this.db.select(query, [id_client]);
        } catch (error) {
            throw error;
        }
    }

    /**
     * Obtener detalle completo de una cotización
     */
    async getQuotationById(id_quotation: number, id_client: number) {
        try {
            // Obtener cotización base
            const query = `
                SELECT
                    q.id_quotation,
                    q.id_client,
                    q.quotation_name,
                    q.total_price,
                    q.total_establishments,
                    q.total_tickets,
                    q.i_status,
                    q.dt_register,
                    q.dt_updated
                FROM quotations q
                WHERE q.id_quotation = ?
                AND q.id_client = ?
                AND q.i_status != 0
            `;
            const result = await this.db.select(query, [id_quotation, id_client]);

            if (result.length === 0) {
                return {
                    ok: false,
                    data: null,
                    message: "Cotización no encontrada"
                };
            }

            const quotation = result[0];

            // Obtener productos
            quotation.products = await this.getQuotationProducts(id_quotation);

            // Obtener preguntas
            quotation.questions = await this.getQuotationQuestions(id_quotation);

            // Obtener establecimientos
            quotation.stores = await this.getQuotationStores(id_quotation);

            return {
                ok: true,
                data: quotation,
                message: "Cotización obtenida exitosamente"
            };
        } catch (error) {
            throw error;
        }
    }

    /**
     * Actualizar una cotización
     */
    async updateQuotation(
        id_quotation: number,
        id_client: number,
        id_user: number,
        payload: IUpdateQuotationPayload
    ) {
        let commit = false;
        try {
            if (!this.db.inTransaction) {
                await this.db.beginTransaction();
                commit = true;
            }

            // Verificar que la cotización existe y pertenece al cliente
            const existing = await this.db.select(
                "SELECT id_quotation, i_status FROM quotations WHERE id_quotation = ? AND id_client = ? AND i_status != 0",
                [id_quotation, id_client]
            );

            if (existing.length === 0) {
                throw new Error("Cotización no encontrada");
            }

            const changes: string[] = [];

            // Actualizar nombre si se proporciona
            if (payload.quotation_name !== undefined) {
                await this.db.execute(
                    "UPDATE quotations SET quotation_name = ? WHERE id_quotation = ?",
                    [payload.quotation_name, id_quotation]
                );
                changes.push('nombre actualizado');
            }

            // Actualizar estado si se proporciona
            if (payload.i_status !== undefined) {
                await this.db.execute(
                    "UPDATE quotations SET i_status = ? WHERE id_quotation = ?",
                    [payload.i_status, id_quotation]
                );
                changes.push(`estado: ${payload.i_status}`);
            }

            // Reemplazar productos si se proporcionan
            if (payload.products !== undefined) {
                await this.deleteQuotationProducts(id_quotation);
                if (payload.products.length > 0) {
                    await this.insertQuotationProducts(id_quotation, payload.products);
                }
                changes.push(`productos: ${payload.products.length}`);
            }

            // Reemplazar preguntas si se proporcionan
            if (payload.questions !== undefined) {
                await this.deleteQuotationQuestions(id_quotation);
                if (payload.questions.length > 0) {
                    await this.insertQuotationQuestions(id_quotation, payload.questions);
                }
                changes.push(`preguntas: ${payload.questions.length}`);
            }

            // Reemplazar establecimientos si se proporcionan
            if (payload.stores !== undefined) {
                await this.deleteQuotationStores(id_quotation);
                if (payload.stores.length > 0) {
                    await this.insertQuotationStores(id_quotation, payload.stores);
                }
                changes.push(`establecimientos: ${payload.stores.length}`);
            }

            // Recalcular totales
            await this.recalculateTotals(id_quotation);

            // Registrar log
            if (changes.length > 0) {
                await Utils.registerQuotationLog(this.db, id_quotation, id_user, `Cotización actualizada: ${changes.join(', ')}`, 1);
            }

            if (commit) {
                await this.db.commit();
            }

            return {
                ok: true,
                message: "Cotización actualizada exitosamente"
            };
        } catch (error) {
            if (commit) {
                await this.db.rollback();
            }
            throw error;
        }
    }

    /**
     * Eliminar cotización (soft delete)
     */
    async deleteQuotation(id_quotation: number, id_client: number, id_user: number) {
        try {
            const result = await this.db.execute(
                "UPDATE quotations SET i_status = 0 WHERE id_quotation = ? AND id_client = ?",
                [id_quotation, id_client]
            );

            if (result.affectedRows === 0) {
                return {
                    ok: false,
                    message: "Cotización no encontrada"
                };
            }

            await Utils.registerQuotationLog(this.db, id_quotation, id_user, 'Cotización eliminada', 1);

            return {
                ok: true,
                message: "Cotización eliminada exitosamente"
            };
        } catch (error) {
            throw error;
        }
    }

    // ==================== PRODUCTOS ====================

    private async insertQuotationProducts(id_quotation: number, products: IQuotationProductPayload[]) {
        for (const product of products) {
            const query = `
                INSERT INTO quotation_products (id_quotation, id_product, quantity, product_price)
                VALUES (?, ?, ?, ?)
            `;
            await this.db.execute(query, [
                id_quotation,
                product.id_product,
                product.quantity ?? null,
                product.product_price ?? null
            ]);
        }
    }

    private async deleteQuotationProducts(id_quotation: number) {
        await this.db.execute(
            "DELETE FROM quotation_products WHERE id_quotation = ?",
            [id_quotation]
        );
    }

    private async getQuotationProducts(id_quotation: number) {
        const query = `
            SELECT
                qp.id_quotation_product,
                qp.id_quotation,
                qp.id_product,
                qp.quantity,
                qp.product_price,
                qp.i_status,
                qp.dt_register,
                p.name as product_name,
                p.sku,
                p.description
            FROM quotation_products qp
            INNER JOIN products p ON qp.id_product = p.id_product
            WHERE qp.id_quotation = ? AND qp.i_status = 1
        `;
        return await this.db.select(query, [id_quotation]);
    }

    // ==================== PREGUNTAS ====================

    private async insertQuotationQuestions(id_quotation: number, questions: IQuotationQuestionPayload[]) {
        for (const question of questions) {
            const query = `
                INSERT INTO quotation_questions (id_quotation, id_question_client, question_price)
                VALUES (?, ?, ?)
            `;
            await this.db.execute(query, [
                id_quotation,
                question.id_question_client,
                question.question_price
            ]);
        }
    }

    private async deleteQuotationQuestions(id_quotation: number) {
        await this.db.execute(
            "DELETE FROM quotation_questions WHERE id_quotation = ?",
            [id_quotation]
        );
    }

    private async getQuotationQuestions(id_quotation: number) {
        const query = `
            SELECT
                qq.id_quotation_question,
                qq.id_quotation,
                qq.id_question_client,
                qq.question_price,
                qq.i_status,
                qq.dt_register,
                qc.id_question,
                q.question as question_text,
                q.question_type
            FROM quotation_questions qq
            INNER JOIN questions_client qc ON qq.id_question_client = qc.id_question_client
            INNER JOIN questions q ON qc.id_question = q.id_question
            WHERE qq.id_quotation = ? AND qq.i_status = 1
        `;
        return await this.db.select(query, [id_quotation]);
    }

    // ==================== ESTABLECIMIENTOS ====================

    private async insertQuotationStores(id_quotation: number, stores: number[]) {
        for (const id_store of stores) {
            const query = `
                INSERT INTO quotation_stores (id_quotation, id_store)
                VALUES (?, ?)
            `;
            await this.db.execute(query, [id_quotation, id_store]);
        }
    }

    private async deleteQuotationStores(id_quotation: number) {
        await this.db.execute(
            "DELETE FROM quotation_stores WHERE id_quotation = ?",
            [id_quotation]
        );
    }

    private async getQuotationStores(id_quotation: number) {
        const query = `
            SELECT
                qs.id_quotation_store,
                qs.id_quotation,
                qs.id_store,
                qs.i_status,
                qs.dt_register,
                s.name as store_name,
                s.store_code,
                s.municipality,
                s.state
            FROM quotation_stores qs
            INNER JOIN stores s ON qs.id_store = s.id_store
            WHERE qs.id_quotation = ? AND qs.i_status = 1
        `;
        return await this.db.select(query, [id_quotation]);
    }

    // ==================== CÁLCULOS ====================

    /**
     * Recalcular totales de la cotización
     */
    private async recalculateTotals(id_quotation: number) {
        // Calcular precio por ticket (suma de precios de preguntas)
        const priceResult = await this.db.select(`
            SELECT COALESCE(SUM(question_price), 0) as price_per_ticket
            FROM quotation_questions
            WHERE id_quotation = ? AND i_status = 1
        `, [id_quotation]);

        const pricePerTicket = priceResult[0]?.price_per_ticket || 0;

        // Contar establecimientos
        const storeResult = await this.db.select(`
            SELECT COUNT(*) as total_stores
            FROM quotation_stores
            WHERE id_quotation = ? AND i_status = 1
        `, [id_quotation]);

        const totalStores = storeResult[0]?.total_stores || 0;

        // Calcular total
        const totalPrice = pricePerTicket * totalStores;
        const totalTickets = totalStores; // 1 ticket por establecimiento

        // Actualizar cotización
        await this.db.execute(`
            UPDATE quotations
            SET total_price = ?,
                total_establishments = ?,
                total_tickets = ?
            WHERE id_quotation = ?
        `, [totalPrice, totalStores, totalTickets, id_quotation]);
    }

    /**
     * Obtener resumen de precios (preview antes de confirmar)
     */
    async getQuotationPricePreview(id_quotation: number, id_client: number) {
        try {
            const quotation = await this.getQuotationById(id_quotation, id_client);

            if (!quotation.ok || !quotation.data) {
                return quotation;
            }

            const data = quotation.data;

            // Calcular precio por ticket
            const pricePerTicket = data.questions.reduce(
                (sum: number, q: any) => sum + parseFloat(q.question_price || 0),
                0
            );

            return {
                ok: true,
                data: {
                    quotation_name: data.quotation_name,
                    products_count: data.products.length,
                    questions_count: data.questions.length,
                    stores_count: data.stores.length,
                    price_per_ticket: pricePerTicket,
                    total_tickets: data.stores.length,
                    total_price: pricePerTicket * data.stores.length,
                    questions_detail: data.questions.map((q: any) => ({
                        question: q.question_text,
                        price: q.question_price
                    })),
                    stores_detail: data.stores.map((s: any) => ({
                        name: s.store_name,
                        location: `${s.municipality}, ${s.state}`
                    }))
                },
                message: "Preview de cotización generado"
            };
        } catch (error) {
            throw error;
        }
    }

    // ==================== LOGS VISIBLES ====================

    /**
     * Obtener logs visibles de una cotización (i_type = 1)
     */
    async getQuotationLogs(id_quotation: number, id_client: number) {
        try {
            // Verificar que la cotización pertenece al cliente
            const exists = await this.db.select(
                "SELECT id_quotation FROM quotations WHERE id_quotation = ? AND id_client = ?",
                [id_quotation, id_client]
            );

            if (exists.length === 0) {
                return {
                    ok: false,
                    data: [],
                    message: "Cotización no encontrada"
                };
            }

            const query = `
                SELECT
                    ql.id_quotation_log,
                    ql.id_quotation,
                    ql.id_user,
                    ql.log,
                    ql.i_type,
                    ql.dt_register,
                    u.name as user_name
                FROM quotation_logs ql
                INNER JOIN users u ON ql.id_user = u.id_user
                WHERE ql.id_quotation = ?
                AND ql.i_type = 1
                AND ql.i_status = 1
                ORDER BY ql.dt_register DESC
            `;
            const logs = await this.db.select(query, [id_quotation]);

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

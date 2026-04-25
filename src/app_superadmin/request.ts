import db from "../config/database";
import { Database } from "../core/database";
import { Utils } from "../core/utils";

// Interfaces basadas en el payload JSON del frontend
interface QuestionPayload {
    id_pregunta: number;
    precio_aplicado: number;
}

interface ProductPayload {
    id_product: number;
    subtotal: number;
    preguntas: QuestionPayload[];
}

interface CreateRequestData {
    id_user: number;
    id_cliente: number;
    nombre_solicitud: string;
    costo_total: number;
    productos: ProductPayload[];
}

export class Request {
    private db: Database = db;

    constructor() {}

    // 1. CREAR SOLICITUD (Con Transacciones para las 3 tablas)
    async createRequest(data: CreateRequestData) {
        let commit = false;
        try {
            if (!this.db.inTransaction) {
                await this.db.beginTransaction();
                commit = true;
            }

            // Paso 1: Insertar la cabecera de la solicitud (requests)
            const queryRequest = `INSERT INTO requests (id_user, id_client, vc_name, f_value, dt_register, dt_update, id_status) VALUES (?, ?, ?, ?, NOW(), NOW(), 1)`;
            const resultRequest = await this.db.execute(queryRequest, [
                data.id_user,
                data.id_cliente,
                data.nombre_solicitud,
                data.costo_total
            ]);
            
            const idRequest = resultRequest.insertId;

            // Paso 2: Iterar e insertar los productos (request_products)
            for (const prod of data.productos) {
                const queryProduct = `INSERT INTO request_products (id_request, id_product, f_subtotal, dt_register, dt_update, b_active) VALUES (?, ?, ?, NOW(), NOW(), 1)`;
                const resultProduct = await this.db.execute(queryProduct, [
                    idRequest,
                    prod.id_product,
                    prod.subtotal
                ]);

                const idRequestProduct = resultProduct.insertId;

                // Paso 3: Iterar e insertar las preguntas de este producto (request_product_questions)
                for (const preg of prod.preguntas) {
                    const queryQuestion = `INSERT INTO request_product_questions (id_request_product, id_question, f_value, dt_register, dt_update, b_active) VALUES (?, ?, ?, NOW(), NOW(), 1)`;
                    await this.db.execute(queryQuestion, [
                        idRequestProduct,
                        preg.id_pregunta,
                        preg.precio_aplicado
                    ]);
                }
            }

            if (commit) {
                await this.db.commit();
            }


            return {
                id: idRequest,
                message: "Solicitud creada exitosamente con todos sus productos y preguntas"
            };
        } catch (error) {
            if (commit) {
                await this.db.rollback();
            }
            console.error("Error en createRequest: ", error);
            throw error;
        }
    }

    // 2. OBTENER SOLICITUDES POR CLIENTE
    async getRequestsByClient(id_client: number) {
        try {
            const query = `
                SELECT id_request, id_user, vc_name, f_value, dt_register, dt_update, id_status 
                FROM requests 
                WHERE id_client = ? AND id_status != 0 
                ORDER BY dt_register DESC
            `;
            return await this.db.select(query, [id_client]);
        } catch (error) {
            console.error("Error en getRequestsByClient: ", error);
            throw error;
        }
    }

    // 3. OBTENER DETALLE COMPLETO DE UNA SOLICITUD (Cabecera, Productos y Preguntas)
    async getRequestById(id_request: number) {
        try {
            // Obtener la cabecera
            const queryReq = `SELECT * FROM requests WHERE id_request = ?`;
            const requests = await this.db.select(queryReq, [id_request]);
            
            if (requests.length === 0) return null;
            const requestData = requests[0];

            // Obtener los productos de la solicitud
            const queryProds = `
                SELECT id_request_product, id_product, f_subtotal 
                FROM request_products 
                WHERE id_request = ? AND b_active = 1
            `;
            const products = await this.db.select(queryProds, [id_request]);

            // Obtener las preguntas para cada producto
            for (let prod of products) {
                const queryQuestions = `
                    SELECT id_question, vc_question, f_value as precio_aplicado
                    FROM request_product_questions 
                    WHERE id_request_product = ? AND b_active = 1
                `;
                prod.preguntas = await this.db.select(queryQuestions, [prod.id_request_product]);
            }

            requestData.productos = products;
            return requestData;

        } catch (error) {
            console.error("Error en getRequestById: ", error);
            throw error;
        }
    }

    // ACTUALIZACIÓN COMPLETA (Nombre, Total, Productos y Preguntas)
    async updateFullRequest(id_request: number, data: CreateRequestData) {
        let commit = false;
        try {
            if (!this.db.inTransaction) {
                await this.db.beginTransaction();
                commit = true;
            }

            // 1. Actualizar la cabecera (requests)
            const queryUpdateReq = `
                UPDATE requests 
                SET vc_name = ?, f_value = ?, dt_update = NOW() 
                WHERE id_request = ?
            `;
            await this.db.execute(queryUpdateReq, [
                data.nombre_solicitud, 
                data.costo_total, 
                id_request
            ]);

            // 2. Dar de baja lógica a las PREGUNTAS anteriores de esta solicitud
            const queryDesactivarPreguntas = `
                UPDATE request_product_questions rpq
                JOIN request_products rp ON rpq.id_request_product = rp.id_request_product
                SET rpq.b_active = 0, rpq.dt_update = NOW()
                WHERE rp.id_request = ?
            `;
            await this.db.execute(queryDesactivarPreguntas, [id_request]);

            // 3. Dar de baja lógica a los PRODUCTOS anteriores de esta solicitud
            const queryDesactivarProductos = `
                UPDATE request_products 
                SET b_active = 0, dt_update = NOW() 
                WHERE id_request = ?
            `;
            await this.db.execute(queryDesactivarProductos, [id_request]);

            // 4. Insertar la nueva configuración de productos (Idéntico a Create)
            for (const prod of data.productos) {
                const queryProduct = `
                    INSERT INTO request_products (id_request, id_product, f_subtotal, dt_register, dt_update, b_active) 
                    VALUES (?, ?, ?, NOW(), NOW(), 1)
                `;
                const resultProduct = await this.db.execute(queryProduct, [
                    id_request,
                    prod.id_product,
                    prod.subtotal
                ]);

                const idRequestProduct = resultProduct.insertId;

                // 5. Insertar la nueva configuración de preguntas
                for (const preg of prod.preguntas) {
                    const queryQuestion = `
                        INSERT INTO request_product_questions (id_request_product, id_question, f_value, dt_register, dt_update, b_active) 
                        VALUES (?, ?, ?, NOW(), NOW(), 1)
                    `;
                    await this.db.execute(queryQuestion, [
                        idRequestProduct,
                        preg.id_pregunta,
                        preg.precio_aplicado
                    ]);
                }
            }

            if (commit) {
                await this.db.commit();
            }

            return { success: true, message: "Solicitud y productos actualizados exitosamente" };
        } catch (error) {
            if (commit) {
                await this.db.rollback();
            }
            console.error("Error en updateFullRequest: ", error);
            throw error;
        }
    }

    // 5. ELIMINAR SOLICITUD (Borrado lógico)
    async deleteRequest(id_request: number) {
        let commit = false;
        try {
            if (!this.db.inTransaction) {
                await this.db.beginTransaction();
                commit = true;
            }

            // Borrado lógico de la cabecera
            const queryReq = `UPDATE requests SET id_status = 0, dt_update = NOW() WHERE id_request = ?`;
            await this.db.execute(queryReq, [id_request]);

            // Borrado lógico de los productos en cascada
            const queryProd = `UPDATE request_products SET b_active = 0, dt_update = NOW() WHERE id_request = ?`;
            await this.db.execute(queryProd, [id_request]);

            if (commit) {
                await this.db.commit();
            }

            return { success: true, message: "Solicitud eliminada exitosamente" };
        } catch (error) {
            if (commit) {
                await this.db.rollback();
            }
            console.error("Error en deleteRequest: ", error);
            throw error;
        }
    }
}
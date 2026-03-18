import db from "../config/database";
import { Database } from "../core/database";

interface CreateOrderPayload {
    id_user: number;
    id_client: number;
    id_request: number;
    stores: number[];
}

export class Order {
    private db: Database = db;

    constructor() {}

    async createOrder(data: CreateOrderPayload) {
        let commit = false;
        try {
            if (!this.db.inTransaction) {
                await this.db.beginTransaction();
                commit = true;
            }

            // 1. Obtener el precio de la solicitud base para calcular el gran total
            const queryReq = `SELECT f_value FROM requests WHERE id_request = ?`;
            const reqData = await this.db.select(queryReq, [data.id_request]);
            
            if (reqData.length === 0) {
                throw new Error("La solicitud base no existe.");
            }

            const requestPrice = reqData[0].f_value;
            const orderTotal = requestPrice * data.stores.length;

            // 2. Insertar el Pedido (Order)
            const queryOrder = `
                INSERT INTO orders (id_user, id_client, id_request, f_total, dt_register, dt_update, id_status) 
                VALUES (?, ?, ?, ?, NOW(), NOW(), 1)
            `;
            const resultOrder = await this.db.execute(queryOrder, [
                data.id_user,
                data.id_client,
                data.id_request,
                orderTotal
            ]);
            
            const idOrder = resultOrder.insertId;

            // 3. Crear una Tarea (Task) por cada tienda seleccionada
            for (const id_store of data.stores) {
                const queryTask = `
                    INSERT INTO tasks (id_order, id_store, dt_register, dt_update, id_status) 
                    VALUES (?, ?, NOW(), NOW(), 1)
                `;
                await this.db.execute(queryTask, [idOrder, id_store]);
            }

            if (commit) {
                await this.db.commit();
            }

            return {
                id_order: idOrder,
                total_tasks: data.stores.length,
                total_price: orderTotal,
                message: "Order y Tareas creadas exitosamente"
            };
        } catch (error) {
            if (commit) {
                await this.db.rollback();
            }
            console.error("Error en createOrder: ", error);
            throw error;
        }
    }

    async getOrdersByClient(id_client: number) {
        try {
            const query = `
                SELECT o.id_order, o.id_user, o.id_client, o.id_request, o.f_total, 
                       o.dt_register, o.dt_update, o.id_status,
                       r.vc_name as request_name,
                       (SELECT COUNT(*) FROM tasks t WHERE t.id_order = o.id_order) as total_tasks
                FROM orders o
                JOIN requests r ON o.id_request = r.id_request
                WHERE o.id_client = ? AND o.id_status != 0 
                ORDER BY o.dt_register DESC
            `;
            return await this.db.select(query, [id_client]);
        } catch (error) {
            console.error("Error en getOrdersByClient: ", error);
            throw error;
        }
    }

    // OBTENER DETALLE DEL PEDIDO Y SUS TAREAS
    async getOrderById(id_order: number) {
        try {
            // 1. Obtener la cabecera del pedido
            const queryOrder = `
                SELECT o.*, r.vc_name as request_name
                FROM orders o
                JOIN requests r ON o.id_request = r.id_request
                WHERE o.id_order = ?
            `;
            const orders = await this.db.select(queryOrder, [id_order]);
            
            if (orders.length === 0) return null;
            const orderData = orders[0];

            // 2. Obtener las tareas asociadas a este pedido (Cruzando con tiendas y usuarios/promotores)
            const queryTasks = `
                SELECT t.id_task, t.id_store, t.id_promoter, t.dt_register, t.id_status,
                    s.name as store_name, s.street, s.neighborhood, s.ext_number,
                    p.vc_name as promoter_name -- <-- Cambiamos a la tabla promoters (p)
                FROM tasks t
                JOIN stores s ON t.id_store = s.id_store
                LEFT JOIN promoters p ON t.id_promoter = p.id_promoter -- <-- El JOIN ahora es con promoters
                WHERE t.id_order = ?
                ORDER BY t.dt_register ASC
            `;
            const tasks = await this.db.select(queryTasks, [id_order]);

            // Adjuntamos las tareas al objeto del pedido
            orderData.tasks = tasks;
            
            return orderData;
        } catch (error) {
            console.error("Error en getOrderById: ", error);
            throw error;
        }
    }

    async rejectTask(id_task: number) {
        try {
            const rows = await this.db.select(
                `SELECT id_task FROM tasks WHERE id_task = ? AND id_status = 5`,
                [id_task]
            );
            if (rows.length === 0) {
                throw new Error("La tarea no existe o no está en estatus 5 (enviada a validación)");
            }
            await this.db.execute(
                `UPDATE tasks SET id_status = 7, dt_update = NOW() WHERE id_task = ?`,
                [id_task]
            );
            return { success: true, message: "Tarea rechazada correctamente" };
        } catch (error) {
            console.error("Error en rejectTask: ", error);
            throw error;
        }
    }

    async assignPromoterToTask(id_task: number, id_promoter: number) {
        try {
            // Actualizamos el promotor y podemos cambiar el estatus a 2 (En progreso/Asignado) si lo deseas
            const query = `
                UPDATE tasks 
                SET id_promoter = ?, dt_update = NOW() 
                WHERE id_task = ?
            `;
            await this.db.execute(query, [id_promoter, id_task]);
            
            return { success: true, message: "Promotor asignado correctamente" };
        } catch (error) {
            console.error("Error en assignPromoterToTask: ", error);
            throw error;
        }
    }
}
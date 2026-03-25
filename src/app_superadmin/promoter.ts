import db from "../config/database";
import { Database } from "../core/database";
import { Utils } from "../core/utils";

export interface CreatePromoterData {
    vc_name: string;
    vc_email: string;
    vc_password: string;
    vc_phone: string; // Ahora es obligatorio
}

export interface UpdatePromoterData {
    vc_name?: string;
    vc_phone?: string;
    b_active?: boolean;
}

export class Promoter {
    private db: Database = db;

    constructor() {}

    // 1. CREAR PROMOTOR
    async createPromoter(data: CreatePromoterData) {
        try {
            // Verificar si el TELÉFONO ya existe (ahora es la llave principal)
            const checkQuery = `SELECT id_promoter FROM promoters WHERE vc_phone = ?`;
            const existing = await this.db.select(checkQuery, [data.vc_phone]);
            
            if (existing.length > 0) {
                throw new Error("Este número de teléfono ya está registrado.");
            }

            // Contraseña en texto plano temporalmente (sin bcrypt)
            const passwordToSave = data.vc_password; 

            const query = `
                INSERT INTO promoters (vc_name, vc_email, vc_password, vc_phone, dt_register, b_active) 
                VALUES (?, ?, ?, ?, NOW(), 1)
            `;
            
            const result = await this.db.execute(query, [
                data.vc_name,
                data.vc_email,
                passwordToSave,
                data.vc_phone
            ]);

            await Utils.registerPromoterLog(this.db, result.insertId, 0, `Promotor creado: ${data.vc_name}`);
            return {
                id_promoter: result.insertId,
                message: "Promotor creado exitosamente"
            };
        } catch (error) {
            console.error("Error en createPromoter: ", error);
            throw error;
        }
    }

    async loginPromoter(vc_phone: string, vc_password: string, vc_fcm_token: string | null, f_latitude?: number | null, f_longitude?: number | null) {
        try {
            // Buscar por teléfono
            const query = `SELECT * FROM promoters WHERE vc_phone = ? AND b_active = 1`;
            const promoters = await this.db.select(query, [vc_phone]);

            if (promoters.length === 0) {
                throw new Error("Teléfono o contraseña incorrectos.");
            }

            const promoter = promoters[0];

            // Validar contraseña en texto plano
            if (promoter.vc_password !== vc_password) {
                throw new Error("Teléfono o contraseña incorrectos.");
            }

            // Actualizar Token FCM, ubicación y Último Login
            const updateQuery = `
                UPDATE promoters
                SET vc_fcm_token = ?, dt_last_login = NOW(), f_latitude = ?, f_longitude = ?
                WHERE id_promoter = ?
            `;
            await this.db.execute(updateQuery, [vc_fcm_token, f_latitude ?? null, f_longitude ?? null, promoter.id_promoter]);

            // Limpiamos la contraseña antes de devolver los datos por seguridad
            delete promoter.vc_password;
            
            // Retornamos los datos actualizados
            promoter.vc_fcm_token = vc_fcm_token;

            return promoter;
        } catch (error) {
            console.error("Error en loginPromoter: ", error);
            throw error;
        }
    }

    // 2. OBTENER TODOS LOS PROMOTORES (Para los Selects de asignación)
    async getAllPromoters() {
        try {
            const query = `
                SELECT id_promoter, vc_name, vc_email, vc_phone, dt_register, b_active 
                FROM promoters 
                WHERE b_active = 1 
                ORDER BY vc_name ASC
            `;
            return await this.db.select(query);
        } catch (error) {
            console.error("Error en getAllPromoters: ", error);
            throw error;
        }
    }

    // 3. OBTENER DETALLE DE UN PROMOTOR
    async getPromoterById(id_promoter: number) {
        try {
            const query = `
                SELECT id_promoter, vc_name, vc_email, vc_phone, dt_register, b_active 
                FROM promoters 
                WHERE id_promoter = ?
            `;
            const promoters = await this.db.select(query, [id_promoter]);
            return promoters.length > 0 ? promoters[0] : null;
        } catch (error) {
            console.error("Error en getPromoterById: ", error);
            throw error;
        }
    }

    // 4. ACTUALIZAR PROMOTOR
    async updatePromoter(id_promoter: number, data: UpdatePromoterData) {
        try {
            const fields: string[] = [];
            const values: any[] = [];

            if (data.vc_name !== undefined) {
                fields.push("vc_name = ?");
                values.push(data.vc_name);
            }
            if (data.vc_phone !== undefined) {
                fields.push("vc_phone = ?");
                values.push(data.vc_phone);
            }
            if (data.b_active !== undefined) {
                fields.push("b_active = ?");
                values.push(data.b_active ? 1 : 0);
            }

            if (fields.length === 0) {
                return { success: false, message: "No hay campos para actualizar" };
            }

            values.push(id_promoter);

            const query = `UPDATE promoters SET ${fields.join(", ")} WHERE id_promoter = ?`;
            await this.db.execute(query, values);
            await Utils.registerPromoterLog(this.db, id_promoter, 0, "Promotor actualizado");
            return { success: true, message: "Promotor actualizado exitosamente" };
        } catch (error) {
            console.error("Error en updatePromoter: ", error);
            throw error;
        }
    }

    // 5. ELIMINAR PROMOTOR (Borrado lógico)
    async deletePromoter(id_promoter: number) {
        try {
            const query = `UPDATE promoters SET b_active = 0 WHERE id_promoter = ?`;
            await this.db.execute(query, [id_promoter]);
            await Utils.registerPromoterLog(this.db, id_promoter, 0, "Promotor dado de baja (borrado lógico)");
            return { success: true, message: "Promotor dado de baja exitosamente" };
        } catch (error) {
            console.error("Error en deletePromoter: ", error);
            throw error;
        }
    }
}
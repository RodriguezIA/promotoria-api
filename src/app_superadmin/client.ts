import db from "../config/database";
import { Database } from "../core/database";
import { Utils } from "../core/utils";
import { RowDataPacket } from "mysql2/promise";

interface CreateClientData {
    rfc?: string;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
    zip?: string;
    adiccional_notes?: string;
}

interface TotalRow extends RowDataPacket {
  total: number;
}

interface PromoterHeatmapRow extends RowDataPacket {
  id_promoter: number;
  vc_name: string;
  dc_latitude: number;
  dc_longitude: number;
}


export class Client {
    private db: Database = db;

    constructor(){}

    async createClient(id_user: number, name: string, data: CreateClientData = {}) {
        let commit = false;
        try {
            if(!this.db.inTransaction){
                this.db.beginTransaction();
                commit = true;
            }

            const fields = ['id_user', 'name'];
            const values: any[] = [id_user, name];
            const placeholders = ['?', '?'];

            const optionalFields: (keyof CreateClientData)[] = [
                'rfc', 'email', 'phone', 'address', 'city', 'adiccional_notes'
            ];

            for (const field of optionalFields) {
                if (data[field] !== undefined && data[field] !== '') {
                    fields.push(field);
                    values.push(data[field]);
                    placeholders.push('?');
                }
            }

            const query = `INSERT INTO clients (${fields.join(', ')}) VALUES (${placeholders.join(', ')})`;
            const result = await this.db.execute(query, values);

            const clientId = result.insertId;

            await Utils.registerClienteLog(this.db, clientId, id_user, "Cliente creado");

            if(commit){
                await this.db.commit();
            }

            return {
                id: clientId,
                message: "Cliente creado exitosamente"
            };
        } catch (error) {
            console.error("Error en createClient: ", error);
            if (commit) {
                await this.db.rollback();
            }
            throw error;
        }
    }

    async getClients() {
        try {
            const query = `SELECT id_client, name, i_status, dt_register, dt_updated, rfc, email, phone FROM clients`;
            const clients = await this.db.select(query);
            return clients;
        } catch (error) {
            console.error("Error en getClients: ", error);
            throw error;
        }
    }

    async getClientById(id_client: number) {
        try {
            const query = `SELECT id_client, id_user, name, i_status, dt_register, dt_updated, rfc, email, phone, address, city, adiccional_notes FROM clients WHERE id_client = ?`;
            const clients = await this.db.select(query, [id_client]);
            return clients.length > 0 ? clients[0] : null;
        } catch (error) {
            console.error("Error en getClientById: ", error);
            throw error;
        }
    }

    async getDashboardAnalytics(dateFrom: string, dateTo: string) {
        try {
            const totalClientsResult = await this.db.select<TotalRow[]>(`SELECT COUNT(*) AS total FROM clients`);
            const totalClients = totalClientsResult[0]?.total || 0;

            const totalUsuriosPromotoresResult = await this.db.select<TotalRow[]>(`SELECT COUNT(DISTINCT id_promoter) AS total FROM promoters`);
            const totalUsuariosPromotores = totalUsuriosPromotoresResult[0]?.total || 0;

            const totalStoresResult = await this.db.select<TotalRow[]>(`SELECT COUNT(*) AS total FROM stores`);
            const totalStores = totalStoresResult[0]?.total || 0;

            const activeUsersPromotoersResult = await this.db.select<TotalRow[]>(`SELECT COUNT(DISTINCT id_promoter) AS total FROM promoters WHERE b_active = 1 AND dt_last_login BETWEEN ? AND ?`, [dateFrom, dateTo]);
            const activeUsersPromoters = activeUsersPromotoersResult[0]?.total || 0;

            const heatmapPromoters = await this.db.select<PromoterHeatmapRow[]>(
                `SELECT id_promoter, vc_name, f_latitude, f_longitude
                FROM promoters
                WHERE f_latitude IS NOT NULL AND f_longitude IS NOT NULL
                ORDER BY dt_last_login DESC
                LIMIT 100`
            );

            return {
                totalClients,
                totalUsuariosPromotores,
                totalStores,
                activeUsersPromoters,
                heatmapPromoters,
            };

        } catch (error) {
            console.error("Error en superAdminDashboard: ", error);
            throw error;
        }
    }
}
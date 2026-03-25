import db from "../config/database";
import { Database } from "../core/database";
import { Utils } from "../core/utils";
import { RowDataPacket } from "mysql2/promise";

export class Address {
    private db: Database = db;

    constructor(){}

    setDb(database: Database) {
        this.db = database;
    }

    async getAddressesList(entity_type: string, entity_id: number) {
        try {
            const query = `SELECT id, id_country, id_state, id_city, street, ext_number, int_number, neighborhood, postal_code, references, latitude, longitude 
                        FROM addresses 
                        WHERE entity_type = ? AND entity_id = ? AND is_active = 1`;
            const rows = await this.db.select<RowDataPacket[]>(query, [entity_type, entity_id]);
            return rows;
        } catch (error) {
            throw error;
        }
    }

    async createAddress(data: {
        entity_type: string;
        entity_id: number;
        id_country: number;
        id_state: number;
        id_city: number;
        street: string;
        ext_number: string;
        int_number?: string;
        neighborhood?: string;
        postal_code: string;
        address_references?: string;
        latitude?: number;
        longitude?: number;
    }) {
        try {
            const query = `INSERT INTO addresses (entity_type, entity_id, id_country, id_state, id_city, street, ext_number, int_number, neighborhood, postal_code, address_references, latitude, longitude)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
            const result = await this.db.query(query, [
                data.entity_type, data.entity_id, data.id_country, data.id_state, data.id_city,
                data.street, data.ext_number, data.int_number ?? null, data.neighborhood ?? null,
                data.postal_code, data.address_references ?? null, data.latitude ?? null, data.longitude ?? null
            ]);
            return result;
        } catch (error) {
            throw error;
        }
    }

    async updateAddress(id: number, data: {
        id_country: number;
        id_state: number;
        id_city: number;
        street: string;
        ext_number: string;
        int_number?: string;
        neighborhood?: string;
        postal_code: string;
        references?: string;
        latitude?: number;
        longitude?: number;
    }) {
        try {
            const query = `UPDATE addresses SET id_country = ?, id_state = ?, id_city = ?, street = ?, ext_number = ?, int_number = ?, neighborhood = ?, postal_code = ?, references = ?, latitude = ?, longitude = ?
                        WHERE id = ? AND is_active = 1`;
            const result = await this.db.query(query, [
                data.id_country, data.id_state, data.id_city,
                data.street, data.ext_number, data.int_number ?? null, data.neighborhood ?? null,
                data.postal_code, data.references ?? null, data.latitude ?? null, data.longitude ?? null,
                id
            ]);
            return result;
        } catch (error) {
            throw error;
        }
    }

    async deleteAddress(id: number) {
        try {
            const query = `UPDATE addresses SET is_active = 0 WHERE id = ?`;
            const result = await this.db.query(query, [id]);
            return result;
        } catch (error) {
            throw error;
        }
    }
}
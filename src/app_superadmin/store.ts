// models/Store.ts
import { IStore } from '../core/interfaces/store';
import db from '../config/database';
import { Database } from '../core/database';
import { Utils } from '../core/utils';

export class Store {
  protected db: Database = db;

  constructor() {}

  // ============ CRUD STORES ============

  async createStore(id_user: number, storeData: IStore) {
    let commit = false;
    try {
      if (!this.db.inTransaction) {
        await this.db.beginTransaction();
        commit = true;
      }

      const fields = ["id_user", "name", "i_status"];
      const values: any[] = [id_user, storeData.name, 1];
      const placeholders = ["?", "?", "?"];

      const optionalFields: (keyof IStore)[] = [
        "store_code", "street", "ext_number", "int_number",
        "neighborhood", "municipality", "state", "postal_code",
        "country", "latitude", "longitude"
      ];

      for (const field of optionalFields) {
        if (storeData[field] !== undefined && storeData[field] !== "") {
          fields.push(field);
          values.push(storeData[field]);
          placeholders.push("?");
        }
      }

      const query = `INSERT INTO stores (${fields.join(", ")}) VALUES (${placeholders.join(", ")})`;
      const result = await this.db.execute(query, values);
      if (commit) {
        await this.db.commit();
      }

      return {
        id: result.insertId,
        message: "Tienda creada exitosamente"
      };
    } catch (error) {
      console.error("Error en createStore: ", error);
      if (commit) {
        await this.db.rollback();
      }
      throw error;
    }
  }

  async getStores() {
    try {
      const query = `
        SELECT id_store, id_user, name, store_code, street, ext_number, int_number,
               neighborhood, municipality, state, postal_code, country,
               latitude, longitude, i_status, dt_register, dt_updated
        FROM stores
        WHERE i_status = 1
        ORDER BY dt_register DESC
      `;
      return await this.db.select(query);
    } catch (error) {
      console.error("Error en getStores: ", error);
      throw error;
    }
  }

  async getStoreById(id_store: number) {
    try {
      const query = `
        SELECT id_store, id_user, name, store_code, street, ext_number, int_number,
               neighborhood, municipality, state, postal_code, country,
               latitude, longitude, i_status, dt_register, dt_updated
        FROM stores
        WHERE id_store = ?
      `;
      const stores = await this.db.select(query, [id_store]);
      return stores.length > 0 ? stores[0] : null;
    } catch (error) {
      console.error("Error en getStoreById: ", error);
      throw error;
    }
  }

  async updateStore(id_store: number, id_user: number, data: Partial<IStore>) {
    try {
      const fields: string[] = [];
      const values: any[] = [];

      const updatableFields: (keyof IStore)[] = [
        "name", "store_code", "street", "ext_number", "int_number",
        "neighborhood", "municipality", "state", "postal_code",
        "country", "latitude", "longitude"
      ];

      for (const field of updatableFields) {
        if (data[field] !== undefined) {
          fields.push(`${field} = ?`);
          values.push(data[field]);
        }
      }

      if (fields.length === 0) {
        return { success: false, message: "No hay campos para actualizar" };
      }

      values.push(id_store);

      const query = `UPDATE stores SET ${fields.join(", ")} WHERE id_store = ?`;
      await this.db.execute(query, values);
      return { success: true, message: "Tienda actualizada exitosamente" };
    } catch (error) {
      console.error("Error en updateStore: ", error);
      throw error;
    }
  }

  async deleteStore(id_store: number, id_user: number) {
    try {
      const query = `UPDATE stores SET i_status = 0 WHERE id_store = ?`;
      await this.db.execute(query, [id_store]);
      return { success: true, message: "Tienda eliminada exitosamente" };
    } catch (error) {
      console.error("Error en deleteStore: ", error);
      throw error;
    }
  }

  // ============ CRUD STORES_CLIENTS ============

  async assignStoreToClient(id_store: number, id_client: number, id_user_creator: number) {
    try {
      // Verificar si ya existe la relación
      const existing = await this.db.select(
        "SELECT id_store_client, i_status FROM stores_clients WHERE id_store = ? AND id_client = ?",
        [id_store, id_client]
      );

      if (existing.length > 0) {
        // Si existe pero está inactivo, reactivarlo
        if (existing[0].i_status === 0) {
          await this.db.execute(
            "UPDATE stores_clients SET i_status = 1 WHERE id_store_client = ?",
            [existing[0].id_store_client]
          );
          return { success: true, message: "Tienda reasignada al cliente exitosamente" };
        }
        throw new Error("La tienda ya está asignada a este cliente");
      }

      const query = `
        INSERT INTO stores_clients (id_store, id_client, id_user_creator)
        VALUES (?, ?, ?)
      `;
      const result = await this.db.execute(query, [id_store, id_client, id_user_creator]);

      return {
        id: result.insertId,
        message: "Tienda asignada al cliente exitosamente"
      };
    } catch (error) {
      console.error("Error en assignStoreToClient: ", error);
      throw error;
    }
  }

  async removeStoreFromClient(id_store: number, id_client: number) {
    try {
      const query = `
        UPDATE stores_clients 
        SET i_status = 0 
        WHERE id_store = ? AND id_client = ?
      `;
      await this.db.execute(query, [id_store, id_client]);

      return { ok: true, data: null, message: "Tienda desasignada del cliente exitosamente" };
    } catch (error) {
      console.error("Error en removeStoreFromClient: ", error);
      throw error;
    }
  }

  async getStoresByClient(id_client: number) {
    try {
      const query = `
        SELECT s.id_store, s.name, s.store_code, s.street, s.ext_number, 
               s.int_number, s.neighborhood, s.municipality, s.state, 
               s.postal_code, s.country, s.latitude, s.longitude,
               s.i_status, s.dt_register, s.dt_updated,
               sc.dt_created as dt_assigned
        FROM stores s
        INNER JOIN stores_clients sc ON s.id_store = sc.id_store
        WHERE sc.id_client = ? AND sc.i_status = 1 AND s.i_status = 1
        ORDER BY s.name ASC
      `;
      return await this.db.select(query, [id_client]);
    } catch (error) {
      console.error("Error en getStoresByClient: ", error);
      throw error;
    }
  }

  async getClientsByStore(id_store: number) {
    try {
      const query = `
        SELECT c.id_client, c.name, c.email, c.phone, c.rfc,
               sc.dt_created as dt_assigned
        FROM clients c
        INNER JOIN stores_clients sc ON c.id_client = sc.id_client
        WHERE sc.id_store = ? AND sc.i_status = 1 AND c.i_status = 1
        ORDER BY c.name ASC
      `;
      return await this.db.select(query, [id_store]);
    } catch (error) {
      console.error("Error en getClientsByStore: ", error);
      throw error;
    }
  }

  async getAvailableStoresForClient(id_client: number) {
    try {
      // Tiendas activas que NO están asignadas a este cliente
      const query = `
        SELECT s.id_store, s.name, s.store_code, s.municipality, s.state
        FROM stores s
        WHERE s.i_status = 1
        AND s.id_store NOT IN (
          SELECT id_store FROM stores_clients 
          WHERE id_client = ? AND i_status = 1
        )
        ORDER BY s.name ASC
      `;
      return await this.db.select(query, [id_client]);
    } catch (error) {
      console.error("Error en getAvailableStoresForClient: ", error);
      throw error;
    }
  } 

}
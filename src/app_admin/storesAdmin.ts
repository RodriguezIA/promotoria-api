import { Store } from '../app_superadmin/store';
import { Utils } from '../core/utils';

export interface CreateStorepayload {
    id_store?:number,
    id_store_client?:number,
    id_client: number;
    id_user_creator: number; 
    name: string;
    store_code: string;
    street: string;
    ext_number: string;
    int_number: string;
    neighborhood: string;
    municipality: string;
    state: string;
    postal_code: string;
    country: string;
    latitude: number,
    longitude: number,
}

export class storesAdmin extends Store {
    async createStoreAdmin(payload: CreateStorepayload){
        try {
            const createStore = await this.createStore(payload.id_user_creator, {
                ...payload,
                id_store: 0,
                id_user: payload.id_user_creator,
                i_status: true,
                dt_register: '',
                dt_updated: ''
            });

            const assignStore = await this.assignStoreToClient(createStore.id, payload.id_client, payload.id_user_creator);

            return assignStore
        } catch (error) {
            return error;
        }
    }

    async getStoreByIdClient(id_store_client: number){
        try {
            const store_query = `SELECT sc.id_store_client, s.id_store, sc.id_client, sc.i_status, sc.dt_created, sc.dt_updated, s.name, s.store_code, s.street, s.ext_number, s.int_number,
                                 s.neighborhood, s.municipality, s.state, s.postal_code, s.country, s.latitude, s.longitude FROM stores_clients sc INNER JOIN stores s ON s.id_store = sc.id_store
                                 WHERE sc.id_store_client = ? AND sc.i_status = 1
                                `;
            const result = await this.db.select(store_query, [id_store_client]);

            if (!result || result.length === 0) {
                return { 
                    ok: false,
                    data: null,
                    message: "Establecimiento no encontrado" 
                };
            }

            return {
                ok: true,
                data: result[0],
                message: "Tienda cargada correctamente"
            }
        } catch (error) {
            throw error;
        }
    }

    async getStoresForClient(id_client: number) {
        try {
            const query = `
                SELECT 
                    sc.id_store_client,
                    sc.id_store,
                    sc.id_client,
                    sc.id_user_creator,
                    sc.i_status,
                    sc.dt_created,
                    sc.dt_updated,
                    s.name,
                    s.store_code,
                    s.street,
                    s.ext_number,
                    s.int_number,
                    s.neighborhood,
                    s.municipality,
                    s.state,
                    s.postal_code,
                    s.country,
                    s.latitude,
                    s.longitude
                FROM stores_clients sc
                INNER JOIN stores s ON sc.id_store = s.id_store
                WHERE sc.id_client = ? AND sc.i_status = 1 AND s.i_status = 1
                ORDER BY s.name ASC
            `;
            return await this.db.select(query, [id_client]);
        } catch (error) {
            throw error;
        }
    }

    async updateStoreForClient(data_store_updated: CreateStorepayload) {
        try {
            // 1. Obtener datos actuales con un solo query
            const query_current = `
                SELECT 
                    sc.id_store_client,
                    sc.id_store,
                    s.name,
                    s.store_code,
                    s.street,
                    s.ext_number,
                    s.int_number,
                    s.neighborhood,
                    s.municipality,
                    s.state,
                    s.postal_code,
                    s.country,
                    s.latitude,
                    s.longitude
                FROM stores_clients sc
                INNER JOIN stores s ON s.id_store = sc.id_store
                WHERE sc.id_store_client = ? AND sc.i_status = 1
            `;
            
            const result = await this.db.select(query_current, [data_store_updated.id_store_client]);
            
            if (!result || result.length === 0) {
                return { success: false, message: "Establecimiento no encontrado" };
            }

            const store_stored = result[0];
            const id_store = store_stored.id_store;

            // 2. Comparar y construir campos a actualizar
            const comparableFields = [
                "name", "store_code", "street", "ext_number", "int_number",
                "neighborhood", "municipality", "state", "postal_code",
                "country", "latitude", "longitude"
            ] as const;

            const fieldsToUpdate: string[] = [];
            const values: any[] = [];

            for (const field of comparableFields) {
                const newValue = data_store_updated[field];
                const oldValue = store_stored[field];

                // Comparar como strings para evitar problemas de tipos
                const newStr = newValue !== undefined && newValue !== null ? String(newValue) : null;
                const oldStr = oldValue !== undefined && oldValue !== null ? String(oldValue) : null;

                if (newStr !== null && newStr !== oldStr) {
                    fieldsToUpdate.push(`${field} = ?`);
                    values.push(newValue);
                }
            }

            // 3. Si no hay cambios, retornar
            if (fieldsToUpdate.length === 0) {
                return { success: true, message: "No hay cambios que actualizar" };
            }

            // 4. Ejecutar UPDATE
            values.push(id_store);
            const query_update = `UPDATE stores SET ${fieldsToUpdate.join(", ")} WHERE id_store = ?`;

            await this.db.execute(query_update, values);

            return { success: true, message: "Establecimiento actualizado exitosamente" };

        } catch (error) {
            throw error;
        }
    }

    async deleteStoreForClient(id_store_client: number, id_user: number) {
        try {
            const store = await this.getStoreByIdClient(id_store_client);

            if (!store.ok) {
                return {
                    ok: false,
                    data: null,
                    message: "Tienda no encontrada"
                }
            }

            const remove_store = await this.removeStoreFromClient(store?.data?.id_store, store?.data?.id_client);

            if (!remove_store.ok) {
                return {
                    ok: false,
                    data: null,
                    message: "Tienda no se ha podido eliminar."
                }
            }


            return {
                ok: true,
                data: null,
                message: "Tienda eliminada correctamente."
            }
        } catch (error) {
            throw error;
        }
    }

    async importStoresFromExcel(id_client: number, id_user: number, rows: any[]) {
        let inserted = 0;
        let errors: { row: number; error: string }[] = [];
        let geocoded = 0;

        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];

            try {
                const store = {
                    name: row.Nombre || row.nombre || row.name || "",
                    store_code: row.Codigo || row.codigo || row.store_code || "",
                    street: row.Calle || row.calle || row.street || "",
                    ext_number: row.Numero_Ext || row.numero_ext || row.ext_number || "",
                    int_number: row.Numero_Int || row.numero_int || row.int_number || "",
                    neighborhood: row.Colonia || row.colonia || row.neighborhood || "",
                    municipality: row.Municipio || row.municipio || row.municipality || "",
                    state: row.Estado || row.estado || row.state || "",
                    postal_code: row.CP || row.cp || row.codigo_postal || row.postal_code || "",
                    country: row.Pais || row.pais || row.country || "México",
                    latitude: parseFloat(row.Latitud || row.latitud || row.latitude) || null,
                    longitude: parseFloat(row.Longitud || row.longitud || row.longitude) || null,
                };

                // Validar campos requeridos
                if (!store.name || !store.street || !store.municipality) {
                    errors.push({ row: i + 2, error: "Faltan campos requeridos (nombre, calle, municipio)" });
                    continue;
                }

                // Si no hay coordenadas, usar Geocoding
                if (!store.latitude || !store.longitude) {
                    const fullAddress = [
                        store.street,
                        store.ext_number,
                        store.neighborhood,
                        store.municipality,
                        store.state,
                        store.postal_code,
                        store.country
                    ].filter(Boolean).join(", ");

                    const geoResult = await Utils.geocodeAddress(fullAddress);

                    if (geoResult.latitude && geoResult.longitude) {
                        store.latitude = geoResult.latitude;
                        store.longitude = geoResult.longitude;
                        geocoded++;
                    }

                    // Pequeña pausa para no saturar la API (Google tiene límites)
                    await Utils.sleep(100);
                }

                // Insertar store
                const query_store = `
                    INSERT INTO stores (id_user, name, store_code, street, ext_number, int_number, 
                        neighborhood, municipality, state, postal_code, country, latitude, longitude, i_status)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
                `;

                const result_store = await this.db.execute(query_store, [
                    id_user,
                    store.name,
                    store.store_code,
                    store.street,
                    store.ext_number,
                    store.int_number,
                    store.neighborhood,
                    store.municipality,
                    store.state,
                    store.postal_code,
                    store.country,
                    store.latitude,
                    store.longitude
                ]);

                const id_store = result_store.insertId;

                // Insertar relación store_client
                const query_client = `
                    INSERT INTO stores_clients (id_client, id_store, i_status, id_user_creator)
                    VALUES (?, ?, 1, ?)
                `;
                await this.db.execute(query_client, [id_client, id_store, id_user]);
                inserted++;

            } catch (error) {
                errors.push({ row: i + 2, error: error instanceof Error ? error.message : String(error) });
            }
        }

        return {
            total: rows.length,
            inserted,
            geocoded, // Cuántas direcciones se geocodificaron
            failed: errors.length,
            errors: errors.slice(0, 10)
        };
    }
}


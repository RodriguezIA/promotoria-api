import db from "../config/database";
import { Database } from "../core/database";
import { RowDataPacket } from "mysql2/promise";
import { CreateServicePayload } from "../core/interfaces/service";
import { Utils } from "../core/utils";

interface ServiceRow extends RowDataPacket {
  id_service: number;
  vc_folio: string;
}

export class Service {
    protected db: Database = db;

    constructor(){}

    async registerService(payload: CreateServicePayload) {
        try {

            const vc_folio = await Utils.getCurrentFolio(payload.id_client, 1);

            const query = `
                INSERT INTO services (vc_folio, id_client, id_user, id_status)
                VALUES (?, ?, ?, 1)
            `;
            const params = [vc_folio, payload.id_client, payload.id_user];

            await this.db.query(query, params);

            await Utils.updateFolioCounter(payload.id_client, 1);

            const selectServiceId = `
                SELECT id_service FROM services
                WHERE vc_folio = ? AND id_client = ? LIMIT 1
            `;
            
            const serviceRows = await this.db.select<ServiceRow[]>(selectServiceId, [vc_folio, payload.id_client]);

            if (serviceRows.length === 0) {
                throw new Error("No se pudo obtener el ID del servicio registrado.");
            }
            
            const id_service = serviceRows[0].id_service;
            await Utils.registerServiceLog(this.db, id_service, payload.id_user, `Servicio registrado, folio: ${vc_folio}`, { id_negocio: payload.id_client });
            return id_service;
        } catch (error) {
            console.log("f.registerService: ", error);
        }
    }

}
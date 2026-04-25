import db from "../config/database";
import { Database } from "../core/database";
import { Utils } from "../core/utils";

interface CreateProductData {
  description?: string;
  vc_image?: string;
}

export class product {

    private db: Database = db;

    constructor(){}

    async createProduct(
        id_user: number,
        id_client: number,
        name: string,
        data: CreateProductData = {}
    ) {
        let commit = false;
        try {
            if (!this.db.inTransaction) {
                await this.db.beginTransaction();
                commit = true;
            }

            const fields = ["id_user", "id_client", "name"];
            const values: any[] = [id_user, id_client, name];
            const placeholders = ["?", "?", "?"];

            if (data.description) {
                fields.push("description");
                values.push(data.description);
                placeholders.push("?");
            }

            if (data.vc_image) {
                fields.push("vc_image");
                values.push(data.vc_image);
                placeholders.push("?");
            }

            const query = `INSERT INTO products (${fields.join(", ")}) VALUES (${placeholders.join(", ")})`;
            const result = await this.db.execute(query, values);

            const productId = result.insertId;


            if (commit) {
                await this.db.commit();
            }

            return {
                id: productId,
                message: "Producto creado exitosamente"
            };
        } catch (error) {
            if (commit) {
                await this.db.rollback();
            }
            throw error;
        }
    }

    async getProductsByClient(id_client: number) {
        try {
            const query = `
                SELECT id_product, name, description, vc_image, i_status, dt_created, dt_updated 
                FROM products 
                WHERE id_client = ? AND i_status = 1
            `;
            return await this.db.select(query, [id_client]);
        } catch (error) {
            console.error("Error en getProductsByClient: ", error);
            throw error;
        }
    }

    async getProductById(id_product: number) {
        try {
            const query = `
                SELECT id_product, id_user, id_client, name, description, vc_image, i_status, dt_created, dt_updated 
                FROM products 
                WHERE id_product = ?
            `;
            const products = await this.db.select(query, [id_product]);
            return products.length > 0 ? products[0] : null;
        } catch (error) {
            console.error("Error en getProductById: ", error);
            throw error;
        }
    }
    

    async uploadProductImage(id_client: number,
    id_product: number,
    fileBuffer: Buffer): Promise<string> {
        const { UploadService } = await import("../services/upload.service");
        return await UploadService.uploadProductImage(id_client, id_product, fileBuffer);
    }

    async updateProductImage(id_product: number, imageUrl: string) {
        try {
            const query = `UPDATE products SET vc_image = ? WHERE id_product = ?`;
            await this.db.execute(query, [imageUrl, id_product]);
            return { success: true };
        } catch (error) {
            console.error("Error en updateProductImage:", error);
            throw error;
        }
    }

    async updateProduct(
        id_product: number,
        id_user: number,
        data: { name?: string; description?: string }
    ) {
        try {
            const fields: string[] = [];
            const values: any[] = [];
            const changes: string[] = [];

            if (data.name !== undefined) {
                fields.push("name = ?");
                values.push(data.name);
                changes.push(`nombre: ${data.name}`);
            }

            if (data.description !== undefined) {
                fields.push("description = ?");
                values.push(data.description);
                changes.push(`descripción actualizada`);
            }

            if (fields.length === 0) {
                return { success: false, message: "No hay campos para actualizar" };
            }

            values.push(id_product);

            const query = `UPDATE products SET ${fields.join(", ")} WHERE id_product = ?`;
            await this.db.execute(query, values);

            return { success: true, message: "Producto actualizado exitosamente" };
        } catch (error) {
            throw error;
        }
    }

    async deleteProduct(id_product: number, id_user: number) {
        try {
            const query = `UPDATE products SET i_status = 0 WHERE id_product = ?`;
            await this.db.execute(query, [id_product]);

            return { success: true, message: "Producto eliminado exitosamente" };
        } catch (error) {
            throw error;
        }
    }
}
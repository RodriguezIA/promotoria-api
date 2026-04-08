import { Storage } from "@google-cloud/storage";
import sharp from "sharp";
import * as fs from "fs";
import * as path from "path";


const keyPath = path.resolve(process.cwd(), "keys/gcp-service-account.json");
const credentials = JSON.parse(fs.readFileSync(keyPath, "utf-8"));

const storage = new Storage({
  projectId: process.env.GCP_PROJECT_ID,
  credentials,
});

const bucket = storage.bucket(process.env.GCP_BUCKET_NAME!);

export class UploadService {

  static async uploadProductImage(id_client: number, id_product: number, fileBuffer: Buffer): Promise<string> {
    try{
      const optimizedBuffer = await sharp(fileBuffer).webp({ quality: 80 }).resize(800, 800, { fit: "inside", withoutEnlargement: true }).toBuffer();
      const path = `clients/${id_client}/products/${id_product}/main.webp`;
      const file = bucket.file(path);

      await file.save(optimizedBuffer, {
        metadata: {
          contentType: "image/webp",
          cacheControl: "public, max-age=31536000",
        },
      });

      return `https://storage.googleapis.com/${process.env.GCP_BUCKET_NAME}/${path}`;
    } catch (error) {
      console.error("Error al subir la imagen:", error);
      throw new Error("Error al subir la imagen");
    }
  }

  static async deleteProductImage(id_client: number, id_product: number): Promise<void> {
    try {
      const path = `clients/${id_client}/products/${id_product}/main.webp`;
      await bucket.file(path).delete();
    } catch (error) {
      console.log("Imagen no encontrada o ya eliminada");
    }
  }

  static async uploadClientDoc(id_client: number, fileBuffer: Buffer, fileName: string, mimeType: string): Promise<string> {
    try {
      const path = `clients/${id_client}/docs/${fileName}`;
      const file = bucket.file(path);

      await file.save(fileBuffer, {
        metadata: {
          contentType: mimeType,
          cacheControl: "public, max-age=31536000",
        },
      });

      return `https://storage.googleapis.com/${process.env.GCP_BUCKET_NAME}/${path}`;
    } catch (error) {
      console.error("Error al subir el documento:", error);
      throw new Error("Error al subir el documento");
    }
  }
}
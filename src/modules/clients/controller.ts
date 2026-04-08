import { Request, Response, } from 'express'

import { Client } from './client.service'

import { createClientData } from './client.dto';

import { UploadService } from '../../services/upload.service';

const clientService = new Client();

export const createClient = async(req: Request, res: Response) => {
    const clientData: createClientData = req.body;
    try {
        const client = await clientService.createClient(clientData);
        res.status(201).json({
            ok: true,
            error: 0,
            data: client,
            message: 'Cliente creado exitosamente'
        });
    } catch (error) {
        res.status(500).json({
            ok: false,
            error: 1,
            data: null,
            message: 'Error al crear el cliente'
        });
    }
}

export const getClient = async (req: Request, res: Response) => {
    const { id_client } = req.params;
    try {
        const client = await clientService.getClient(Number(id_client));
        
        if (client) {
            res.json({
                ok: true,
                error: 0,
                data: client,
                message: 'Cliente obtenido exitosamente'
            });
        } else {
            res.status(404).json({
                ok: false,
                error: 1,
                data: null,
                message: 'Cliente no encontrado'
            });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({
            ok: false,
            error: 1,
            data: null,
            message: 'Error al obtener el cliente'
        });
    }
}

export const uploadClientDoc = async (req: Request, res: Response) => {
  const { id_client } = req.params;

  if (!req.file) {
    res.status(400).json({ ok: false, error: 1, data: null, message: 'No se recibió archivo' });
    return;
  }

  try {
    const url = await UploadService.uploadClientDoc(
      Number(id_client),
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype
    );

    await clientService.updateSituacionFiscal(Number(id_client), url); // 👈

    res.json({
      ok: true,
      error: 0,
      data: { url },
      message: 'Documento subido exitosamente'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false, error: 1, data: null, message: 'Error al subir documento' });
  }
};
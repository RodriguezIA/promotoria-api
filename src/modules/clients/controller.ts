import { Request, Response, } from 'express'

import { Utils } from '../../core/utils'
import { Client } from './client.service'
import { createClientData } from './client.dto'
import { UploadService } from '../../services/upload.service'


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

    const clientId = Number(id_client);
    if (isNaN(clientId)) {
        return res.status(400).json({
            ok: false,
            error: 1,
            data: null,
            message: 'El ID del cliente debe ser un número válido'
        });
    }

    try {
        const client = await clientService.getClient(clientId);
        
        if (client) {
            const address = await clientService.getAddressByIdClient(client.id_client);

            return res.json({
                ok: true,
                error: 0,
                data: { ...client, address },
                message: 'Cliente obtenido exitosamente'
            });
        } 
        
        return res.status(404).json({
            ok: false,
            error: 1,
            data: null,
            message: 'Cliente no encontrado'
        });
        
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            ok: false,
            error: 1,
            data: null,
            message: 'Error al obtener el cliente'
        });
    }
}

export const getClientsList = async (req: Request, res: Response) => {
    try {
        
        const clients = await clientService.getClientsList();

        return res.json({
            ok: true,
            error: 0,
            data: clients,
            message: 'Clientes obtenidos exitosamente'
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            ok: false,
            error: 1,
            data: null,
            message: 'Error al obtener la lista de clientes'
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

export const deleteClient = async (req: Request, res: Response) => {
    const { id_client } = req.params;
    const id_user = req.user?.id;

    try {
        const client = await clientService.getClient(Number(id_client));

        if (!client) {

            return res.status(404).json({
                ok: false,
                error: 1,
                data: null,
                message: 'Cliente no encontrado'
            });
        }

        if (client.id_user !== id_user) {
            return res.status(403).json({
                ok: false,
                error: 1,
                data: null,
                message: 'No tienes permiso para eliminar este',
            });
        }

        const result = await clientService.deleteClient(Number(id_client), id_user);

        return res.json({
            ok: true,
            error: 0,
            data: result,
            message: 'Cliente eliminado exitosamente'
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            ok: false,
            error: 1,
            data: null,
            message: 'Error al eliminar el cliente'
        });
    }
}
        

export const getCountriesList = async (req: Request, res: Response) => {
    try {
        const countries = await Utils.getCountriesList();
        res.json({
            ok: true,
            error: 0,
            data: countries,
            message: 'Paises obtenidos exitosamente'
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            ok: false,
            error: 1,
            data: null,
            message: 'Error al obtener la lista de paises'
        });
    }
}

export const getStatesList = async (req: Request, res: Response) => {
    const { id_pais } = req.params;
    try {
        const states = await Utils.getStatesList(Number(id_pais));
        res.json({
            ok: true,
            error: 0,
            data: states,
            message: 'Estados obtenidos exitosamente'
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            ok: false,
            error: 1,
            data: null,
            message: 'Error al obtener la lista de estados'
        });
    }
}

export const getCitiesList = async (req: Request, res: Response) => {
    const { id_estado } = req.params;
    try {
        const cities = await Utils.getCitiesList(Number(id_estado));
        res.json({
            ok: true,
            error: 0,
            data: cities,
            message: 'Ciudades obtenidos exitosamente'
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            ok: false,
            error: 1,
            data: null,
            message: 'Error al obtener la lista de ciudades'
        });
    }
}
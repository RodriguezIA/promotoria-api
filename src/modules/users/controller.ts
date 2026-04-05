import { Request, Response } from 'express';
import { UserAdminDTO } from "./user.dto"

const userAdminDTO = new UserAdminDTO();

export const getAllUsersByClientId = async (req: Request, res: Response) => {
    const { id_client } = req.params;

    try {
        const users = await userAdminDTO.getAllUsersByClientId(Number(id_client));
        res.json({
            ok: true,
            error: 0,
            data: users,
            message: 'Usuarios obtenidos exitosamente'
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            ok: false,
            error: 1,
            data: null,
            message: 'Error al obtener los usuarios'
        });
    }
}
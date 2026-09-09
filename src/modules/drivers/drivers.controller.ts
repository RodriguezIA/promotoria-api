import { Request, Response } from 'express'
import { Drivers } from './drivers.service'
import { Utils } from '../../core/utils'
import { StorageService } from '../../services/storage.service'

const driversService = new Drivers()

export const createDriver = async (req: Request, res: Response) => {
    try {
        const id_client = req.user!.id_client
        const { name, phone, email, password } = req.body
        if (!name || !phone || !password) {
            res.status(400).json({ ok: false, error: 1, data: null, message: 'name, phone y password son requeridos' })
            return
        }
        const driver = await driversService.create({ id_client, name, phone, email, password })
        res.status(201).json({ ok: true, error: 0, data: driver, message: 'Chofer creado exitosamente' })
    } catch (error) {
        console.error('CREATE DRIVER ERROR:', error)
        res.status(500).json({ ok: false, error: 1, data: null, message: 'Error al crear el chofer' })
    }
}

export const listDrivers = async (req: Request, res: Response) => {
    try {
        const id_client = req.user!.id_client
        const drivers = await driversService.listByClient(id_client)
        res.status(200).json({ ok: true, error: 0, data: drivers, message: 'Choferes obtenidos exitosamente' })
    } catch (error) {
        console.error('LIST DRIVERS ERROR:', error)
        res.status(500).json({ ok: false, error: 1, data: null, message: 'Error al obtener los choferes' })
    }
}

// Solo para el master: ver los choferes de cualquier cliente, no solo el
// propio (i_rol !== 1 nunca tiene id_client=0, asi que este endpoint solo
// tiene sentido para el rol de master/superadmin).
export const listDriversByClient = async (req: Request, res: Response) => {
    try {
        if (req.user!.i_rol !== 1) {
            res.status(403).json({ ok: false, error: 1, data: null, message: 'No autorizado' })
            return
        }
        const id_client = Number(req.params.id_client)
        const drivers = await driversService.listByClient(id_client)
        res.status(200).json({ ok: true, error: 0, data: drivers, message: 'Choferes obtenidos exitosamente' })
    } catch (error) {
        console.error('LIST DRIVERS BY CLIENT ERROR:', error)
        res.status(500).json({ ok: false, error: 1, data: null, message: 'Error al obtener los choferes' })
    }
}

export const deactivateDriver = async (req: Request, res: Response) => {
    try {
        const id_client = req.user!.id_client
        const id_driver = Number(req.params.id_driver)
        await driversService.deactivate(id_driver, id_client)
        res.status(200).json({ ok: true, error: 0, data: null, message: 'Chofer dado de baja exitosamente' })
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Error al dar de baja al chofer'
        res.status(400).json({ ok: false, error: 1, data: null, message })
    }
}

export const suspendDriver = async (req: Request, res: Response) => {
    try {
        const id_client = req.user!.id_client
        const id_driver = Number(req.params.id_driver)
        const driver = await driversService.suspend(id_driver, id_client)
        res.status(200).json({ ok: true, error: 0, data: driver, message: 'Chofer suspendido exitosamente' })
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Error al suspender al chofer'
        res.status(400).json({ ok: false, error: 1, data: null, message })
    }
}

// Solo el master puede resetear la contraseña de un chofer a "1234".
export const resetDriverPassword = async (req: Request, res: Response) => {
    try {
        if (req.user!.i_rol !== 1) {
            res.status(403).json({ ok: false, error: 1, data: null, message: 'No autorizado' })
            return
        }
        const id_driver = Number(req.params.id_driver)
        await driversService.resetPasswordToDefault(id_driver)
        res.status(200).json({ ok: true, error: 0, data: null, message: 'Contraseña restablecida a 1234' })
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Error al restablecer la contraseña'
        res.status(400).json({ ok: false, error: 1, data: null, message })
    }
}

export const reactivateDriver = async (req: Request, res: Response) => {
    try {
        const id_client = req.user!.id_client
        const id_driver = Number(req.params.id_driver)
        const driver = await driversService.reactivate(id_driver, id_client)
        res.status(200).json({ ok: true, error: 0, data: driver, message: 'Chofer reactivado exitosamente' })
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Error al reactivar al chofer'
        res.status(400).json({ ok: false, error: 1, data: null, message })
    }
}

export const updateDriver = async (req: Request, res: Response) => {
    try {
        const id_client = req.user!.id_client
        const id_driver = Number(req.params.id_driver)
        const driver = await driversService.update(id_driver, id_client, req.body)
        res.status(200).json({ ok: true, error: 0, data: driver, message: 'Chofer actualizado exitosamente' })
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Error al actualizar el chofer'
        res.status(400).json({ ok: false, error: 1, data: null, message })
    }
}

export const uploadDriverPhoto = async (req: Request, res: Response) => {
    try {
        const id_driver = Number(req.params.id_driver)
        const file = req.file
        if (!file) {
            res.status(400).json({ ok: false, error: 1, data: null, message: 'No se recibió ninguna imagen' })
            return
        }
        const { url } = await StorageService.uploadAsset({
            entity: 'promoter', // reutiliza el mismo bucket de fotos de perfil
            entity_id: id_driver,
            buffer: file.buffer,
            mime: file.mimetype,
        })
        const driver = await driversService.update(id_driver, req.user!.id_client, { vc_photo: url })
        res.status(200).json({ ok: true, error: 0, data: driver, message: 'Foto actualizada exitosamente' })
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Error al subir la foto'
        res.status(400).json({ ok: false, error: 1, data: null, message })
    }
}

// ── Login y sesión del propio chofer ──

export const driverLogin = async (req: Request, res: Response) => {
    try {
        const { phone, password } = req.body
        if (!phone || !password) {
            res.status(400).json({ ok: false, error: 1, data: null, message: 'phone y password son requeridos' })
            return
        }
        const driver = await driversService.login(phone, password)
        const payload = { id: driver.id_driver, id_client: driver.id_client, type: 'driver' as const }
        const token = Utils.generate_token(payload as any)
        res.status(200).json({
            ok: true, error: 0,
            data: { token, driver: { id_driver: driver.id_driver, id_client: driver.id_client, name: driver.name, phone: driver.phone, email: driver.email, vc_photo: driver.vc_photo, must_change_password: driver.must_change_password } },
            message: 'Inicio de sesión exitoso',
        })
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Error al iniciar sesión'
        res.status(401).json({ ok: false, error: 1, data: null, message })
    }
}

export const getDriverProfile = async (req: Request, res: Response) => {
    try {
        const driver = await driversService.getById(req.user!.id)
        res.status(200).json({ ok: true, error: 0, data: driver, message: 'Perfil obtenido exitosamente' })
    } catch (error) {
        res.status(500).json({ ok: false, error: 1, data: null, message: 'Error al obtener el perfil' })
    }
}

export const updateDriverPassword = async (req: Request, res: Response) => {
    try {
        const { current_password, new_password } = req.body
        if (!current_password || !new_password) {
            res.status(400).json({ ok: false, error: 1, data: null, message: 'current_password y new_password son requeridos' })
            return
        }
        await driversService.changePassword(req.user!.id, current_password, new_password)
        res.status(200).json({ ok: true, error: 0, data: null, message: 'Contraseña actualizada exitosamente' })
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Error al cambiar la contraseña'
        res.status(400).json({ ok: false, error: 1, data: null, message })
    }
}

export const updateDriverLocation = async (req: Request, res: Response) => {
    try {
        const { latitude, longitude } = req.body
        if (latitude === undefined || longitude === undefined) {
            res.status(400).json({ ok: false, error: 1, data: null, message: 'latitude y longitude son requeridos' })
            return
        }
        await driversService.updateLocation(req.user!.id, Number(latitude), Number(longitude))
        res.status(200).json({ ok: true, error: 0, data: null, message: 'Ubicación actualizada exitosamente' })
    } catch (error) {
        res.status(500).json({ ok: false, error: 1, data: null, message: 'Error al actualizar la ubicación' })
    }
}

// Para el login unificado: saber si un celular ya es un chofer registrado,
// sin necesitar la contraseña todavia.
export const checkDriverPhone = async (req: Request, res: Response) => {
    try {
        const phone = String(req.params.phone || '').trim()
        if (!phone) {
            res.status(400).json({ ok: false, error: 1, data: null, message: 'Telefono requerido' })
            return
        }
        const exists = await driversService.checkPhoneExists(phone)
        res.status(200).json({ ok: true, error: 0, data: { exists }, message: 'Consulta exitosa' })
    } catch (error) {
        res.status(500).json({ ok: false, error: 1, data: null, message: 'Error al verificar el telefono' })
    }
}

export const createStoreByDriver = async (req: Request, res: Response) => {
    try {
        const id_driver = req.user!.id
        const store = await driversService.createStore(id_driver, req.body)
        res.status(201).json({ ok: true, error: 0, data: store, message: 'Tienda dada de alta exitosamente' })
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Error al dar de alta la tienda'
        res.status(400).json({ ok: false, error: 1, data: null, message })
    }
}
